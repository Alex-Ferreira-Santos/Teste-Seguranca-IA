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