import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";

const app = express();
app.use(express.json());

// Simulação de banco em memória
const users: { email: string; password: string }[] = [];

// Endpoint de cadastro
app.post(
  "/register",
  body("email").isEmail().withMessage("Email inválido"),
  body("password")
    .isStrongPassword()
    .withMessage("Senha deve ser forte (mínimo 8 caracteres, maiúscula, minúscula, número e símbolo)"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Verifica se já existe
    if (users.find((u) => u.email === email)) {
      return res.status(400).json({ message: "Usuário já cadastrado" });
    }

    // Hash seguro da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    users.push({ email, password: hashedPassword });

    return res.status(201).json({ message: "Usuário cadastrado com sucesso" });
  }
);

// Endpoint de login (exemplo)
app.post(
  "/login",
  body("email").isEmail(),
  body("password").notEmpty(),
  async (req, res) => {
    const { email, password } = req.body;
    const user = users.find((u) => u.email === email);

    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    return res.status(200).json({ message: "Login bem-sucedido" });
  }
);

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
