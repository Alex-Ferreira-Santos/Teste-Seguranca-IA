const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");

// Garante que o diretório de uploads existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

// ─── Configuração do Multer ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Prefixo com timestamp para evitar colisões
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${unique}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    // Aceita imagens, PDFs, textos e vídeos
    const ALLOWED = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
      "application/pdf",
      "text/plain", "text/html", "text/css", "application/json",
      "video/mp4", "video/webm",
    ];
    if (ALLOWED.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo não permitido: ${file.mimetype}`));
    }
  },
});

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * POST /upload
 * Salva um ou mais arquivos e retorna os metadados.
 *
 * Body: multipart/form-data  →  campo "files" (múltiplos)
 * Resposta:
 *   { files: [{ filename, originalName, mimetype, size, url }] }
 */
app.post("/upload", upload.array("files", 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "Nenhum arquivo recebido." });
  }

  const saved = req.files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    mimetype: f.mimetype,
    size: f.size,                                   // bytes
    url: `${req.protocol}://${req.get("host")}/files/${f.filename}`,
  }));

  res.status(201).json({ files: saved });
});

/**
 * GET /files
 * Lista todos os arquivos salvos no servidor.
 *
 * Resposta: { files: [{ filename, size, url, uploadedAt }] }
 */
app.get("/files", (req, res) => {
  const entries = fs.readdirSync(UPLOAD_DIR).map((name) => {
    const full = path.join(UPLOAD_DIR, name);
    const stat = fs.statSync(full);
    return {
      filename: name,
      size: stat.size,
      url: `${req.protocol}://${req.get("host")}/files/${name}`,
      uploadedAt: stat.birthtime,
    };
  });
  res.json({ files: entries });
});

/**
 * GET /files/:filename
 * Serve o arquivo para o cliente.
 * O navegador renderiza imagens, PDFs e vídeos inline automaticamente.
 */
app.get("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado." });
  }

  // inline → o browser renderiza; attachment → força download
  const disposition = req.query.download === "1" ? "attachment" : "inline";
  res.setHeader("Content-Disposition", `${disposition}; filename="${req.params.filename}"`);

  res.sendFile(filePath);
});

/**
 * DELETE /files/:filename
 * Remove um arquivo do servidor.
 */
app.delete("/files/:filename", (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado." });
  }

  fs.unlinkSync(filePath);
  res.json({ message: "Arquivo removido com sucesso." });
});

// ─── Tratamento de erros do Multer ───────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Multer: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Uploads salvos em: ${UPLOAD_DIR}`);
});