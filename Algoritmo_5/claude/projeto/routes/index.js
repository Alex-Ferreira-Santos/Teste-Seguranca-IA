// routes/index.js — Todas as rotas da aplicação
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../db');
const { sendInviteEmail, sendPasswordChangedEmail } = require('../mailer');

const router = express.Router();

// ─── ADMIN ────────────────────────────────────────────────────────────────────

// GET /admin — Painel de administração
router.get('/admin', (req, res) => {
  const users = db.prepare('SELECT id, name, email, is_active, created_at FROM users ORDER BY created_at DESC').all();
  res.sendFile('admin.html', { root: './public' });
});

// GET /api/users — Lista todos os usuários (para o painel)
router.get('/api/users', (req, res) => {
  const users = db.prepare(
    'SELECT id, name, email, is_active, invite_token, invite_expires_at, created_at FROM users ORDER BY created_at DESC'
  ).all();
  res.json(users);
});

// POST /api/users — Cadastra novo usuário e envia convite
router.post('/api/users', async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  // Verifica se e-mail já existe
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  try {
    db.prepare(
      'INSERT INTO users (name, email, invite_token, invite_expires_at) VALUES (?, ?, ?, ?)'
    ).run(name, email, inviteToken, inviteExpiresAt);

    const inviteLink = `${process.env.BASE_URL}/convite?token=${inviteToken}`;
    await sendInviteEmail({ to: email, name, inviteLink });

    res.json({ message: `Convite enviado para ${email} com sucesso.` });
  } catch (err) {
    console.error('[ERRO ao criar usuário]', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário. Verifique as configurações de e-mail.' });
  }
});

// POST /api/users/:id/reenviar — Reenvia convite
router.post('/api/users/:id/reenviar', async (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (user.is_active) return res.status(400).json({ error: 'Usuário já está ativo.' });

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  db.prepare(
    'UPDATE users SET invite_token = ?, invite_expires_at = ? WHERE id = ?'
  ).run(inviteToken, inviteExpiresAt, user.id);

  const inviteLink = `${process.env.BASE_URL}/convite?token=${inviteToken}`;
  await sendInviteEmail({ to: user.email, name: user.name, inviteLink });

  res.json({ message: 'Convite reenviado com sucesso.' });
});

// DELETE /api/users/:id — Remove usuário
router.delete('/api/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ message: 'Usuário removido.' });
});

// ─── CONVITE (USUÁRIO FINAL) ───────────────────────────────────────────────────

// GET /convite — Página para o usuário definir a senha
router.get('/convite', (req, res) => {
  res.sendFile('convite.html', { root: './public' });
});

// GET /api/convite/verificar — Verifica se token é válido
router.get('/api/convite/verificar', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false, error: 'Token não informado.' });

  const user = db.prepare('SELECT name, invite_expires_at FROM users WHERE invite_token = ?').get(token);

  if (!user) return res.json({ valid: false, error: 'Link inválido ou já utilizado.' });
  if (new Date(user.invite_expires_at) < new Date()) {
    return res.json({ valid: false, error: 'Este link expirou. Peça um novo convite ao administrador.' });
  }

  res.json({ valid: true, name: user.name });
});

// POST /api/convite/definir-senha — Define a senha e ativa o usuário
router.post('/api/convite/definir-senha', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token e senha são obrigatórios.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'A senha deve ter pelo menos 8 caracteres.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE invite_token = ?').get(token);

  if (!user) return res.status(400).json({ error: 'Link inválido ou já utilizado.' });
  if (new Date(user.invite_expires_at) < new Date()) {
    return res.status(400).json({ error: 'Link expirado. Solicite um novo convite.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    db.prepare(
      'UPDATE users SET password_hash = ?, invite_token = NULL, invite_expires_at = NULL, is_active = 1 WHERE id = ?'
    ).run(passwordHash, user.id);

    await sendPasswordChangedEmail({ to: user.email, name: user.name });

    res.json({ message: 'Senha definida com sucesso! Você já pode fazer login.' });
  } catch (err) {
    console.error('[ERRO ao definir senha]', err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});

module.exports = router;
