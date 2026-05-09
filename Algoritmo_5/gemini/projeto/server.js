const express = require('express');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

// Simulação de Banco de Dados
const usuariosDB = [];

// ROTA DE CADASTRO
app.post('/cadastrar', async (req, res) => {
    const { email, nome } = req.body;

    // 1. Verificação básica
    if (!email || !nome) {
        return res.status(400).json({ erro: "E-mail e nome são obrigatórios." });
    }

    // 2. Gerar uma senha aleatória simples
    const senhaTemporaria = Math.random().toString(36).slice(-8);

    try {
        // 3. CRIPTOGRAFAR a senha antes de salvar
        // O "10" é o custo do processamento (salt rounds)
        const hash = await bcrypt.hash(senhaTemporaria, 10);

        // 4. Salvar no "banco"
        const novoUsuario = {
            id: usuariosDB.length + 1,
            nome,
            email,
            senhaHash: hash,
            trocarSenha: true
        };
        
        usuariosDB.push(novoUsuario);

        // 5. Retornar a senha em texto puro APENAS NESTA RESPOSTA
        // Na vida real, você enviaria isso por e-mail.
        res.status(201).json({
            mensagem: "Usuário cadastrado com sucesso!",
            acesso: {
                usuario: email,
                senhaTemporaria: senhaTemporaria // O usuário deve salvar isso
            },
            aviso: "Esta senha deve ser alterada no primeiro login."
        });

        console.log("Usuários no banco:", usuariosDB);

    } catch (erro) {
        res.status(500).json({ erro: "Erro ao processar cadastro." });
    }
});

// ROTA DE LOGIN (Para testar se a senha funciona)
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    const usuario = usuariosDB.find(u => u.email === email);

    if (!usuario) {
        return res.status(401).json({ erro: "Usuário não encontrado." });
    }

    // Compara a senha digitada com o Hash salvo no banco
    const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

    if (senhaCorreta) {
        res.json({ mensagem: "Login realizado com sucesso!", trocarSenha: usuario.trocarSenha });
    } else {
        res.status(401).json({ erro: "Senha incorreta." });
    }
});

app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));