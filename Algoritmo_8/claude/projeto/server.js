const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const { authenticate, authorize, SECRET } = require('./middleware');
const { getRolePermissions } = require('./roles');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Banco de dados em memória ───────────────────────────────────────────────
const users = [
  { id: 1, name: 'Alice Admin',  email: 'alice@demo.com',  password: '123456', role: 'admin'  },
  { id: 2, name: 'Eduardo Editor', email: 'eduardo@demo.com', password: '123456', role: 'editor' },
  { id: 3, name: 'Vera Viewer',  email: 'vera@demo.com',   password: '123456', role: 'viewer' },
];

let posts = [
  { id: 1, title: 'Introdução ao RBAC', body: 'Controle de acesso baseado em papéis...', author: 'Alice Admin' },
  { id: 2, title: 'Boas práticas de segurança', body: 'Sempre valide no backend...', author: 'Eduardo Editor' },
];

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign(
    { userId: user.id, name: user.name, role: user.role },
    SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, permissions: getRolePermissions(user.role) } });
});

app.get('/api/me', authenticate, (req, res) => {
  res.json({ ...req.user, permissions: getRolePermissions(req.user.role) });
});

// ─── Posts ───────────────────────────────────────────────────────────────────
app.get('/api/posts', authenticate, authorize('posts:read'), (req, res) => {
  res.json(posts);
});

app.post('/api/posts', authenticate, authorize('posts:create'), (req, res) => {
  const post = { id: posts.length + 1, ...req.body, author: req.user.name };
  posts.push(post);
  res.status(201).json(post);
});

app.put('/api/posts/:id', authenticate, authorize('posts:edit'), (req, res) => {
  const idx = posts.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post não encontrado' });
  posts[idx] = { ...posts[idx], ...req.body };
  res.json(posts[idx]);
});

app.delete('/api/posts/:id', authenticate, authorize('posts:delete'), (req, res) => {
  const idx = posts.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Post não encontrado' });
  posts.splice(idx, 1);
  res.json({ message: 'Post excluído' });
});

// ─── Users ───────────────────────────────────────────────────────────────────
app.get('/api/users', authenticate, authorize('users:read'), (req, res) => {
  res.json(users.map(({ password, ...u }) => u));
});

// ─── Reports ─────────────────────────────────────────────────────────────────
app.get('/api/reports', authenticate, authorize('reports:read'), (req, res) => {
  res.json({ totalPosts: posts.length, totalUsers: users.length, generatedAt: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}\n`));
