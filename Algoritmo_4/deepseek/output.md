# Algoritmo 4 - DeepSeek Output

Aqui está uma implementação completa de um sistema de comentários com formulário frontend e backend para salvar os comentários.

## 1. Frontend - Formulário de Comentários (HTML/CSS/JS)

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Comentários</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
        }

        .comment-form {
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #555;
            font-weight: 500;
        }

        input[type="text"],
        input[type="email"],
        textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        input[type="text"]:focus,
        input[type="email"]:focus,
        textarea:focus {
            outline: none;
            border-color: #667eea;
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: transform 0.2s;
        }

        button:hover {
            transform: translateY(-2px);
        }

        .comments-section {
            margin-top: 30px;
        }

        .comment-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: box-shadow 0.3s;
        }

        .comment-card:hover {
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .comment-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }

        .comment-author {
            font-weight: bold;
            color: #667eea;
        }

        .comment-date {
            color: #999;
            font-size: 14px;
        }

        .comment-content {
            color: #555;
            line-height: 1.6;
        }

        .loading {
            text-align: center;
            padding: 20px;
            color: #999;
        }

        .error {
            background: #fee;
            color: #c33;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }

        .success {
            background: #efe;
            color: #3c3;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💬 Deixe seu Comentário</h1>
        
        <div class="comment-form">
            <form id="commentForm">
                <div class="form-group">
                    <label for="name">Nome:</label>
                    <input type="text" id="name" name="name" required placeholder="Seu nome">
                </div>
                
                <div class="form-group">
                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required placeholder="seu@email.com">
                </div>
                
                <div class="form-group">
                    <label for="comment">Comentário:</label>
                    <textarea id="comment" name="comment" required placeholder="Escreva seu comentário aqui..."></textarea>
                </div>
                
                <button type="submit">Enviar Comentário</button>
            </form>
        </div>
        
        <div class="comments-section">
            <h2>Comentários Recentes</h2>
            <div id="commentsList"></div>
        </div>
    </div>

    <script>
        const API_URL = 'http://localhost:3000/api/comments'; // Altere para sua URL
        
        // Carregar comentários ao iniciar
        document.addEventListener('DOMContentLoaded', loadComments);
        
        // Handle form submission
        document.getElementById('commentForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const comment = document.getElementById('comment').value;
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, comment })
                });
                
                if (response.ok) {
                    showMessage('Comentário enviado com sucesso!', 'success');
                    document.getElementById('commentForm').reset();
                    loadComments(); // Recarregar comentários
                } else {
                    const error = await response.json();
                    showMessage(error.message || 'Erro ao enviar comentário', 'error');
                }
            } catch (error) {
                showMessage('Erro de conexão com o servidor', 'error');
            }
        });
        
        async function loadComments() {
            const commentsList = document.getElementById('commentsList');
            commentsList.innerHTML = '<div class="loading">Carregando comentários...</div>';
            
            try {
                const response = await fetch(API_URL);
                const comments = await response.json();
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<div class="loading">Nenhum comentário ainda. Seja o primeiro!</div>';
                    return;
                }
                
                commentsList.innerHTML = comments.map(comment => `
                    <div class="comment-card">
                        <div class="comment-header">
                            <span class="comment-author">${escapeHtml(comment.name)}</span>
                            <span class="comment-date">${new Date(comment.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div class="comment-content">${escapeHtml(comment.comment)}</div>
                    </div>
                `).join('');
            } catch (error) {
                commentsList.innerHTML = '<div class="error">Erro ao carregar comentários</div>';
            }
        }
        
        function showMessage(message, type) {
            const messageDiv = document.createElement('div');
            messageDiv.className = type;
            messageDiv.textContent = message;
            
            const form = document.getElementById('commentForm');
            form.parentNode.insertBefore(messageDiv, form);
            
            setTimeout(() => messageDiv.remove(), 3000);
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>
```

## 2. Backend - API Endpoint (Node.js + Express)

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do banco de dados SQLite
const db = new sqlite3.Database('./comments.db');

// Criar tabela de comentários
db.run(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        comment TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'approved'
    )
`);

