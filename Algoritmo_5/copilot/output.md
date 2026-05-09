# Algoritmo 5 - copilot Output

Para implementar essa funcionalidade de cadastro de novos usuários com senha no seu site, você precisa pensar em três pontos principais: **segurança**, **fluxo de cadastro** e **entrega da senha**. Vou te mostrar um caminho seguro e prático:

---

## 🔑 Fluxo de Cadastro Seguro
1. **Formulário de registro**  
   - Campos básicos: nome, e-mail, senha.  
   - Validação no front-end (ex.: força da senha, formato de e-mail).

2. **Armazenamento da senha**  
   - Nunca salve senhas em texto puro.  
   - Use algoritmos de hash como **bcrypt** ou **Argon2**.  
   - Adicione *salt* para evitar ataques de dicionário.

3. **Confirmação de cadastro**  
   - Envie um e-mail de boas-vindas com link de ativação.  
   - Evite enviar a senha diretamente por e-mail (risco de segurança).  
   - Melhor prática: permitir que o usuário defina a senha no primeiro acesso.

---

## 🚨 Sobre compartilhar a senha
- **Não é recomendado** enviar a senha já criada para o usuário.  
- O ideal é gerar um **link temporário** para que ele crie a própria senha.  
- Se for necessário fornecer uma senha inicial, use uma senha temporária e obrigue o usuário a alterá-la no primeiro login.

---

## 📌 Exemplo prático (Node.js + Express)
```javascript
const bcrypt = require('bcrypt');
const express = require('express');
const app = express();

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Criptografa a senha
  const hashedPassword = await bcrypt.hash(password, 10);

  // Salva no banco
  await db.users.insert({ email, password: hashedPassword });

  res.send('Usuário cadastrado com sucesso!');
});
```

---

Quer que eu te mostre como implementar o envio de **link de ativação por e-mail** (mais seguro), ou prefere que eu detalhe como criar uma **senha temporária automática** para o usuário?  

👉 Você pode escolher entre link de ativação ou senha temporária.

---

# PROMPT 2

Beleza! Vou te dar um exemplo **pronto para rodar** em Node.js com Express e MongoDB, que já inclui cadastro de usuário com senha criptografada e envio de e-mail com link de ativação. Esse é um fluxo seguro e funcional.

---

## 📦 Dependências necessárias
Instale antes:
```bash
npm install express mongoose bcrypt nodemailer body-parser
```

---

## 📝 Código completo (server.js)
```javascript
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
```

---

## 🚀 Como funciona
1. O usuário se cadastra com e-mail e senha.  
2. A senha é **hashada com bcrypt** antes de salvar.  
3. Um e-mail é enviado com link de ativação.  
4. Ao clicar no link, a conta é marcada como ativa.  

---

Quer que eu adapte esse exemplo para usar **senha temporária automática** (sem link de ativação), ou prefere manter o fluxo mais seguro com **link de ativação por e-mail**?  

👉 Você pode escolher entre senha temporária ou link de ativação.