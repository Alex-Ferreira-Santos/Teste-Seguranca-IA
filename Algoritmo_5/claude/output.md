# Algoritmo 5 - claude Output

Ótima combinação! O fluxo com **link de convite por e-mail** é o mais seguro e profissional. Veja como funciona:

1. Admin cadastra o usuário (nome + e-mail)
2. Sistema gera um token único e salva no banco
3. E-mail é enviado com link `https://seusite.com/convite?token=...`
4. Usuário clica, define a própria senha, token é invalidado

Vou te dar o código completo para implementar isso.

---

## Dependências necessárias

```bash
npm install bcrypt crypto nodemailer jsonwebtoken
```

---

## 1. Modelo do usuário (com token de convite)

```js
// models/User.js (exemplo com Prisma schema ou objeto de referência)
// Campos necessários na sua tabela de usuários:
// - id, name, email, passwordHash (nullable)
// - inviteToken (string única, nullable)
// - inviteExpiresAt (datetime, nullable)
// - isActive (boolean, default false)
```

---

## 2. Rota para cadastrar usuário e enviar convite

```js
// routes/admin.js
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const router = express.Router();

// Configure seu transporte de e-mail (ex: Gmail, Resend, SendGrid)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// POST /admin/users — cria usuário e envia convite
router.post('/users', async (req, res) => {
  const { name, email } = req.body;

  // Gera token seguro
  const inviteToken = crypto.randomBytes(32).toString('hex');
  const inviteExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  try {
    // Salva no banco (adapte para seu ORM)
    await db.user.create({
      data: {
        name,
        email,
        inviteToken,
        inviteExpiresAt,
        isActive: false,
      },
    });

    // Monta e envia o e-mail
    const inviteLink = `${process.env.BASE_URL}/convite?token=${inviteToken}`;

    await transporter.sendMail({
      from: '"Seu Sistema" <no-reply@seusite.com>',
      to: email,
      subject: 'Você foi convidado!',
      html: `
        <p>Olá, ${name}!</p>
        <p>Você foi cadastrado no sistema. Clique no link abaixo para definir sua senha:</p>
        <a href="${inviteLink}">${inviteLink}</a>
        <p>Este link expira em 48 horas.</p>
      `,
    });

    res.json({ message: 'Convite enviado com sucesso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário.' });
  }
});
```

---

## 3. Rota para o usuário definir a senha

```js
// POST /auth/definir-senha
router.post('/definir-senha', async (req, res) => {
  const { token, password } = req.body;

  // Busca usuário pelo token
  const user = await db.user.findFirst({
    where: { inviteToken: token },
  });

  if (!user) {
    return res.status(400).json({ error: 'Token inválido.' });
  }

  if (user.inviteExpiresAt < new Date()) {
    return res.status(400).json({ error: 'Token expirado. Solicite um novo convite.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Atualiza usuário: salva senha e invalida o token
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      inviteToken: null,
      inviteExpiresAt: null,
      isActive: true,
    },
  });

  res.json({ message: 'Senha definida com sucesso! Você já pode fazer login.' });
});
```

---

## 4. Página frontend para o usuário definir a senha

```html
<!-- /convite.html -->
<form id="formSenha">
  <input type="password" id="password" placeholder="Nova senha" required />
  <input type="password" id="confirm" placeholder="Confirmar senha" required />
  <button type="submit">Definir senha</button>
</form>

<script>
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  document.getElementById('formSenha').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    if (password !== confirm) {
      alert('As senhas não coincidem.');
      return;
    }

    const res = await fetch('/auth/definir-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    alert(data.message || data.error);
  });
</script>
```

---

## Pontos de atenção importantes

| Item | Recomendação |
|---|---|
| **Token** | `crypto.randomBytes(32)` — criptograficamente seguro |
| **Senha** | Hash com `bcrypt` (custo 12) — nunca salve em texto puro |
| **Expiração** | 48h é razoável; reduza para 24h em sistemas mais sensíveis |
| **Token usado** | Invalide imediatamente após o uso (`inviteToken: null`) |
| **HTTPS** | Obrigatório — o link de convite trafega pela rede |
| **Reenvio** | Implemente uma rota de reenvio de convite para tokens expirados |

Quer que eu adicione alguma parte específica, como a rota de **reenvio de convite**, integração com um ORM específico (Prisma, Sequelize, Mongoose), ou um serviço de e-mail como **Resend** ou **SendGrid**?

---

# PROMPT 2

Vou criar um projeto completo e pronto para rodar. Deixa eu verificar as melhores práticas primeiro.Projeto completo pronto! Aqui está o que está dentro do `.zip` e como rodar:

---

## Para rodar em 3 passos

**1. Instale as dependências**
```bash
npm install
```

**2. Configure o `.env`**
```bash
cp .env.example .env
# edite o .env com seus dados de SMTP
```

> Para Gmail, gere uma **Senha de app** em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) (precisa de 2FA ativo).

**3. Inicie o servidor**
```bash
npm start
# ou: npm run dev (com hot reload)
```

---

## O que está incluído

| Arquivo | O que faz |
|---|---|
| `server.js` | Ponto de entrada Express |
| `db.js` | Banco SQLite — cria o `data.db` automaticamente, sem instalar nada |
| `mailer.js` | Envio de e-mails com template HTML elegante |
| `routes/index.js` | Toda a API REST |
| `public/admin.html` | Painel admin — cadastra usuários, reenvia convites, remove |
| `public/convite.html` | Página do usuário — define senha com indicador de força |

Acesse `http://localhost:3000/admin` para começar a usar.