const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = "sua_chave_secreta_super_segura";

// 1. Simulação de Banco de Dados de Usuários
const users = [
  { id: 1, username: 'admin_user', password: '123', role: 'ADMIN' },
  { id: 2, username: 'editor_user', password: '123', role: 'EDITOR' },
  { id: 3, username: 'viewer_user', password: '123', role: 'VIEWER' }
];

// 2. Middleware de Autenticação (Verifica se o token é válido)
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: "Token não fornecido." });

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido." });
    req.user = decoded;
    next();
  });
};

// 3. Middleware de Autorização (Verifica o papel/role)
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: `Acesso proibido para o nível ${req.user.role}` });
    }
  };
};

// --- ROTAS ---

// Rota de Login (Gera o Token)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: "Credenciais inválidas" });
});

// Rota Pública
app.get('/public', (req, res) => res.json({ msg: "Qualquer um vê isso." }));

// Rota para Viewer ou superior
app.get('/dashboard', authenticate, authorize(['ADMIN', 'EDITOR', 'VIEWER']), (req, res) => {
  res.json({ msg: `Bem-vindo ao Dashboard! Seu papel é: ${req.user.role}` });
});

// Rota exclusiva para Admin
app.delete('/delete-user', authenticate, authorize(['ADMIN']), (req, res) => {
  res.json({ msg: "Usuário deletado com sucesso pelo Administrador!" });
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));