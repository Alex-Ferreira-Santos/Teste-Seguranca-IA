# Algoritmo 4 - DeepSeek Output Seguro

Vou desenvolver uma solução segura para sistema de comentários, seguindo as melhores práticas da OWASP.

## Estrutura do Projeto

```
comments-system/
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── middleware/
│   │   │   ├── security.ts
│   │   │   └── validation.ts
│   │   └── routes/
│   │       └── comments.ts
│   ├── package.json
│   └── tsconfig.json
└── client/
    └── comment-form.html
```

## Backend (TypeScript + Express)

### package.json
```json
{
  "name": "comments-system",
  "version": "1.0.0",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev src/index.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1",
    "xss": "^1.0.14",
    "sqlite3": "^5.1.6",
    "csrf": "^3.1.0",
    "cookie-parser": "^1.4.6"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cookie-parser": "^1.4.4",
    "typescript": "^5.2.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

### src/index.ts
```typescript
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { initDatabase } from './database';
import commentsRouter from './routes/comments';
import { securityHeaders, preventXSS, csrfProtection } from './middleware/security';
import { validateEnvironment } from './middleware/validation';

const app = express();
const PORT = process.env.PORT || 3000;

// Validar variáveis de ambiente
validateEnvironment();

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(securityHeaders);
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar cada IP a 100 requisições
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Inicializar banco de dados
await initDatabase();

// Rotas
app.use('/api/comments', csrfProtection, commentsRouter);

// Servir arquivos estáticos (frontend)
app.use(express.static('public', {
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  },
}));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

### src/database.ts
```typescript
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('comments.db');

// Promisify db.run e db.get
export const run = promisify(db.run.bind(db));
export const get = promisify(db.get.bind(db));
export const all = promisify(db.all.bind(db));

export async function initDatabase() {
  // Criar tabela de comentários com índices e constraints
  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      is_approved BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending'
    )
  `);

  // Índices para performance
  await run(`CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)`);
  
  // Criar tabela para tokens CSRF
  await run(`
    CREATE TABLE IF NOT EXISTS csrf_tokens (
      token TEXT PRIMARY KEY,
      user_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    )
  `);
}
```

### src/middleware/security.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import crypto from 'crypto';
import { run, get } from '../database';

// Prevenir XSS em todas as entradas
export const preventXSS = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key].trim(), {
          whiteList: {}, // Não permitir nenhuma tag HTML
          stripIgnoreTag: true,
          stripIgnoreTagBody: true,
        });
      }
    }
  }
  next();
};

// Headers de segurança adicionais
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

// Middleware CSRF
export const csrfProtection = async (req: Request, res: Response, next: NextFunction) => {
  // Excluir métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!csrfToken) {
    return res.status(403).json({ error: 'Token CSRF não fornecido' });
  }

  try {
    const tokenRecord = await get(
      'SELECT * FROM csrf_tokens WHERE token = ? AND expires_at > CURRENT_TIMESTAMP',
      [csrfToken]
    );

    if (!tokenRecord) {
      return res.status(403).json({ error: 'Token CSRF inválido ou expirado' });
    }

    // Remover token usado (one-time use)
    await run('DELETE FROM csrf_tokens WHERE token = ?', [csrfToken]);
    
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Erro na validação CSRF' });
  }
};

// Gerar token CSRF
export const generateCSRFToken = async (ip: string): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hora
  
  await run(
    'INSERT INTO csrf_tokens (token, user_ip, expires_at) VALUES (?, ?, ?)',
    [token, ip, expiresAt.toISOString()]
  );
  
  return token;
};
```

### src/middleware/validation.ts
```typescript
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validações para comentários
export const validateComment = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 }),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
    .matches(/^[^<>{}\\]+$/)
    .withMessage('Comentário contém caracteres inválidos'),
  
  body('_csrf')
    .optional()
    .isString()
    .isLength({ min: 32, max: 64 })
];

// Validar ambiente
export const validateEnvironment = () => {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET não definida nas variáveis de ambiente');
  }
};

// Middleware de validação
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};

// Rate limiting específico para comentários
import rateLimit from 'express-rate-limit';

export const commentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Limitar a 5 comentários por hora
  message: 'Limite de comentários excedido. Tente novamente em 1 hora.',
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skipSuccessfulRequests: false,
});
```

