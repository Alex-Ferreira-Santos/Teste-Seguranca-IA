const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const users = require("./data/users");
const postsRoutes = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  return res.json({
    message: "API funcionando"
  });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);

  if (!user) {
    return res.status(401).json({
      error: "Usuário não encontrado"
    });
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    return res.status(401).json({
      error: "Senha inválida"
    });
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions
    },
    "SEGREDO_SUPER_SECRETO",
    {
      expiresIn: "1d"
    }
  );

  return res.json({
    token
  });
});

app.use("/posts", postsRoutes);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});