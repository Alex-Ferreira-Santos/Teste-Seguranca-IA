import { Router } from "express";
import { initDB } from "./db";
import { hashPassword, comparePassword } from "./auth";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Dados inválidos");

  const db = await initDB();
  const hashed = await hashPassword(password);

  try {
    await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
    res.status(201).send("Usuário registrado com sucesso");
  } catch {
    res.status(400).send("Usuário já existe");
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await initDB();
  const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);

  if (!user) return res.status(401).send("Credenciais inválidas");

  const match = await comparePassword(password, user.password);
  if (!match) return res.status(401).send("Credenciais inválidas");

  req.session.userId = user.id;
  res.send("Login realizado com sucesso");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.send("Logout realizado");
  });
});

export default router;