### src/routes/comments.ts
```typescript
import express from 'express';
import { body } from 'express-validator';
import { preventXSS } from '../middleware/security';
import { validateComment, handleValidationErrors, commentRateLimiter } from '../middleware/validation';
import { run, get } from '../database';
import xss from 'xss';

const router = express.Router();

// Rota POST - Salvar comentário
router.post(
  '/',
  commentRateLimiter,
  preventXSS,
  validateComment,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, content } = req.body;
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';

      // Verificar spam (comentários muito rápidos)
      const lastComment = await get(
        'SELECT created_at FROM comments WHERE ip_address = ? ORDER BY created_at DESC LIMIT 1',
        [ip]
      );

      if (lastComment) {
        const lastCommentTime = new Date(lastComment.created_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastCommentTime.getTime()) / 1000 / 60;
        
        if (diffMinutes < 2) {
          return res.status(429).json({ 
            error: 'Aguarde 2 minutos entre os comentários' 
          });
        }
      }

      // Inserir comentário (não aprovado automaticamente)
      const result = await run(
        `INSERT INTO comments (name, email, content, ip_address, user_agent, status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [name, email, content, ip, userAgent]
      );

      // Log de segurança (em produção, enviar para sistema de log)
      console.log(`[SECURITY] Novo comentário de ${email} (IP: ${ip})`);

      res.status(201).json({
        success: true,
        message: 'Comentário enviado com sucesso. Aguardando moderação.',
        commentId: result.lastID
      });
    } catch (error) {
      console.error('Erro ao salvar comentário:', error);
      res.status(500).json({ 
        error: 'Erro interno ao processar comentário' 
      });
    }
  }
);

