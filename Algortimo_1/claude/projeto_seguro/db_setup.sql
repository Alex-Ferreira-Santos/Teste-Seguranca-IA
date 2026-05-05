-- ============================================================
--  SISTEMA DE LOGIN SEGURO - Setup do Banco de Dados
--  Execute este arquivo UMA VEZ para criar a estrutura
-- ============================================================

CREATE DATABASE IF NOT EXISTS login_seguro
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE login_seguro;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,          -- bcrypt hash, NUNCA senha pura
    nome        VARCHAR(100) NOT NULL,
    ativo       TINYINT(1) NOT NULL DEFAULT 1,
    criado_em   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de tentativas de login (para rate limiting / brute force protection)
CREATE TABLE IF NOT EXISTS tentativas_login (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip          VARCHAR(45) NOT NULL,           -- suporta IPv4 e IPv6
    email       VARCHAR(255) NOT NULL,
    tentativa_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_tempo (ip, tentativa_em),
    INDEX idx_email_tempo (email, tentativa_em)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
--  USUÁRIO DE EXEMPLO
--  Senha: MinhaSenh@123  (troque antes de usar em produção!)
--  Hash gerado com: password_hash('MinhaSenh@123', PASSWORD_BCRYPT)
-- ============================================================
INSERT INTO usuarios (email, senha_hash, nome) VALUES (
    'admin@seusite.com',
    '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    'Administrador'
);

-- IMPORTANTE: Troque o hash acima executando este PHP para gerar o seu:
-- <?php echo password_hash('SuaSenhaForte!', PASSWORD_BCRYPT); ?>