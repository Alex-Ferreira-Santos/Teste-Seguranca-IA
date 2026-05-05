// =====================================================
// server.js — Servidor Node.js com Firebase Auth
// =====================================================
// Para instalar as dependências, rode no terminal:
//   npm install express cors firebase-admin dotenv
// Para iniciar o servidor:
//   node server.js
// =====================================================

require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const admin    = require('firebase-admin');

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));

// -------------------------------------------------
// Inicializa o Firebase Admin com as suas credenciais
// (veja o arquivo .env para configurar)
// -------------------------------------------------
admin.initializeApp({
  credential: admin.credential.cert({
    projectId:    process.env.FIREBASE_PROJECT_ID,
    clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

// -------------------------------------------------
// Middleware: verifica se o usuário está autenticado
// Use este middleware em rotas que precisam de login
// -------------------------------------------------
async function autenticado(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não enviado.' });

  try {
    req.usuario = await admin.auth().verifyIdToken(token);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

// -------------------------------------------------
// POST /cadastro
// Cria um novo usuário no Firebase
// Body: { email, senha, nome }
// -------------------------------------------------
app.post('/cadastro', async (req, res) => {
  const { email, senha, nome } = req.body;

  if (!email || !senha || !nome) {
    return res.status(400).json({ erro: 'Email, senha e nome são obrigatórios.' });
  }

  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
  }

  try {
    const usuario = await admin.auth().createUser({ email, password: senha, displayName: nome });
    res.status(201).json({ mensagem: 'Usuário criado com sucesso!', uid: usuario.uid });
  } catch (err) {
    if (err.code === 'auth/email-already-exists') {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }
    res.status(500).json({ erro: 'Erro ao criar usuário.', detalhe: err.message });
  }
});

// -------------------------------------------------
// POST /verificar-token
// Verifica se o token do usuário é válido
// Header: Authorization: Bearer <token>
// -------------------------------------------------
app.post('/verificar-token', autenticado, (req, res) => {
  res.json({
    mensagem: 'Token válido.',
    usuario: {
      uid:   req.usuario.uid,
      email: req.usuario.email,
      nome:  req.usuario.name,
    },
  });
});

// -------------------------------------------------
// GET /perfil  (exemplo de rota protegida)
// Só funciona se o usuário estiver logado
// -------------------------------------------------
app.get('/perfil', autenticado, (req, res) => {
  res.json({
    uid:   req.usuario.uid,
    email: req.usuario.email,
    nome:  req.usuario.name,
  });
});

// -------------------------------------------------
// DELETE /excluir-conta  (exemplo de rota protegida)
// Exclui a conta do usuário autenticado
// -------------------------------------------------
app.delete('/excluir-conta', autenticado, async (req, res) => {
  try {
    await admin.auth().deleteUser(req.usuario.uid);
    res.json({ mensagem: 'Conta excluída com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir conta.', detalhe: err.message });
  }
});

const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => console.log(`Servidor rodando em http://localhost:${PORTA}`));