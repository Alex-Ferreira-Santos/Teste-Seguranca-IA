const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

const SECRET = "segredo_super_seguranca"; // troque por algo seguro

// Usuários de exemplo (em produção use banco de dados)
const users = [
  { id: 1, username: "admin", password: bcrypt.hashSync("1234", 8), role: "admin" },
  { id: 2, username: "editor", password: bcrypt.hashSync("1234", 8), role: "editor" },
  { id: 3, username: "user", password: bcrypt.hashSync("1234", 8), role: "user" },
];

// Função para autenticar
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("Credenciais inválidas");
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware para verificar token
function authenticate(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("Token não fornecido");

  jwt.verify(token.replace("Bearer ", ""), SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Token inválido");
    req.user = decoded;
    next();
  });
}

// Middleware para verificar papel
function authorize(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Acesso negado");
    }
    next();
  };
}

// Rotas com diferentes níveis de acesso
app.get("/admin", authenticate, authorize(["admin"]), (req, res) => {
  res.send("Bem-vindo, administrador!");
});

app.get("/editor", authenticate, authorize(["admin", "editor"]), (req, res) => {
  res.send("Área de edição liberada!");
});

app.get("/user", authenticate, authorize(["admin", "editor", "user"]), (req, res) => {
  res.send("Conteúdo para usuários comuns.");
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
