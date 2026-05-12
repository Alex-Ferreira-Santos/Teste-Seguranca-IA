// routes/posts.js — Rotas de posts com proteção por permissão
const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Banco de dados em memória (substitua por seu DB real)
let posts = [
  { id: 1, title: 'Primeiro post', content: 'Olá mundo!', author: 'admin' },
  { id: 2, title: 'Segundo post', content: 'Conteúdo de exemplo.', author: 'editor' },
];
let nextId = 3;

// GET /posts — qualquer usuário autenticado pode ler
router.get('/', authenticate, authorize('posts:read'), (req, res) => {
  res.json({ posts, user: req.user });
});

// GET /posts/:id
router.get('/:id', authenticate, authorize('posts:read'), (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post não encontrado' });
  res.json(post);
});

// POST /posts — apenas editor e admin
router.post('/', authenticate, authorize('posts:create'), (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'title e content são obrigatórios' });
  }
  const post = { id: nextId++, title, content, author: req.user.email };
  posts.push(post);
  res.status(201).json(post);
});

// PUT /posts/:id — apenas editor e admin
router.put('/:id', authenticate, authorize('posts:edit'), (req, res) => {
  const index = posts.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Post não encontrado' });
  posts[index] = { ...posts[index], ...req.body, id: posts[index].id };
  res.json(posts[index]);
});

// DELETE /posts/:id — apenas admin
router.delete('/:id', authenticate, authorize('posts:delete'), (req, res) => {
  const index = posts.findIndex(p => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Post não encontrado' });
  posts.splice(index, 1);
  res.json({ message: 'Post deletado com sucesso' });
});

module.exports = router;
