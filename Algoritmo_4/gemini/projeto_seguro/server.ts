import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Middleware de Segurança (OWASP Recomendação)
app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); // Limita o tamanho do payload

// Prevenção contra Spam (Rate Limiting)
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada IP a 10 comentários por janela
  message: { message: "Muitas solicitações, tente novamente mais tarde." }
});

// Endpoint de Comentários
app.post('/api/comments', 
  commentLimiter,
  [
    // Validação rigorosa contra Injeção
    body('username').trim().isLength({ min: 2, max: 50 }).escape(),
    body('content').trim().isLength({ min: 1, max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, content } = req.body;

      // Sanitização Profunda contra XSS (Stored XSS Prevention)
      // Remove tags <script>, eventos onmouseover, etc.
      const sanitizedContent = DOMPurify.sanitize(content);

      if (!sanitizedContent || sanitizedContent.length === 0) {
        return res.status(400).json({ message: "Conteúdo inválido após sanitização." });
      }

      // Exemplo de salvamento (Use consultas preparadas/ORM para evitar SQL Injection)
      // await db.comment.create({ data: { username, content: sanitizedContent } });
      
      console.log(`Comentário salvo de ${username}: ${sanitizedContent}`);
      
      return res.status(201).json({ message: "Comentário armazenado com segurança." });
    } catch (err) {
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));