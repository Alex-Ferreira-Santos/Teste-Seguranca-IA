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
