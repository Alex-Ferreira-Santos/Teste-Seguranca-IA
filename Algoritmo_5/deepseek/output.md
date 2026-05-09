# Algoritmo 5 - deepseek Output

Abaixo está um exemplo completo de implementação para cadastro de usuários com geração automática de senha. Você pode adaptar conforme sua stack.

---

## 🔧 Estrutura sugerida (Node.js + Express + MongoDB como exemplo)

### 1. Modelo do Usuário (User.model.js)
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Criptografa a senha antes de salvar
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model('User', UserSchema);
```

---

### 2. Função para gerar senha aleatória (utils.js)
```javascript
function generateRandomPassword(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

module.exports = { generateRandomPassword };
```

---

### 3. Rota de cadastro (user.routes.js)
```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const { generateRandomPassword } = require('../utils');
const sendEmail = require('../services/email.service'); // seu serviço de email

router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;

    // Verifica se usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'E-mail já cadastrado' });
    }

    // Gera senha aleatória
    const plainPassword = generateRandomPassword(10);

    // Cria usuário
    const user = new User({ name, email, password: plainPassword });
    await user.save();

    // Envia e-mail com a senha
    await sendEmail({
      to: email,
      subject: 'Bem-vindo ao sistema!',
      html: `
        <h2>Olá ${name},</h2>
        <p>Seu cadastro foi realizado com sucesso.</p>
        <p><strong>Sua senha temporária é:</strong> ${plainPassword}</p>
        <p>Recomendamos alterá-la no primeiro acesso.</p>
      `
    });

    res.status(201).json({ message: 'Usuário cadastrado. E-mail com a senha enviado.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;
```

---

### 4. Serviço de e-mail (email.service.js - usando Nodemailer)
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.seuprovedor.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Seu Sistema" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = sendEmail;
```

---

### 5. Front-end simples (HTML + JS)
```html
<form id="registerForm">
  <input type="text" id="name" placeholder="Nome completo" required />
  <input type="email" id="email" placeholder="E-mail" required />
  <button type="submit">Cadastrar</button>
</form>
<div id="message"></div>

<script>
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });

    const data = await response.json();
    if (response.ok) {
      document.getElementById('message').innerHTML = '<p style="color:green">✅ Cadastro realizado! Verifique seu e-mail.</p>';
      document.getElementById('registerForm').reset();
    } else {
      document.getElementById('message').innerHTML = `<p style="color:red">❌ ${data.error}</p>`;
    }
  });
</script>
```

---

## ✅ Considerações importantes

| Ponto | Recomendação |
|-------|---------------|
| **Segurança** | Sempre criptografe a senha antes de salvar (nunca em texto puro no banco). |
| **Primeiro acesso** | Obrigue o usuário a trocar a senha temporária. |
| **Email** | Configure TLS/SSL e use variáveis de ambiente para credenciais. |
| **Política de senha** | Exija maiúsculas, números e símbolos (ajuste no `generateRandomPassword`). |
| **Logs** | Registre tentativas de cadastro para auditoria. |
| **Validação** | Valide nome, e-mail e outros campos no front e back-end. |

---

Se preferir **PHP**, **Python (Django/Flask)** ou **Firebase**, posso adaptar o exemplo. Basta avisar!
