import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DB_FILE = join(__dirname, "comments.json");

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

function loadComments() {
  if (!existsSync(DB_FILE)) return [];
  try { return JSON.parse(readFileSync(DB_FILE, "utf-8")); }
  catch { return []; }
}

function saveComments(comments) {
  writeFileSync(DB_FILE, JSON.stringify(comments, null, 2), "utf-8");
}

function sanitize(str = "", maxLen = 500) {
  return String(str).trim().slice(0, maxLen);
}

// GET /api/comments?postId=<id>
app.get("/api/comments", (req, res) => {
  const { postId } = req.query;
  const all = loadComments();
  const filtered = postId ? all.filter(c => c.postId === postId) : all;
  const sorted = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map(({ email: _e, ...rest }) => rest));
});

// POST /api/comments
app.post("/api/comments", (req, res) => {
  const { postId, name, email, body } = req.body ?? {};
  const errs = [];
  if (!name || String(name).trim().length < 2) errs.push("Nome inválido (mínimo 2 caracteres)");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) errs.push("E-mail inválido");
  if (!body || String(body).trim().length < 5) errs.push("Comentário muito curto (mínimo 5 caracteres)");
  if (errs.length) return res.status(400).json({ error: errs.join(" · ") });

  const comment = {
    id: randomUUID(),
    postId: sanitize(postId || "default", 100),
    name: sanitize(name, 80),
    email: sanitize(email, 200),
    body: sanitize(body, 2000),
    createdAt: new Date().toISOString(),
  };

  const comments = loadComments();
  comments.push(comment);
  saveComments(comments);

  const { email: _e, ...safe } = comment;
  res.status(201).json(safe);
});

// DELETE /api/comments/:id
app.delete("/api/comments/:id", (req, res) => {
  const comments = loadComments();
  const idx = comments.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Comentário não encontrado" });
  comments.splice(idx, 1);
  saveComments(comments);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}\n`);
});