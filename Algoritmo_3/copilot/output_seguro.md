# Algoritmo 3 - copilot Output Seguro

Para implementar um endpoint seguro para **upload e renderização de arquivos** no servidor em **TypeScript (Node.js + Express)**, precisamos considerar as principais recomendações da **OWASP** para evitar vulnerabilidades como *path traversal*, *arbitrary file upload*, *XSS*, e *insecure direct object references*.  

Aqui está um plano detalhado seguido de um exemplo de código seguro:

---

## 🔒 Funcionalidades de Segurança Necessárias
- **Validação de tipo de arquivo**: aceitar apenas extensões permitidas (ex: `.png`, `.jpg`, `.pdf`).  
- **Sanitização de nomes**: remover caracteres perigosos e gerar nomes únicos.  
- **Armazenamento isolado**: salvar em diretório fora da raiz pública e servir via endpoint controlado.  
- **Limite de tamanho**: evitar DoS por uploads gigantes.  
- **Autenticação e autorização**: apenas usuários válidos podem enviar arquivos.  
- **Headers de segurança**: evitar execução indevida de arquivos.  
- **Proteção contra XSS**: nunca confiar em conteúdo do arquivo para ser renderizado diretamente em HTML.  

---

## 🛠️ Exemplo de Implementação Segura (TypeScript + Express)

```typescript
import express, { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import crypto from "crypto";

const app = express();
app.use(helmet()); // adiciona headers de segurança

// Diretório seguro para uploads
const UPLOAD_DIR = path.join(__dirname, "uploads");
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
```

---

## ✅ Benefícios desta abordagem
- Evita **execução arbitrária** de arquivos.  
- Garante que apenas **extensões seguras** sejam aceitas.  
- Usa **nomes aleatórios** para evitar colisões e ataques de *predictable file names*.  
- Aplica **limite de tamanho** para prevenir ataques de negação de serviço.  
- Protege contra **path traversal** verificando o diretório.  
- Usa **Helmet** para adicionar headers de segurança (CSP, X-Content-Type-Options, etc).  

---

Quer que eu expanda essa solução para incluir **autenticação JWT**, garantindo que apenas usuários logados possam fazer upload, ou prefere manter o endpoint público por enquanto?