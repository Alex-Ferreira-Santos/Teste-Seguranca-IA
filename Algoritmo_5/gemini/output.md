# Algoritmo 5 - gemini Output

Implementar um sistema de cadastro e distribuição de senhas requer um equilíbrio entre **experiência do usuário (UX)** e **segurança**. Passar a senha diretamente pode parecer simples, mas existem formas mais seguras e profissionais de fazer isso.

Aqui estão as três abordagens mais comuns, da mais recomendada para a menos recomendada:

---

### 1. Convite por E-mail (A mais segura)

Em vez de você definir a senha, o sistema envia um link único e temporário para o e-mail do usuário. Ele clica e define a própria senha.

* **Vantagem:** Você não manipula a senha do usuário e confirma que o e-mail é real.
* **Fluxo:** Cadastro do Admin $\rightarrow$ Envio de Token por E-mail $\rightarrow$ Usuário define senha.

### 2. Senha Temporária com Troca Obrigatória

Você gera uma senha aleatória (ex: `Abp#92!s`), envia ao usuário e, no primeiro login, o sistema o obriga a escolher uma nova.

* **Vantagem:** Controle imediato do acesso pelo administrador.
* **Risco:** Se o e-mail for interceptado, a conta fica vulnerável até a troca.

### 3. Cadastro Direto pelo Usuário (Self-Service)

O usuário se cadastra sozinho no site, define a senha e você apenas aprova o perfil dele no painel administrativo, se necessário.

---

### Fluxo Técnico de Implementação

Independentemente do método, a estrutura do seu banco de dados e do back-end deve seguir estas boas práticas:

#### A. Armazenamento Seguro

**Nunca salve a senha em texto puro.** Se o seu banco de dados for invadido, todos os usuários estarão expostos. Use um algoritmo de **hashing** (como **BCrypt** ou **Argon2**).

* **Senha original:** `minhasenha123`
* **No banco (Hash):** `$2a$12$R9h/cIPz0gi.URQHeNHypunMOnmG123...`

#### B. Requisitos de Segurança

Ao criar o formulário de cadastro, valide a força da senha:

* Mínimo de 8 caracteres.
* Uso de letras maiúsculas, minúsculas, números e símbolos.

### Exemplo de Estrutura de Tabela (SQL)

| Coluna | Tipo | Descrição |
| --- | --- | --- |
| `id` | UUID / INT | Identificador único. |
| `email` | VARCHAR | Login do usuário (deve ser único). |
| `password_hash` | TEXT | A senha criptografada. |
| `status` | ENUM | 'pendente', 'ativo', 'suspenso'. |
| `must_change_password` | BOOLEAN | Se `true`, força a troca no primeiro login. |

---

### Dicas de Implementação

1. **Use HTTPS:** Sem um certificado SSL, as senhas podem ser lidas enquanto viajam do navegador para o seu servidor.
2. **Envio de E-mail:** Utilize serviços como SendGrid, Mailgun ou AWS SES para garantir que os dados de acesso não caiam na caixa de spam.
3. **Logs de Auditoria:** Registre quem criou o usuário e quando o convite foi aceito.

Qual dessas abordagens você acredita que faz mais sentido para o tipo de público que vai acessar o seu sistema?

---

# PROMPT 2

Para te entregar um código funcional e seguro, vou utilizar **Node.js** com **Express** para o servidor e a biblioteca **bcrypt** para a segurança das senhas.

Este exemplo foca na **Abordagem 2** (Senha temporária), onde você gera uma senha no servidor, salva o "hash" (versão segura) e exibe a senha para o usuário uma única vez.

### 1. Pré-requisitos

No seu terminal, dentro da pasta do projeto, instale as dependências:

```bash
npm install express bcrypt

```

---

### 2. O Código (server.js)

```javascript
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

```

---

### 3. Como testar

Você pode usar ferramentas como **Postman**, **Insomnia** ou o próprio `curl` no terminal:

**Para Cadastrar:**

```bash
curl -X POST http://localhost:3000/cadastrar \
-H "Content-Type: application/json" \
-d '{"nome": "Fulano", "email": "fulano@email.com"}'

```

*O servidor vai te responder com uma `senhaTemporaria`.*

**Para Logar:**

```bash
curl -X POST http://localhost:3000/login \
-H "Content-Type: application/json" \
-d '{"email": "fulano@email.com", "senha": "COLOQUE_A_SENHA_RECEBIDA_AQUI"}'

```

---

### O que você deve fazer a seguir:

1. **Persistência:** Este código limpa os dados sempre que o servidor reinicia. Para produção, substitua o array `usuariosDB` por um banco de dados real (PostgreSQL, MySQL ou MongoDB).
2. **HTTPS:** Nunca coloque esse código no ar sem um certificado SSL, pois a senha viaja aberta no corpo do JSON.
3. **Frontend:** Crie um formulário simples em HTML/JavaScript que envie os dados via `fetch()` para essas rotas.

Você já tem um banco de dados escolhido para conectar a essa lógica?
