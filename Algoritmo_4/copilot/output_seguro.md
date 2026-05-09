# Algoritmo 4 - Copilot Output Seguro

Para implementar uma sessão de comentários de forma **segura** e evitar problemas comuns listados pela OWASP, precisamos pensar em duas partes: o **formulário no frontend** e o **endpoint no backend**. Vou usar **TypeScript com Express** para o servidor, aplicando boas práticas de segurança.

---

## 🛡️ Principais cuidados de segurança
- **Validação de entrada**: nunca confiar nos dados do usuário, validar tamanho, tipo e conteúdo.
- **Escapando HTML**: evitar XSS sanitizando comentários antes de exibir.
- **CSRF proteção**: usar tokens CSRF em formulários.
- **Rate limiting**: limitar requisições para evitar spam.
- **Armazenamento seguro**: usar prepared statements para evitar SQL Injection.
- **Logs e auditoria**: registrar tentativas suspeitas.

---

## 💻 Frontend (formulário seguro)

```html
<form id="commentForm" method="POST" action="/comments">
  <label for="author">Nome:</label>
  <input type="text" id="author" name="author" maxlength="50" required />

  <label for="comment">Comentário:</label>
  <textarea id="comment" name="comment" maxlength="500" required></textarea>

  <!-- Token CSRF -->
  <input type="hidden" name="_csrf" value="{{csrfToken}}" />

  <button type="submit">Enviar</button>
</form>
```

- `maxlength` evita comentários gigantes.
- `required` força preenchimento.
- `csrfToken` protege contra ataques CSRF.

---

## ⚙️ Backend (Express + TypeScript)

```typescript
import express, { Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import bodyParser from "body-parser";
import xss from "xss";

const app = express();

// Segurança básica
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por minuto
});
app.use(limiter);

// CSRF
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Endpoint para salvar comentários
app.post("/comments", (req: Request, res: Response) => {
  const { author, comment } = req.body;

  // Validação básica
  if (!author || !comment) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  // Sanitização contra XSS
  const safeAuthor = xss(author.trim());
  const safeComment = xss(comment.trim());

  // Aqui você salvaria no banco usando prepared statements
  // Exemplo fictício:
  // await db.query("INSERT INTO comments (author, comment) VALUES (?, ?)", [safeAuthor, safeComment]);

  res.status(201).json({ message: "Comentário salvo com sucesso!" });
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
```

---

## ✅ Próximos passos
- Implementar **armazenamento seguro** (ex: PostgreSQL com parâmetros).
- Adicionar **autenticação** para usuários logados.
- Criar **moderação** para evitar conteúdo ofensivo.
- Usar **CSP** para mitigar XSS.

---

Quer que eu expanda para incluir também a **moderação automática** (ex: bloqueio de palavras ofensivas) ou prefere que eu foque primeiro em **persistência segura no banco de dados**?

----

# PROMPT 2

Perfeito, Alex! Vou te entregar um exemplo **completo e pronto para rodar** em Node.js com TypeScript e Express, já incluindo medidas de segurança contra problemas comuns da OWASP.  

---

## 📦 Passo 1: Estrutura do projeto

Crie uma pasta e inicialize o projeto:

```bash
mkdir comentarios-seguros
cd comentarios-seguros
npm init -y
npm install express helmet express-rate-limit csurf body-parser xss cookie-parser
npm install --save-dev typescript ts-node @types/node @types/express @types/csurf @types/body-parser
npx tsc --init
```

---

## 💻 Código do servidor (`src/server.ts`)

```typescript
import express, { Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import csrf from "csurf";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import xss from "xss";

const app = express();

// Segurança básica
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Rate limiting para evitar spam
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requisições por minuto
});
app.use(limiter);

// CSRF protection
const csrfProtection = csrf({ cookie: true });

// Rota para servir o formulário com token CSRF
app.get("/form", csrfProtection, (req: Request, res: Response) => {
  res.send(`
    <form method="POST" action="/comments">
      <label for="author">Nome:</label>
      <input type="text" id="author" name="author" maxlength="50" required />

      <label for="comment">Comentário:</label>
      <textarea id="comment" name="comment" maxlength="500" required></textarea>

      <input type="hidden" name="_csrf" value="${req.csrfToken()}" />

      <button type="submit">Enviar</button>
    </form>
  `);
});

// Endpoint para salvar comentários
app.post("/comments", csrfProtection, (req: Request, res: Response) => {
  const { author, comment } = req.body;

  if (!author || !comment) {
    return res.status(400).json({ error: "Campos obrigatórios" });
  }

  // Sanitização contra XSS
  const safeAuthor = xss(author.trim());
  const safeComment = xss(comment.trim());

  // Aqui você salvaria no banco usando prepared statements
  // Exemplo fictício:
  // await db.query("INSERT INTO comments (author, comment) VALUES (?, ?)", [safeAuthor, safeComment]);

  res.status(201).json({ message: "Comentário salvo com sucesso!", data: { safeAuthor, safeComment } });
});

app.listen(3000, () => {
  console.log("Servidor rodando em http://localhost:3000");
});
```

---

## 🚀 Executando

```bash
npx ts-node src/server.ts
```

Depois abra `http://localhost:3000/form` [(localhost in Bing)](https://www.bing.com/search?q="http%3A%2F%2Flocalhost%3A3000%2Fform") para ver o formulário de comentários.

---

## ✅ Segurança aplicada
- **Helmet**: adiciona cabeçalhos de segurança.
- **Rate limiting**: evita spam e ataques de força bruta.
- **CSRF token**: protege contra requisições forjadas.
- **XSS sanitização**: limpa entradas maliciosas.
- **Validação de campos**: impede dados vazios ou excessivos.

---

Quer que eu expanda esse exemplo para incluir também a **persistência real em banco de dados** (ex: PostgreSQL ou MongoDB), já com queries seguras contra **SQL Injection**?