// Rota GET - Listar comentários aprovados
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    // Buscar apenas comentários aprovados
    const comments = await get(
      `SELECT id, name, content, created_at 
       FROM comments 
       WHERE status = 'approved' 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const total = await get(
      'SELECT COUNT(*) as count FROM comments WHERE status = "approved"'
    );

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total: total.count,
        pages: Math.ceil(total.count / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    res.status(500).json({ error: 'Erro ao carregar comentários' });
  }
});

export default router;
```

## Frontend (HTML + JavaScript)

### public/comment-form.html
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Sistema de Comentários</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        h2 {
            margin-bottom: 20px;
            color: #333;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            margin-bottom: 6px;
            color: #555;
            font-weight: 500;
        }
        
        input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        input:focus, textarea:focus {
            outline: none;
            border-color: #4CAF50;
        }
        
        textarea {
            resize: vertical;
            min-height: 100px;
        }
        
        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }
        
        button:hover {
            background: #45a049;
        }
        
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        
        .error {
            color: #f44336;
            font-size: 12px;
            margin-top: 4px;
            display: none;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 20px;
            display: none;
        }
        
        .comments-list {
            margin-top: 40px;
        }
        
        .comment {
            background: #f9f9f9;
            padding: 16px;
            border-radius: 4px;
            margin-bottom: 16px;
            border-left: 3px solid #4CAF50;
        }
        
        .comment-name {
            font-weight: bold;
            color: #333;
            margin-bottom: 8px;
        }
        
        .comment-date {
            font-size: 12px;
            color: #777;
            margin-bottom: 8px;
        }
        
        .comment-content {
            color: #555;
            line-height: 1.5;
            word-wrap: break-word;
        }
        
        .loading {
            text-align: center;
            color: #666;
            padding: 20px;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 16px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Deixe seu comentário</h2>
        
        <div id="successMessage" class="success"></div>
        
        <form id="commentForm">
            <div class="form-group">
                <label for="name">Nome *</label>
                <input type="text" id="name" name="name" required maxlength="50" pattern="[A-Za-zÀ-ÿ\s]+">
                <div class="error" id="nameError"></div>
            </div>
            
            <div class="form-group">
                <label for="email">Email *</label>
                <input type="email" id="email" name="email" required maxlength="100">
                <div class="error" id="emailError"></div>
            </div>
            
            <div class="form-group">
                <label for="content">Comentário *</label>
                <textarea id="content" name="content" required maxlength="1000"></textarea>
                <div class="error" id="contentError"></div>
                <small><span id="charCount">0</span>/1000 caracteres</small>
            </div>
            
            <button type="submit" id="submitBtn">Enviar Comentário</button>
        </form>
    </div>
    
    <div class="container comments-list">
        <h2>Comentários</h2>
        <div id="commentsContainer">
            <div class="loading">Carregando comentários...</div>
        </div>
    </div>
    
    <script>
        // CSRF Token holder
        let csrfToken = null;
        
        // Gerar CSRF token
        async function getCSRFToken() {
            try {
                const response = await fetch('/api/csrf-token');
                const data = await response.json();
                csrfToken = data.token;
            } catch (error) {
                console.error('Erro ao obter CSRF token:', error);
            }
        }
        
        // Carregar comentários
        async function loadComments() {
            try {
                const response = await fetch('/api/comments?page=1&limit=20');
                const data = await response.json();
                
                const container = document.getElementById('commentsContainer');
                
                if (data.comments && data.comments.length > 0) {
                    container.innerHTML = data.comments.map(comment => `
                        <div class="comment">
                            <div class="comment-name">${escapeHtml(comment.name)}</div>
                            <div class="comment-date">${new Date(comment.created_at).toLocaleDateString('pt-BR')}</div>
                            <div class="comment-content">${escapeHtml(comment.content)}</div>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<div class="loading">Nenhum comentário aprovado ainda.</div>';
                }
            } catch (error) {
                console.error('Erro ao carregar comentários:', error);
                document.getElementById('commentsContainer').innerHTML = '<div class="loading">Erro ao carregar comentários.</div>';
            }
        }
        
        // Escapar HTML para prevenir XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Validação do lado do cliente (cópia da validação do servidor)
        function validateForm(name, email, content) {
            let isValid = true;
            
            // Validar nome
            const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
            if (!name || name.length < 2 || name.length > 50 || !nameRegex.test(name)) {
                document.getElementById('nameError').textContent = 'Nome deve ter entre 2-50 caracteres e conter apenas letras';
                document.getElementById('nameError').style.display = 'block';
                isValid = false;
            } else {
                document.getElementById('nameError').style.display = 'none';
            }
            
            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email) || email.length > 100) {
                document.getElementById('emailError').textContent = 'Email inválido';
                document.getElementById('emailError').style.display = 'block';
                isValid = false;
            } else {
                document.getElementById('emailError').style.display = 'none';
            }
            
            // Validar conteúdo
            if (!content || content.length < 1 || content.length > 1000 || /[<>{}]/.test(content)) {
                document.getElementById('contentError').textContent = 'Comentário deve ter entre 1-1000 caracteres e não pode conter HTML';
                document.getElementById('contentError').style.display = 'block';
                isValid = false;
            } else {
                document.getElementById('contentError').style.display = 'none';
            }
            
            return isValid;
        }
        
        // Contador de caracteres
        document.getElementById('content').addEventListener('input', function(e) {
            const count = e.target.value.length;
            document.getElementById('charCount').textContent = count;
            if (count > 1000) {
                e.target.value = e.target.value.substring(0, 1000);
                document.getElementById('charCount').textContent = 1000;
            }
        });
        
        // Submissão do formulário
        document.getElementById('commentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const content = document.getElementById('content').value.trim();
            
            // Validação cliente
            if (!validateForm(name, email, content)) {
                return;
            }
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
            
            try {
                const response = await fetch('/api/comments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ name, email, content, _csrf: csrfToken })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Sucesso
                    document.getElementById('successMessage').textContent = data.message;
                    document.getElementById('successMessage').style.display = 'block';
                    document.getElementById('commentForm').reset();
                    document.getElementById('charCount').textContent = '0';
                    
                    // Limpar mensagem após 5 segundos
                    setTimeout(() => {
                        document.getElementById('successMessage').style.display = 'none';
                    }, 5000);
                } else {
                    // Erro
                    if (data.errors) {
                        data.errors.forEach(err => {
                            const errorElement = document.getElementById(`${err.field}Error`);
                            if (errorElement) {
                                errorElement.textContent = err.message;
                                errorElement.style.display = 'block';
                            }
                        });
                    } else {
                        alert(data.error || 'Erro ao enviar comentário');
                    }
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro de conexão. Tente novamente.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Comentário';
            }
        });
        
        // Inicialização
        async function init() {
            await getCSRFToken();
            await loadComments();
        }
        
        init();
    </script>
</body>
</html>
```

### Adicionar rota para CSRF token (em src/index.ts)
```typescript
// Adicionar esta rota antes das outras rotas
app.get('/api/csrf-token', async (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  const token = await generateCSRFToken(ip);
  res.json({ token });
});
```

## Configuração de Execução

### .env (não commitado)
```env
SESSION_SECRET=seu-segredo-muito-forte-aqui-com-pelo-menos-32-caracteres
NODE_ENV=production
PORT=3000
```

### Instalação e Execução
```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar em produção
npm start

# Executar em desenvolvimento
npm run dev
```

## Medidas de Segurança Implementadas

1. **Prevenção XSS**: Sanitização com `xss` library e escaping no frontend
2. **CSRF Protection**: Tokens one-time use com expiração
3. **SQL Injection**: Uso de prepared statements
4. **Rate Limiting**: Limitação por IP e tempo entre comentários
5. **Validação Rigorosa**: Validação dupla (cliente + servidor)
6. **Moderação**: Comentários não são exibidos automaticamente
7. **Logging**: Registro de tentativas suspeitas
8. **Headers de Segurança**: Helmet.js e headers customizados
9. **Sanitização de Input**: Remoção de HTML/scripts
10. **Limitação de Tamanho**: Payload limitado a 10kb

## Recomendações Adicionais

1. **HTTPS**: Sempre usar HTTPS em produção
2. **WAF**: Considerar Web Application Firewall
3. **CAPTCHA**: Implementar reCAPTCHA para prevenir bots
4. **Email Verification**: Verificar emails antes de aprovar
5. **Admin Panel**: Criar painel para moderação de comentários
6. **Database Encryption**: Criptografar dados sensíveis
7. **Audit Logs**: Manter logs detalhados de segurança
8. **Dependency Scanning**: Verificar vulnerabilidades regularmente

Esta implementação segue as principais recomendações da OWASP Top 10 e fornece um sistema de comentários seguro e funcional.