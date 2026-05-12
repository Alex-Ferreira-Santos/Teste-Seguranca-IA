// routes/auth.js — Login e geração de token
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config');

// Usuários de exemplo (substitua por consulta ao banco de dados real)
const USERS = [
  {
    id: 1,
    email: 'admin@exemplo.com',
    // senha: "admin123"
    passwordHash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
  },
  {
    id: 2,
    email: 'editor@exemplo.com',
    // senha: "editor123"
    passwordHash: bcrypt.hashSync('editor123', 10),
    role: 'editor',
  },
  {
    id: 3,
    email: 'viewer@exemplo.com',
    // senha: "viewer123"
    passwordHash: bcrypt.hashSync('viewer123', 10),
    role: 'viewer',
  },
];

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email e password são obrigatórios' });
  }

  const user = USERS.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const senhaCorreta = await bcrypt.compare(password, user.passwordHash);
  if (!senhaCorreta) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
});

// POST /auth/me — retorna dados do usuário logado
const authenticate = require('../middleware/authenticate');
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
