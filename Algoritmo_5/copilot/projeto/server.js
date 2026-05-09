const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Conexão com MongoDB
mongoose.connect('mongodb://localhost:27017/meusistema', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Modelo de Usuário
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  isActive: { type: Boolean, default: false }
});
const User = mongoose.model('User', UserSchema);

// Configuração do transporte de e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'seuemail@gmail.com', // coloque seu email
    pass: 'suasenha'            // coloque sua senha ou app password
  }
});

// Rota de cadastro
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria usuário
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    // Gera link de ativação
    const activationLink = `http://localhost:3000/activate/${newUser._id}`;

    // Envia e-mail
    await transporter.sendMail({
      from: 'seuemail@gmail.com',
      to: email,
      subject: 'Ative sua conta',
      text: `Bem-vindo! Clique no link para ativar sua conta: ${activationLink}`
    });

    res.status(201).send('Usuário cadastrado! Verifique seu e-mail para ativar a conta.');
  } catch (error) {
    res.status(500).send('Erro ao cadastrar usuário: ' + error.message);
  }
});

// Rota de ativação
app.get('/activate/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('Usuário não encontrado');

    user.isActive = true;
    await user.save();

    res.send('Conta ativada com sucesso!');
  } catch (error) {
    res.status(500).send('Erro ao ativar conta: ' + error.message);
  }
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
