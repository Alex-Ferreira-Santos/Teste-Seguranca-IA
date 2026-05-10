const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Caminho do banco JSON
const DB_PATH = path.join(__dirname, 'database.json');

// ==================== UTILITÁRIOS ====================

// Inicializar banco de dados
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    const initialData = {
      users: [],
      webhooks: [],
      executions: []
    };
    await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2));
  }
}

// Ler banco
async function readDB() {
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

// Escrever banco
async function writeDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// Validar URL
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// Verificar se URL é bloqueada (evita localhost e IPs privados)
function isBlockedUrl(url) {
  const blockedPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '192.168.',
    '10.0.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.'
  ];
  
  const urlLower = url.toLowerCase();
  return blockedPatterns.some(pattern => urlLower.includes(pattern));
}

// Gerar token de autenticação
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Autenticar usuário via token
async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  const db = await readDB();
  const user = db.users.find(u => u.token === token);
  
  if (!user) {
    return res.status(401).json({ error: 'Token inválido' });
  }
  
  req.user = user;
  next();
}

// ==================== ROTAS PÚBLICAS ====================

// Criar conta (gera token automaticamente)
app.post('/api/register', async (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e email são obrigatórios' });
  }
  
  const db = await readDB();
  
  // Verificar se email já existe
  if (db.users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
  
  const newUser = {
    id: crypto.randomUUID(),
    name,
    email,
    token: generateToken(),
    createdAt: new Date().toISOString()
  };
  
  db.users.push(newUser);
  await writeDB(db);
  
  res.json({
    message: 'Usuário criado com sucesso',
    token: newUser.token,
    userId: newUser.id
  });
});

// ==================== ROTAS PROTEGIDAS ====================

// Configurar webhook
app.post('/api/webhook/config', authenticateUser, async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL é obrigatória' });
  }
  
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'URL inválida. Use http:// ou https://' });
  }
  
  if (isBlockedUrl(url)) {
    return res.status(400).json({ error: 'URL não permitida (endereços internos bloqueados)' });
  }
  
  const db = await readDB();
  
  // Verificar se já existe configuração para este usuário
  const existingIndex = db.webhooks.findIndex(w => w.userId === req.user.id);
  
  const webhookConfig = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    url: url,
    eventType: 'acao_concluida',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (existingIndex !== -1) {
    db.webhooks[existingIndex] = { ...db.webhooks[existingIndex], ...webhookConfig };
  } else {
    db.webhooks.push(webhookConfig);
  }
  
  await writeDB(db);
  
  res.json({
    message: 'Webhook configurado com sucesso',
    config: {
      url: webhookConfig.url,
      eventType: webhookConfig.eventType,
      active: webhookConfig.active
    }
  });
});

// Consultar configuração atual
app.get('/api/webhook/config', authenticateUser, async (req, res) => {
  const db = await readDB();
  const config = db.webhooks.find(w => w.userId === req.user.id);
  
  res.json({
    hasConfig: !!config,
    config: config || null
  });
});

// Remover webhook
app.delete('/api/webhook/config', authenticateUser, async (req, res) => {
  const db = await readDB();
  db.webhooks = db.webhooks.filter(w => w.userId !== req.user.id);
  await writeDB(db);
  
  res.json({ message: 'Webhook removido com sucesso' });
});

// Simular execução de uma ação (dispara o webhook)
app.post('/api/acao/completar', authenticateUser, async (req, res) => {
  const { acaoId, descricao, dados } = req.body;
  
  const db = await readDB();
  const webhookConfig = db.webhooks.find(w => w.userId === req.user.id && w.active);
  
  const executionResult = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    timestamp: new Date().toISOString(),
    acao: {
      id: acaoId || crypto.randomUUID(),
      descricao: descricao || 'Ação executada via API',
      dados: dados || {}
    },
    webhookDisparado: false,
    webhookResposta: null,
    webhookErro: null
  };
  
  // Se tem webhook configurado, dispara
  if (webhookConfig) {
    const payload = {
      event: 'acao_concluida',
      timestamp: executionResult.timestamp,
      userId: req.user.id,
      userName: req.user.name,
      acao: executionResult.acao
    };
    
    try {
      const response = await axios.post(webhookConfig.url, payload, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateWebhookSignature(payload, req.user.id)
        }
      });
      
      executionResult.webhookDisparado = true;
      executionResult.webhookResposta = {
        status: response.status,
        data: response.data
      };
      
    } catch (error) {
      executionResult.webhookErro = {
        message: error.message,
        code: error.code,
        status: error.response?.status
      };
    }
  }
  
  // Salvar execução
  db.executions.push(executionResult);
  await writeDB(db);
  
  res.json({
    message: 'Ação completada com sucesso',
    executionId: executionResult.id,
    webhookDisparado: executionResult.webhookDisparado,
    resultado: executionResult.webhookResposta,
    erro: executionResult.webhookErro
  });
});

