const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'minha-chave-secreta-123';

// Usuários mockados (em produção use banco de dados)
const users = [
  {
    id: 1,
    nome: 'Admin',
    email: 'admin@email.com',
    password: bcrypt.hashSync('admin123', 8),
    role: 'admin'
  },
  {
    id: 2,
    nome: 'Editor',
    email: 'editor@email.com',
    password: bcrypt.hashSync('editor123', 8),
    role: 'editor'
  },
  {
    id: 3,
    nome: 'João',
    email: 'user@email.com',
    password: bcrypt.hashSync('user123', 8),
    role: 'user'
  }
];

// Middleware para verificar token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token não fornecido' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Middleware para verificar papéis
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Não autenticado' });
    }
    
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado. Papel necessário: ' + allowedRoles.join(' ou ') });
    }
  };
}

// Rota de login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(401).json({ message: 'Usuário não encontrado' });
  }
  
  const passwordValid = bcrypt.compareSync(password, user.password);
  
  if (!passwordValid) {
    return res.status(401).json({ message: 'Senha incorreta' });
  }
  
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nome: user.nome },
    SECRET_KEY,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role
    }
  });
});

// Rota pública (qualquer um acessa)
app.get('/api/publico', (req, res) => {
  res.json({ message: 'Conteúdo público - qualquer um pode ver' });
});

// Rota para usuários autenticados (qualquer role)
app.get('/api/perfil', authenticateToken, (req, res) => {
  res.json({ 
    message: `Olá ${req.user.nome}, você está autenticado!`,
    user: req.user
  });
});

// Rota para usuários e editores
app.get('/api/comentarios', authenticateToken, authorize('user', 'editor', 'admin'), (req, res) => {
  res.json({ 
    message: 'Lista de comentários',
    comentarios: ['Comentário 1', 'Comentário 2', 'Comentário 3']
  });
});

// Rota para editores e admin
app.get('/api/posts', authenticateToken, authorize('editor', 'admin'), (req, res) => {
  res.json({ 
    message: 'Lista de posts (apenas editores/admin)',
    posts: ['Post 1', 'Post 2', 'Post 3']
  });
});

app.post('/api/posts', authenticateToken, authorize('editor', 'admin'), (req, res) => {
  res.json({ 
    message: `Post criado por ${req.user.nome} (${req.user.role})`,
    post: req.body
  });
});

// Rota apenas para admin
app.get('/api/usuarios', authenticateToken, authorize('admin'), (req, res) => {
  const usersSafe = users.map(u => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role
  }));
  res.json(usersSafe);
});

app.delete('/api/usuarios/:id', authenticateToken, authorize('admin'), (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: `Usuário ${userId} removido com sucesso` });
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});