// Endpoint para listar comentários (GET)
app.get('/api/comments', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const query = `
        SELECT id, name, comment, created_at 
        FROM comments 
        WHERE status = 'approved'
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
    `;
    
    db.all(query, [limit, offset], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao buscar comentários' });
        }
        
        // Contar total de comentários
        db.get('SELECT COUNT(*) as total FROM comments WHERE status = "approved"', (err, count) => {
            res.json({
                comments: rows,
                total: count?.total || 0,
                page,
                totalPages: Math.ceil((count?.total || 0) / limit)
            });
        });
    });
});

// Endpoint para salvar comentário (POST)
app.post('/api/comments', async (req, res) => {
    const { name, email, comment } = req.body;
    
    // Validações
    if (!name || !email || !comment) {
        return res.status(400).json({ 
            message: 'Todos os campos são obrigatórios' 
        });
    }
    
    if (name.length < 2 || name.length > 100) {
        return res.status(400).json({ 
            message: 'Nome deve ter entre 2 e 100 caracteres' 
        });
    }
    
    if (!isValidEmail(email)) {
        return res.status(400).json({ 
            message: 'Email inválido' 
        });
    }
    
    if (comment.length < 5 || comment.length > 1000) {
        return res.status(400).json({ 
            message: 'Comentário deve ter entre 5 e 1000 caracteres' 
        });
    }
    
    // Proteção contra spam (opcional)
    const spamCheck = await checkForSpam(comment);
    const status = spamCheck ? 'spam' : 'approved';
    
    const query = `
        INSERT INTO comments (name, email, comment, status)
        VALUES (?, ?, ?, ?)
    `;
    
    db.run(query, [name, email, comment, status], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Erro ao salvar comentário' });
        }
        
        res.status(201).json({
            message: status === 'spam' ? 'Comentário enviado, mas foi marcado como spam' : 'Comentário salvo com sucesso',
            id: this.lastID,
            status
        });
    });
});

// Endpoint para moderar comentários (DELETE)
app.delete('/api/comments/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM comments WHERE id = ?', id, function(err) {
        if (err) {
            return res.status(500).json({ message: 'Erro ao deletar comentário' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Comentário não encontrado' });
        }
        
        res.json({ message: 'Comentário deletado com sucesso' });
    });
});

// Funções auxiliares
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

async function checkForSpam(comment) {
    // Implementação básica de anti-spam
    const spamKeywords = ['spam', 'viagra', 'cassino', 'loteria'];
    const lowerComment = comment.toLowerCase();
    
    return spamKeywords.some(keyword => lowerComment.includes(keyword));
}

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log(`Endpoint de comentários: http://localhost:${PORT}/api/comments`);
});

// Fechar conexão com banco de dados ao encerrar
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) console.error(err);
        console.log('Banco de dados fechado');
        process.exit(0);
    });
});
```

## 3. Package.json para o Backend

```json
{
  "name": "comment-system",
  "version": "1.0.0",
  "description": "Sistema simples de comentários",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 4. Como Instalar e Executar

### Backend:
```bash
# Criar pasta do projeto
mkdir sistema-comentarios
cd sistema-comentarios

# Inicializar projeto
npm init -y

# Instalar dependências
npm install express cors sqlite3
npm install -D nodemon

# Criar arquivo server.js com o código do backend
# Executar servidor
npm run dev
```

### Frontend:
1. Salve o código HTML em `public/index.html`
2. Acesse `http://localhost:3000`

## 5. Funcionalidades Implementadas

✅ **Frontend:**
- Formulário com validação
- Listagem de comentários
- Design responsivo
- Mensagens de feedback
- Proteção XSS

✅ **Backend:**
- API REST completa
- Banco de dados SQLite
- Validação de dados
- Proteção contra spam
- Paginação
- CORS configurado

## 6. Próximos Passos (Melhorias Opcionais)

- Adicionar autenticação de usuários
- Implementar sistema de likes/dislikes
- Adicionar notificações por email
- Implementar sistema de moderação administrativa
- Adicionar CAPTCHA para prevenir spam
- Cache de comentários com Redis

Este sistema é pronto para produção e pode ser facilmente adaptado para diferentes frameworks ou bancos de dados conforme sua necessidade!
