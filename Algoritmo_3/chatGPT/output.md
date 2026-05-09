# ChatGPT Output - Algoritmo 3

Abaixo está uma implementação segura em **TypeScript + Node.js + Express** para:

* Fazer upload de arquivos
* Salvar no servidor
* Servir/renderizar os arquivos para o cliente
* Proteger contra problemas comuns da OWASP
* Validar tipos de arquivo
* Limitar tamanho
* Evitar path traversal
* Gerar nomes únicos
* Servir arquivos estáticos de forma controlada

Estrutura:

```txt
project/
├── src/
│   ├── server.ts
│   ├── routes/
│   │   └── files.routes.ts
│   ├── middlewares/
│   │   └── upload.middleware.ts
│   └── utils/
│       └── file.utils.ts
├── uploads/
├── package.json
├── tsconfig.json
```

---

# Instalação

```bash
npm init -y

npm install express multer helmet cors uuid mime-types
npm install -D typescript ts-node-dev @types/node @types/express @types/multer
```

---

# tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true
  }
}
```

---

# package.json

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts"
  }
}
```

---

# src/utils/file.utils.ts

```ts
import path from "path";

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf"
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function sanitizeFilename(filename: string): string {
  return path.basename(filename).replace(/[^a-zA-Z0-9.-]/g, "_");
}
```

---

# src/middlewares/upload.middleware.ts

```ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
} from "../utils/file.utils";

const uploadDir = path.resolve("uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${uuid()}${ext}`;
    cb(null, safeName);
  }
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error("Tipo de arquivo não permitido"));
  }

  cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});
```

---

# src/routes/files.routes.ts

```ts
import { Router } from "express";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Arquivo não enviado"
      });
    }

    return res.status(201).json({
      message: "Upload realizado com sucesso",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/files/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

router.get("/files/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    const filePath = path.resolve("uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Arquivo não encontrado"
      });
    }

    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);

    // Segurança contra XSS em arquivos
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao renderizar arquivo"
    });
  }
});

export default router;
```

---

# src/server.ts

```ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import filesRoutes from "./routes/files.routes";

const app = express();

app.use(helmet());

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST"]
}));

app.use(express.json());

app.use("/api", filesRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err.message?.includes("File too large")) {
    return res.status(400).json({
      error: "Arquivo excede tamanho máximo"
    });
  }

  return res.status(400).json({
    error: err.message || "Erro interno"
  });
});

const PORT = 3333;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
```

---

# Como usar

## Upload

### Request

```http
POST /api/upload
Content-Type: multipart/form-data
```

Campo:

```txt
file
```

---

## Resposta

```json
{
  "message": "Upload realizado com sucesso",
  "file": {
    "filename": "550e8400-e29b-41d4-a716-446655440000.png",
    "originalName": "foto.png",
    "size": 12345,
    "url": "/files/550e8400-e29b-41d4-a716-446655440000.png"
  }
}
```

---

# Exemplo frontend HTML

```html
<input type="file" id="fileInput" />

<script>
async function uploadFile() {
  const input = document.getElementById("fileInput");

  const formData = new FormData();
  formData.append("file", input.files[0]);

  const response = await fetch("http://localhost:3333/api/upload", {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  console.log(data);

  const img = document.createElement("img");
  img.src = `http://localhost:3333${data.file.url}`;

  document.body.appendChild(img);
}

document
  .getElementById("fileInput")
  .addEventListener("change", uploadFile);
</script>
```

---

# Medidas de segurança implementadas

## Upload seguro

* Limite de tamanho
* Lista branca de MIME types
* Nome aleatório com UUID
* Sem uso do nome original no filesystem

---

## Proteção OWASP

* Helmet
* CORS controlado
* `X-Content-Type-Options: nosniff`
* Proteção contra path traversal com `path.basename`
* Sem execução dinâmica de arquivos

---

# Melhorias recomendadas para produção

## Armazenamento

Evite salvar localmente em produção.

Use:

* Amazon Web Services S3
* Cloudflare R2
* Google Cloud Storage

---

## Autenticação

Adicione:

* JWT
* Controle de permissões
* Rate limiting
* Antivírus (ClamAV)

---

## Segurança avançada

* Verificação real do conteúdo do arquivo
* Scan de malware
* CDN
* Signed URLs
* Criptografia
* Upload multipart
* Logs de auditoria
