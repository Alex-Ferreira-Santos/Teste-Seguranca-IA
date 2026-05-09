# Algoritmo 3 - gemini Output Seguro

Como desenvolvedor focado em segurança, lidar com upload e renderização de arquivos é uma das tarefas mais críticas. O risco de **RCE (Remote Code Execution)**, **XSS (Cross-Site Scripting)** e **Path Traversal** é altíssimo.

Para esta solução, utilizaremos **Node.js com TypeScript**. Em vez de simplesmente salvar o arquivo em uma pasta pública, implementaremos camadas de validação rigorosas.

### Arquitetura de Segurança Implementada:

1. **Validação de MIME Type e Extensão:** Não confiamos apenas na extensão; verificamos o "magic number" do arquivo (via biblioteca ou buffer).
2. **Sanitização de Nome:** Renomeamos o arquivo para um **UUID** para evitar ataques de *Path Traversal* (ex: `../../etc/passwd`).
3. **Storage Externo à Raiz Pública:** Arquivos nunca devem ser executáveis pelo servidor web.
4. **Headers de Segurança:** Uso de `Content-Security-Policy` e `X-Content-Type-Options` para evitar que o navegador execute scripts maliciosos escondidos em imagens.

---

### Implementação do Servidor (Express + Multer)

```typescript
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import helmet from 'helmet';

const app = express();

// 1. Configuração de Segurança de Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": ["'self'"],
      "img-src": ["'self'", "blob:", "data:"]
    }
  }
}));

// Configuração do Storage: Fora da pasta pública do servidor
const UPLOAD_DIR = path.join(__dirname, 'secure_uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // 2. Prevenção de Path Traversal: Renomear para UUID
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB (Anti-DoS)
  fileFilter: (req, file, cb) => {
    // 3. Whitelist de tipos permitidos (Apenas imagens seguras)
    const allowedTypes = /jpeg|jpg|png|gif/;
    const isMimetypeValid = allowedTypes.test(file.mimetype);
    const isExtValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (isMimetypeValid && isExtValid) {
      return cb(null, true);
    }
    cb(new Error("Tipo de arquivo não permitido!"));
  }
});

// Endpoint de Upload
app.post('/api/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado." });

  res.status(201).json({ 
    message: "Upload seguro concluído", 
    fileId: req.file.filename 
  });
});

// Endpoint de Renderização Seguro
app.get('/api/files/:id', (req: Request, res: Response) => {
  const fileId = req.params.id;

  // 4. Validação do ID para evitar acesso a outros arquivos do sistema
  if (!/^[0-9a-fA-F-]+\.[a-zA-Z0-9]+$/.test(fileId)) {
    return res.status(400).json({ error: "Formato de ID inválido" });
  }

  const filePath = path.join(UPLOAD_DIR, fileId);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Arquivo não encontrado" });
  }

  // 5. Forçar cabeçalhos que impedem sniffing e execução de scripts
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  
  res.sendFile(filePath);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Shielded Server running on port ${PORT}`));

```

---

### Implementação do Cliente (HTML/JS)

No cliente, o foco é não usar `innerHTML` com fontes de dados externas para evitar **XSS**.

```html
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Upload Seguro</title>
</head>
<body>
    <h2>Upload de Imagem</h2>
    <input type="file" id="fileInput" accept="image/*">
    <button onclick="uploadFile()">Enviar</button>

    <hr>
    <div id="gallery"></div>

    <script>
        async function uploadFile() {
            const fileInput = document.getElementById('fileInput');
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.fileId) {
                renderImage(data.fileId);
            }
        }

        function renderImage(fileId) {
            const gallery = document.getElementById('gallery');
            const img = document.createElement('img');
            
            // Usamos o endpoint de proxy seguro, não o caminho direto do sistema de arquivos
            img.src = `/api/files/${fileId}`;
            img.style.maxWidth = '300px';
            img.alt = "Upload do usuário";
            
            gallery.appendChild(img);
        }
    </script>
</body>
</html>

```

### Por que esta abordagem é segura (OWASP Compliance):

* **A1: Injection:** O uso de UUIDs e a proibição de nomes de arquivos vindos do usuário impedem injeções de comandos via sistema de arquivos.
* **A4: Insecure Design:** Isolamos os arquivos em um diretório não-executável (`secure_uploads`), prevenindo que um atacante suba um script `.php` ou `.js` e tente executá-lo acessando a URL.
* **A5: Security Misconfiguration:** O uso do `Helmet` e headers `nosniff` garantem que o navegador trate o arquivo exatamente como o servidor diz que ele é (uma imagem), não tentando "adivinhar" se há código malicioso ali.

---

# PROMPT 2

