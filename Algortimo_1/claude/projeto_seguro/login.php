<?php
// ============================================================
//  login.php — Backend seguro de autenticação
//  OWASP: A01 Broken Access Control, A02 Crypto, A03 Injection,
//         A05 Security Misconfiguration, A07 Auth Failures
// ============================================================

// ---------- 1. CONFIGURAÇÕES (edite aqui) -------------------
define('DB_HOST', 'localhost');
define('DB_NAME', 'login_seguro');
define('DB_USER', 'root');          // ← troque pelo seu usuário MySQL
define('DB_PASS', 'SUA_SENHA_DB');  // ← troque pela sua senha MySQL

define('MAX_TENTATIVAS',  5);       // tentativas antes do bloqueio
define('JANELA_MINUTOS',  15);      // janela de tempo do rate limiting
define('SESSION_LIFETIME', 1800);   // sessão expira em 30 min de inatividade
// ------------------------------------------------------------

// ---------- 2. CABEÇALHOS DE SEGURANÇA ----------------------
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: no-referrer');
header('Content-Type: application/json; charset=utf-8');

// ---------- 3. CONFIGURAÇÃO DE SESSÃO SEGURA ----------------
ini_set('session.cookie_httponly', 1);   // JavaScript não acessa o cookie
ini_set('session.cookie_secure', 1);     // HTTPS apenas (remova se não tiver HTTPS ainda)
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_strict_mode', 1);
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);
session_start();

// ---------- 4. HELPERS INTERNOS -----------------------------

/**
 * Responde JSON e encerra o script.
 */
function responder(bool $ok, string $mensagem, int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode(['ok' => $ok, 'mensagem' => $mensagem]);
    exit;
}

/**
 * Retorna conexão PDO com configurações seguras.
 * Prepared statements evitam SQL Injection (OWASP A03).
 */
function conectarBD(): PDO {
    try {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
        $opcoes = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false, // força prepared statements reais
        ];
        return new PDO($dsn, DB_USER, DB_PASS, $opcoes);
    } catch (PDOException $e) {
        // NUNCA expor detalhes do erro para o cliente (OWASP A05)
        error_log('Erro de conexão BD: ' . $e->getMessage());
        responder(false, 'Erro interno do servidor.', 500);
    }
}

/**
 * Obtém o IP real do cliente (considera proxies comuns).
 */
function obterIP(): string {
    $candidatos = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    foreach ($candidatos as $chave) {
        if (!empty($_SERVER[$chave])) {
            $ip = trim(explode(',', $_SERVER[$chave])[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }
    }
    return '0.0.0.0';
}

/**
 * Verifica se o IP/email excedeu o limite de tentativas.
 * Proteção contra Brute Force (OWASP A07).
 */
function estaBloqueado(PDO $pdo, string $ip, string $email): bool {
    $sql = "SELECT COUNT(*) FROM tentativas_login
            WHERE ip = :ip
              AND tentativa_em > DATE_SUB(NOW(), INTERVAL :janela MINUTE)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':ip' => $ip, ':janela' => JANELA_MINUTOS]);
    return (int) $stmt->fetchColumn() >= MAX_TENTATIVAS;
}

/**
 * Registra uma tentativa de login mal-sucedida.
 */
function registrarTentativa(PDO $pdo, string $ip, string $email): void {
    $stmt = $pdo->prepare(
        "INSERT INTO tentativas_login (ip, email) VALUES (:ip, :email)"
    );
    $stmt->execute([':ip' => $ip, ':email' => $email]);
}

/**
 * Valida o token CSRF enviado no formulário.
 * Proteção contra Cross-Site Request Forgery (OWASP A01).
 */
function validarCSRF(string $tokenEnviado): bool {
    return isset($_SESSION['csrf_token'])
        && hash_equals($_SESSION['csrf_token'], $tokenEnviado);
}

// ---------- 5. ROTEADOR DE AÇÕES ----------------------------
$acao = $_POST['acao'] ?? $_GET['acao'] ?? '';

switch ($acao) {

    // ---- 5a. Gerar token CSRF (chamado ao carregar a página) --
    case 'csrf_token':
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        header('Content-Type: application/json');
        echo json_encode(['token' => $_SESSION['csrf_token']]);
        exit;

    // ---- 5b. Processar login ----------------------------------
    case 'login':
        // Aceitar apenas POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            responder(false, 'Método não permitido.', 405);
        }

        $ip    = obterIP();
        $email = trim($_POST['email'] ?? '');
        $senha = $_POST['senha'] ?? '';
        $csrf  = $_POST['csrf_token'] ?? '';

        // Validar CSRF antes de qualquer outra coisa
        if (!validarCSRF($csrf)) {
            responder(false, 'Requisição inválida.', 403);
        }

        // Validar formato básico dos campos
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($senha) < 1) {
            responder(false, 'Credenciais inválidas.', 401); // mensagem genérica (OWASP)
        }

        $pdo = conectarBD();

        // Verificar rate limiting ANTES de consultar o banco
        if (estaBloqueado($pdo, $ip, $email)) {
            responder(false,
                'Muitas tentativas. Aguarde ' . JANELA_MINUTOS . ' minutos.',
                429
            );
        }

        // Buscar usuário — prepared statement evita SQL Injection
        $stmt = $pdo->prepare(
            "SELECT id, email, senha_hash, nome FROM usuarios
             WHERE email = :email AND ativo = 1 LIMIT 1"
        );
        $stmt->execute([':email' => $email]);
        $usuario = $stmt->fetch();

        // password_verify faz comparação em tempo constante (sem timing attack)
        // A mensagem de erro é IDÊNTICA seja e-mail ou senha errados (evita enumeração)
        if (!$usuario || !password_verify($senha, $usuario['senha_hash'])) {
            registrarTentativa($pdo, $ip, $email);
            responder(false, 'Credenciais inválidas.', 401);
        }

        // ----- LOGIN BEM-SUCEDIDO -----

        // Regenerar ID de sessão para evitar Session Fixation (OWASP A07)
        session_regenerate_id(true);

        // Salvar dados mínimos na sessão (nunca armazenar senha)
        $_SESSION['usuario_id']   = $usuario['id'];
        $_SESSION['usuario_nome'] = htmlspecialchars($usuario['nome'], ENT_QUOTES, 'UTF-8');
        $_SESSION['logado_em']    = time();

        // Gerar novo token CSRF para a sessão autenticada
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        // Atualizar último login
        $pdo->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = :id")
            ->execute([':id' => $usuario['id']]);

        responder(true, 'Login realizado com sucesso!');
        break;

    // ---- 5c. Verificar se está logado ------------------------
    case 'verificar':
        $logado = isset($_SESSION['usuario_id']);

        // Verificar inatividade da sessão
        if ($logado && isset($_SESSION['logado_em'])) {
            if (time() - $_SESSION['logado_em'] > SESSION_LIFETIME) {
                session_destroy();
                responder(false, 'Sessão expirada.', 401);
            }
            $_SESSION['logado_em'] = time(); // renovar atividade
        }

        header('Content-Type: application/json');
        echo json_encode([
            'logado' => $logado,
            'nome'   => $logado
                ? htmlspecialchars($_SESSION['usuario_nome'], ENT_QUOTES, 'UTF-8')
                : null,
        ]);
        exit;

    // ---- 5d. Logout ------------------------------------------
    case 'logout':
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        session_destroy();
        responder(true, 'Logout realizado.');
        break;

    default:
        responder(false, 'Ação desconhecida.', 400);
}