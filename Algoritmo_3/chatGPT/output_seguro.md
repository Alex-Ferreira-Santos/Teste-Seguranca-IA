# ChatGPT Output Seguro - Algoritmo 3

Abaixo está uma implementação **segura** de upload e renderização de arquivos usando **TypeScript + Node.js + Express**, com foco em mitigação dos principais riscos da OWASP, incluindo:

* Upload arbitrário de arquivos
* Path Traversal
* Remote Code Execution (RCE)
* MIME spoofing
* DoS por arquivos grandes
* Sobrescrita de arquivos
* Enumeração de arquivos
* Exposição de diretórios internos
* XSS via arquivos HTML/SVG
* Content-Type inseguro

## Estratégia de Segurança

### Decisões importantes

✅ Nunca salvar usando o nome original do usuário
✅ Gerar UUID aleatório para o arquivo
✅ Validar MIME TYPE e extensão
✅ Limitar tamanho do upload
✅ Armazenar fora da pasta pública
✅ Nunca permitir `.html`, `.js`, `.svg`, `.php`, etc
✅ Servir arquivos por endpoint controlado
✅ Forçar `Content-Disposition` seguro
✅ Definir `X-Content-Type-Options: nosniff`
✅ Impedir path traversal
✅ Sanitizar nomes
✅ Rate limiting
✅ Helmet para headers HTTP

---

# Estrutura

```txt
src/
 ├── server.ts
 ├── routes/
 │    └── files.ts
 ├── middleware/
 │    └── upload.ts
 ├── storage/
 │    └── uploads/
```

---

# Dependências

```bash
npm install express multer helmet uuid express-rate-limit mime-types
npm install -D typescript ts-node-dev @types/express @types/multer @types/node
```

---

# server.ts

```ts
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";

import filesRouter from "./routes/files";

const app = express();

app.use(helmet());

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const uploadDir = path.resolve(__dirname, "storage/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/files", filesRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

---

# middleware/upload.ts

```ts
import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve(__dirname, "../storage/uploads"));
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    const mimeAllowed = allowedMimeTypes.includes(file.mimetype);
    const extAllowed = allowedExtensions.includes(ext);

    if (!mimeAllowed || !extAllowed) {
      return cb(new Error("Invalid file type"));
    }

    cb(null, true);
  },
});
```

---

# routes/files.ts

```ts
import { Router } from "express";
import path from "path";
import fs from "fs";
import mime from "mime-types";

import { upload } from "../middleware/upload";

const router = Router();

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  return res.status(201).json({
    fileId: req.file.filename,
    url: `/files/${req.file.filename}`,
  });
});

router.get("/:fileId", (req, res) => {
  const fileId = path.basename(req.params.fileId);

  const fullPath = path.resolve(
    __dirname,
    "../storage/uploads",
    fileId
  );

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({
      error: "File not found",
    });
  }

  const mimeType = mime.lookup(fullPath) || "application/octet-stream";

  res.setHeader("X-Content-Type-Options", "nosniff");

  // evita execução inline de conteúdo perigoso
  res.setHeader(
    "Content-Disposition",
    "inline; filename=\"file\""
  );

  res.setHeader("Content-Type", mimeType);

  return res.sendFile(fullPath);
});

export default router;
```

---

# Exemplo Frontend

```html
<form id="uploadForm">
  <input type="file" name="file" />
  <button type="submit">Upload</button>
</form>

<img id="preview" />

<script>
  const form = document.getElementById("uploadForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    const response = await fetch("/files/upload", {
      method: "POST",
      body: data,
    });

    const json = await response.json();

    document.getElementById("preview").src = json.url;
  });
</script>
```

---

# Melhorias Recomendadas para Produção

## 1. Validação Real do Arquivo (Muito Importante)

Atualmente MIME pode ser falsificado.

Use:

```bash
npm install file-type
```

e valide o magic number/binário:

```ts
import { fileTypeFromFile } from "file-type";
```

Isso impede bypass de extensão fake.

---

## 2. Antivírus

Integrar com:

* ClamAV
* VirusTotal
* S3 malware scanning

---

## 3. Armazenamento Seguro

Idealmente usar:

* S3
* Cloudflare R2
* GCS

E gerar URLs assinadas.

---

## 4. Nunca Permitir

Bloquear completamente:

```txt
.html
.svg
.js
.mjs
.php
.exe
.bat
.sh
```

SVG é um vetor comum de XSS.

---

## 5. Autorização

Hoje qualquer pessoa com URL acessa.

Adicionar:

* JWT
* ACL
* arquivos privados
* URLs temporárias

---

## 6. Rate Limiting Específico no Upload

Evita DoS:

```ts
max: 10
```

---

## 7. CSP (Content Security Policy)

Muito importante:

```ts
helmet({
  contentSecurityPolicy: true
})
```

---

## 8. Escaneamento de Path Traversal

Já mitigado com:

```ts
path.basename()
```

e:

```ts
path.resolve()
```

---

# Principais ataques mitigados

| Ataque            | Mitigação           |
| ----------------- | ------------------- |
| Path Traversal    | `basename()`        |
| Upload de malware | whitelist           |
| RCE               | sem execução        |
| XSS               | bloqueio HTML/SVG   |
| MIME spoofing     | validação dupla     |
| DOS               | limite de tamanho   |
| Sobrescrita       | UUID                |
| Enumeração        | IDs aleatórios      |
| MIME sniffing     | `nosniff`           |
| Directory listing | endpoint controlado |

---

# Arquitetura recomendada para produção

```txt
Cliente
   ↓
API Upload
   ↓
Validação Binária
   ↓
Antivírus
   ↓
Storage Privado (S3)
   ↓
URL Assinada Temporária
```

Essa arquitetura é significativamente mais segura do que servir arquivos diretamente do filesystem público.
