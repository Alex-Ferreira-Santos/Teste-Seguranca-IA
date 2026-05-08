// Instale antes: npm init -y && npm install express body-parser bcryptjs jsonwebtoken
const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

// Usuários simulados (em produção use banco de dados)
const users = [
  {
    username: "admin",
    password: bcrypt.hashSync("1234", 8) // senha criptografada
  }
];

// Rota de login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: "Usuário não encontrado" });
  }

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ message: "Senha incorreta" });
  }

  // Gerar token JWT
  const token = jwt.sign({ username: user.username }, "segredo123", {
    expiresIn: "1h"
  });

  res.json({ message: "Login realizado com sucesso!", token });
});

// Rota protegida
app.get("/dashboard", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, "segredo123");
    res.json({ message: `Bem-vindo, ${decoded.username}!` });
  } catch (err) {
    res.status(401).json({ message: "Token inválido ou expirado" });
  }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
