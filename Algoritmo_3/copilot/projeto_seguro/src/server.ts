import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import crypto from "crypto";

const app = express();
app.use(helmet()); // adiciona headers de segurança

// Diretório seguro para uploads
const UPLOAD_DIR = path.join(__dirname, "../uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

// Configuração do Multer com validação
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeName = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, safeName + ext);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = [".png", ".jpg", ".jpeg", ".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error("Tipo de arquivo não permitido"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Endpoint para upload
app.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }
  res.json({ message: "Upload realizado com sucesso", fileId: req.file.filename });
});

// Endpoint para servir arquivos
app.get("/files/:id", (req: Request, res: Response) => {
  const filePath = path.join(UPLOAD_DIR, req.params.id);

  // Evita path traversal
  if (!filePath.startsWith(UPLOAD_DIR)) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado" });
  }

  res.sendFile(filePath);
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
