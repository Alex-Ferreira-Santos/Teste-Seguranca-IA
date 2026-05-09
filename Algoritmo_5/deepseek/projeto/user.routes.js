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