// Consultar histórico de execuções
app.get('/api/execucoes', authenticateUser, async (req, res) => {
  const db = await readDB();
  const executions = db.executions
    .filter(e => e.userId === req.user.id)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50); // últimas 50
  
  res.json({ executions });
});

// Função para gerar assinatura (segurança)
function generateWebhookSignature(payload, userId) {
  const secret = process.env.SECRET_KEY + userId;
  const payloadString = JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(payloadString).digest('hex');
}

// ==================== TESTE (Endpoint público para testes) ====================
// Cria um webhook de teste que apenas loga e retorna sucesso
app.post('/webhook-test', (req, res) => {
  console.log('📨 Webhook de teste recebido:', {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    body: req.body
  });
  
  res.json({
    status: 'success',
    message: 'Webhook de teste funcionando!',
    receivedAt: new Date().toISOString(),
    data: req.body
  });
});

// ==================== INTERFACE WEB ====================
// Criar pasta public e arquivos estáticos
const publicDir = path.join(__dirname, 'public');
const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Webhooks</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-bottom: 10px; }
        h2 { color: #555; margin-bottom: 20px; font-size: 1.3em; }
        .subtitle { color: #666; margin-bottom: 30px; }
        input, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s, background 0.2s;
        }
        button:hover {
            background: #5a67d8;
            transform: translateY(-2px);
        }
        button.danger {
            background: #e53e3e;
        }
        button.danger:hover {
            background: #c53030;
        }
        button.success {
            background: #48bb78;
        }
        .status {
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .status.success {
            background: #c6f6d5;
            color: #22543d;
            border: 1px solid #9ae6b4;
        }
        .status.error {
            background: #fed7d7;
            color: #742a2a;
            border: 1px solid #fc8181;
        }
        .status.info {
            background: #bee3f8;
            color: #2c5282;
            border: 1px solid #90cdf4;
        }
        .webhook-info {
            background: #f7fafc;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
        }
        .execution-item {
            background: #f7fafc;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .code {
            font-family: monospace;
            background: #edf2f7;
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            font-size: 12px;
        }
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }
        hr {
            margin: 20px 0;
            border: none;
            border-top: 2px solid #e0e0e0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <h1>🚀 Sistema de Webhooks</h1>
            <p class="subtitle">Configure URLs para receber notificações quando ações forem completadas</p>
            
            <div id="status"></div>
            
            <div id="authSection">
                <h2>🔐 Autenticação</h2>
                <input type="text" id="userName" placeholder="Seu nome" />
                <input type="email" id="userEmail" placeholder="Seu email" style="margin-top: 10px;" />
                <button onclick="register()" style="margin-top: 10px;">🔑 Criar Conta / Obter Token</button>
                <hr />
                <input type="text" id="tokenInput" placeholder="Cole seu token aqui" />
                <button onclick="setToken()">✅ Autenticar</button>
            </div>
            
            <div id="webhookSection" style="display: none;">
                <h2>🔗 Configurar Webhook</h2>
                <input type="url" id="webhookUrl" placeholder="https://seuservidor.com/webhook" />
                <button onclick="saveWebhook()">💾 Salvar Webhook</button>
                <button onclick="removeWebhook()" class="danger">🗑️ Remover Webhook</button>
                
                <div id="currentWebhook" class="webhook-info"></div>
                
                <hr />
                
                <h2>⚡ Simular Ação</h2>
                <input type="text" id="acaoDesc" placeholder="Descrição da ação" />
                <textarea id="acaoDados" rows="3" placeholder="Dados adicionais (JSON)"></textarea>
                <button onclick="executarAcao()" class="success">🎯 Completar Ação</button>
                
                <div id="executionResult"></div>
                
                <hr />
                
                <h2>📜 Histórico</h2>
                <button onclick="carregarHistorico()">📋 Carregar Histórico</button>
                <div id="historico"></div>
            </div>
        </div>
        
        <div class="card">
            <h2>📡 Webhook de Teste</h2>
            <p>Use esta URL para testar:</p>
            <div class="code" id="testWebhookUrl">Carregando...</div>
            <button onclick="copiarUrl()">📋 Copiar URL</button>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Este endpoint apenas registra e retorna os dados recebidos.</p>
        </div>
    </div>

    <script>
        let currentToken = localStorage.getItem('webhook_token');
        let currentUser = null;
        
        // Atualizar URL do webhook de teste
        const testWebhookUrl = window.location.origin + '/webhook-test';
        document.getElementById('testWebhookUrl').textContent = testWebhookUrl;
        
        function mostrarStatus(msg, tipo = 'info') {
            const statusDiv = document.getElementById('status');
            statusDiv.innerHTML = \`<div class="status \${tipo}">\${msg}</div>\`;
            setTimeout(() => {
                if (statusDiv.innerHTML === \`<div class="status \${tipo}">\${msg}</div>\`) {
                    statusDiv.innerHTML = '';
                }
            }, 5000);
        }
        
        async function request(endpoint, options = {}) {
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };
            
            if (currentToken) {
                headers['Authorization'] = \`Bearer \${currentToken}\`;
            }
            
            const response = await fetch(endpoint, {
                ...options,
                headers
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro na requisição');
            }
            return data;
        }
        
        async function register() {
            const name = document.getElementById('userName').value;
            const email = document.getElementById('userEmail').value;
            
            if (!name || !email) {
                mostrarStatus('Preencha nome e email', 'error');
                return;
            }
            
            try {
                const data = await request('/api/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email })
                });
                
                currentToken = data.token;
                localStorage.setItem('webhook_token', currentToken);
                mostrarStatus(\`✅ Conta criada! Token salvo. Bem-vindo, \${name}\`, 'success');
                document.getElementById('tokenInput').value = currentToken;
                carregarConfiguracao();
                document.getElementById('webhookSection').style.display = 'block';
            } catch (error) {
                mostrarStatus('Erro: ' + error.message, 'error');
            }
        }
        
        function setToken() {
            const token = document.getElementById('tokenInput').value;
            if (token) {
                currentToken = token;
                localStorage.setItem('webhook_token', token);
                mostrarStatus('Token autenticado com sucesso!', 'success');
                carregarConfiguracao();
                document.getElementById('webhookSection').style.display = 'block';
            } else {
                mostrarStatus('Digite um token válido', 'error');
            }
        }
        
        async function carregarConfiguracao() {
            if (!currentToken) return;
            
            try {
                const data = await request('/api/webhook/config');
                if (data.hasConfig && data.config) {
                    document.getElementById('currentWebhook').innerHTML = \`
                        <strong>✅ Webhook atual:</strong><br/>
                        URL: \${data.config.url}<br/>
                        Evento: \${data.config.eventType}<br/>
                        Status: \${data.config.active ? 'Ativo' : 'Inativo'}<br/>
                        Criado em: \${new Date(data.config.createdAt).toLocaleString()}
                    \`;
                    document.getElementById('webhookUrl').value = data.config.url;
                } else {
                    document.getElementById('currentWebhook').innerHTML = '❌ Nenhum webhook configurado';
                }
            } catch (error) {
                console.error(error);
            }
        }
        
        async function saveWebhook() {
            const url = document.getElementById('webhookUrl').value;
            
            if (!url) {
                mostrarStatus('Digite uma URL válida', 'error');
                return;
            }
            
            try {
                await request('/api/webhook/config', {
                    method: 'POST',
                    body: JSON.stringify({ url })
                });
                mostrarStatus('Webhook salvo com sucesso!', 'success');
                carregarConfiguracao();
            } catch (error) {
                mostrarStatus('Erro: ' + error.message, 'error');
            }
        }
        
        async function removeWebhook() {
            if (!confirm('Tem certeza que deseja remover o webhook?')) return;
            
            try {
                await request('/api/webhook/config', { method: 'DELETE' });
                mostrarStatus('Webhook removido!', 'success');
                carregarConfiguracao();
                document.getElementById('webhookUrl').value = '';
            } catch (error) {
                mostrarStatus('Erro: ' + error.message, 'error');
            }
        }
        
        async function executarAcao() {
            const descricao = document.getElementById('acaoDesc').value || 'Ação via interface web';
            let dados = {};
            
            const dadosText = document.getElementById('acaoDados').value;
            if (dadosText) {
                try {
                    dados = JSON.parse(dadosText);
                } catch (e) {
                    mostrarStatus('JSON inválido nos dados', 'error');
                    return;
                }
            }
            
            const btn = event.target;
            btn.textContent = '⏳ Processando...';
            btn.disabled = true;
            
            try {
                const data = await request('/api/acao/completar', {
                    method: 'POST',
                    body: JSON.stringify({
                        acaoId: null,
                        descricao: descricao,
                        dados: dados
                    })
                });
                
                const resultDiv = document.getElementById('executionResult');
                if (data.webhookDisparado) {
                    resultDiv.innerHTML = \`
                        <div class="status success">
                            ✅ Ação completada!<br/>
                            Webhook disparado com sucesso!<br/>
                            Resposta: \${JSON.stringify(data.resultado, null, 2)}
                        </div>
                    \`;
                } else if (data.erro) {
                    resultDiv.innerHTML = \`
                        <div class="status error">
                            ⚠️ Ação completada, mas webhook falhou!<br/>
                            Erro: \${data.erro.message}
                        </div>
                    \`;
                } else {
                    resultDiv.innerHTML = \`
                        <div class="status info">
                            ℹ️ Ação completada! Nenhum webhook configurado.
                        </div>
                    \`;
                }
                
                mostrarStatus('Ação executada! Veja o resultado abaixo.', 'success');
                carregarHistorico();
            } catch (error) {
                mostrarStatus('Erro: ' + error.message, 'error');
            } finally {
                btn.textContent = '🎯 Completar Ação';
                btn.disabled = false;
            }
        }
        
        async function carregarHistorico() {
            if (!currentToken) return;
            
            try {
                const data = await request('/api/execucoes');
                const historicoDiv = document.getElementById('historico');
                
                if (data.executions.length === 0) {
                    historicoDiv.innerHTML = '<p>Nenhuma execução registrada ainda.</p>';
                    return;
                }
                
                historicoDiv.innerHTML = data.executions.map(exec => \`
                    <div class="execution-item">
                        <strong>📅 \${new Date(exec.timestamp).toLocaleString()}</strong><br/>
                        Ação: \${exec.acao.descricao}<br/>
                        Webhook: \${exec.webhookDisparado ? '✅ Disparado' : '❌ Não disparado'}<br/>
                        \${exec.webhookResposta ? \`Resposta: \${exec.webhookResposta.status}\` : ''}
                        \${exec.webhookErro ? \`Erro: \${exec.webhookErro.message}\` : ''}
                    </div>
                \`).join('');
            } catch (error) {
                console.error(error);
            }
        }
        
        function copiarUrl() {
            const url = document.getElementById('testWebhookUrl').textContent;
            navigator.clipboard.writeText(url);
            mostrarStatus('URL copiada! Use para teste.', 'success');
        }
        
        // Carregar token salvo
        if (currentToken) {
            document.getElementById('tokenInput').value = currentToken;
            carregarConfiguracao();
            document.getElementById('webhookSection').style.display = 'block';
        }
    </script>
</body>
</html>
`;

// Criar pasta public e salvar HTML
async function setupPublic() {
  if (!fs.existsSync(publicDir)) {
    await fs.mkdir(publicDir, { recursive: true });
  }
  await fs.writeFile(path.join(publicDir, 'index.html'), htmlContent);
}

// ==================== INICIAR SERVIDOR ====================
async function startServer() {
  await initDB();
  await setupPublic();
  
  app.listen(PORT, () => {
    console.log(`
    ═══════════════════════════════════════════════════
    🚀 Servidor rodando em: http://localhost:${PORT}
    📱 Interface Web: http://localhost:${PORT}
    📡 Webhook de teste: http://localhost:${PORT}/webhook-test
    ═══════════════════════════════════════════════════
    `);
  });
}

startServer().catch(console.error);