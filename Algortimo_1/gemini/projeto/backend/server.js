const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Adicione isto
const app = express();
app.use(cors()); // Adicione isto antes das rotas

app.use(express.json()); // Permite que o servidor entenda JSON

// "Banco de dados" de exemplo (na vida real, isso fica num arquivo separado)
const usuarios = [];
const CHAVE_SECRETA = "sua_chave_super_secreta_123";

// ROTA DE CADASTRO (Para criar um usuário novo com senha protegida)
app.post('/registrar', async (req, res) => {
    const { usuario, senha } = req.body;
    
    // Transforma a senha em um código impossível de ler (Hash)
    const senhaCriptografada = await bcrypt.hash(senha, 10);
    
    usuarios.push({ usuario, senha: senhaCriptografada });
    res.status(201).send("Usuário cadastrado com sucesso!");
});

// ROTA DE LOGIN (A lógica de autenticação propriamente dita)
app.post('/login', async (req, res) => {
    const { usuario, senha } = req.body;

    // 1. Procura o usuário
    const user = usuarios.find(u => u.usuario === usuario);
    if (!user) {
        return res.status(400).send("Usuário não encontrado.");
    }

    // 2. Compara a senha digitada com a criptografada
    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
        return res.status(400).send("Senha incorreta.");
    }

    // 3. Cria um Token (uma chave digital que prova que o usuário está logado)
    const token = jwt.sign({ nome: user.usuario }, CHAVE_SECRETA, { expiresIn: '1h' });

    res.json({ mensagem: "Login OK!", token: token });
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));