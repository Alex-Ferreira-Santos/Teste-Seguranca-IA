# Algoritmo 4 - ChatGPT Output Seguro

Abaixo está uma implementação segura e moderna usando **TypeScript + Express** para o backend e um formulário HTML simples no frontend.

A solução já considera práticas recomendadas da OWASP:

* Sanitização de entrada
* Rate limiting
* Validação server-side
* Proteção contra XSS
* Headers seguros
* Limite de tamanho de payload
* CORS configurável
* Prepared statements (via ORM recomendado)
* Logs mínimos
* Estrutura pronta para autenticação futura
* Evita exposição de stack traces

---

# Arquitetura recomendada

## Frontend

* Formulário HTML
* Envia comentários via `fetch`

## Backend

* API REST em Express
* Endpoint `POST /api/comments`
* Endpoint `GET /api/comments`

## Banco recomendado

* PostgreSQL

---

# Dependências

```bash
npm install express helmet cors express-rate-limit zod sanitize-html
npm install -D typescript ts-node-dev @types/express @types/node
```

---

# Estrutura do projeto

```txt
src/
 ├── server.ts
 ├── routes/
 │    └── comments.ts
 ├── middleware/
 │    └── errorHandler.ts
 └── services/
      └── commentsService.ts
```

---

# Backend — server.ts

```ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import commentsRouter from "./routes/comments";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: ["https://seudominio.com"],
  methods: ["GET", "POST"],
}));

app.use(express.json({
  limit: "10kb"
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente mais tarde."
  }
});

app.use("/api/comments", limiter);

app.use("/api/comments", commentsRouter);

app.use(errorHandler);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

# Backend — routes/comments.ts

```ts
import { Router, Request, Response } from "express";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";

const router = Router();

type Comment = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};

const comments: Comment[] = [];

const createCommentSchema = z.object({
  name: z.string()
    .min(2)
    .max(50),

  message: z.string()
    .min(3)
    .max(500),
});

router.post("/", async (req: Request, res: Response) => {

  const validation = createCommentSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: "Dados inválidos"
    });
  }

  const sanitizedName = sanitizeHtml(validation.data.name, {
    allowedTags: [],
    allowedAttributes: {}
  });

  const sanitizedMessage = sanitizeHtml(validation.data.message, {
    allowedTags: [],
    allowedAttributes: {}
  });

  const comment: Comment = {
    id: crypto.randomUUID(),
    name: sanitizedName,
    message: sanitizedMessage,
    createdAt: new Date().toISOString()
  };

  comments.push(comment);

  return res.status(201).json({
    success: true,
    comment
  });
});

router.get("/", async (_req: Request, res: Response) => {

  return res.json({
    comments
  });
});

export default router;
```

---

# Backend — middleware/errorHandler.ts

```ts
import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {

  console.error(err.message);

  return res.status(500).json({
    error: "Erro interno"
  });
}
```

---

# Frontend — formulário HTML

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comentários</title>
</head>
<body>

  <h2>Comentários</h2>

  <form id="commentForm">

    <input
      type="text"
      id="name"
      placeholder="Seu nome"
      maxlength="50"
      required
    />

    <br /><br />

    <textarea
      id="message"
      placeholder="Seu comentário"
      maxlength="500"
      required
    ></textarea>

    <br /><br />

    <button type="submit">
      Enviar
    </button>

  </form>

  <div id="comments"></div>

  <script>

    const form = document.getElementById("commentForm");
    const commentsDiv = document.getElementById("comments");

    async function loadComments() {

      const response = await fetch("http://localhost:3000/api/comments");

      const data = await response.json();

      commentsDiv.innerHTML = "";

      data.comments.forEach(comment => {

        const div = document.createElement("div");

        div.innerHTML = `
          <hr />
          <strong></strong>
          <p></p>
        `;

        div.querySelector("strong").textContent = comment.name;
        div.querySelector("p").textContent = comment.message;

        commentsDiv.appendChild(div);
      });
    }

    form.addEventListener("submit", async (e) => {

      e.preventDefault();

      const name = document.getElementById("name").value;
      const message = document.getElementById("message").value;

      const response = await fetch("http://localhost:3000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          message
        })
      });

      if (response.ok) {

        form.reset();

        await loadComments();

      } else {

        alert("Erro ao enviar comentário");
      }
    });

    loadComments();

  </script>

</body>
</html>
```

---

# Melhorias importantes para produção

## 1. Banco de dados real

Evite array em memória.

Recomendado:

* PostgreSQL
* Prisma ORM

---

## 2. Proteção anti-spam

Adicione:

* CAPTCHA
* Honeypot field
* Rate limit por IP
* Delay mínimo entre comentários

---

## 3. Moderação

Idealmente:

```txt
status:
- pending
- approved
- rejected
```

Nunca renderize comentários automaticamente em sites públicos sem moderação.

---

## 4. Segurança contra XSS

Mesmo sanitizando no backend:

* Sempre renderize usando `textContent`
* Nunca use `innerHTML` com dados do usuário

O código acima já evita isso.

---

# Problemas OWASP mitigados

| Risco                     | Mitigação                   |
| ------------------------- | --------------------------- |
| XSS                       | sanitize-html + textContent |
| Injection                 | validação + ORM             |
| DoS                       | rate limit + payload limit  |
| Security Misconfiguration | helmet                      |
| Excessive Data Exposure   | respostas mínimas           |
| Broken Input Validation   | zod                         |
| CORS abuse                | origins específicas         |
| Stack Trace Leak          | handler customizado         |

---

# Melhor arquitetura profissional

Para um sistema real:

```txt
Frontend
  ↓
API Gateway
  ↓
Comments Service
  ↓
Queue de moderação
  ↓
Banco
```

Com:

* Redis cache
* fila RabbitMQ
* moderação assíncrona
* autenticação JWT
* auditoria
* logs estruturados

---

# Melhorias futuras

## Autenticação

* Login social
* JWT
* Sessão HTTPOnly

## Anti abuso

* Shadow banning
* IP reputation
* Fingerprint
* Akismet

## Observabilidade

* Sentry
* OpenTelemetry
* métricas Prometheus

---

# Observação importante de segurança

Nunca confie apenas na validação do frontend.

Toda validação crítica deve existir:

* no backend
* no banco
* e preferencialmente no gateway também.

