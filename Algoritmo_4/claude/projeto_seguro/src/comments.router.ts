import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ZodError } from 'zod';
import { CommentSchema } from './comment.schema';
import { sanitize } from './sanitize';
import { insertComment, findApproved, findPending, approveComment, hashIp } from './comment.store';

export const commentsRouter = Router();

/* ── Rate limiting: 3 POSTs por IP por minuto ── */
const postLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => hashIp(req.ip ?? 'unknown'),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas. Aguarde alguns minutos.',
    });
  },
});

/* ── Validação de Origin/Referer ── */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',');

function originCheck(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers['origin'] ?? req.headers['referer'];
  if (!origin || !ALLOWED_ORIGINS.some(o => (origin as string).startsWith(o))) {
    res.status(403).json({ success: false, message: 'Origem não permitida.' });
    return;
  }
  next();
}

/* ── Honeypot: responde 200 falso para bots ── */
function honeypotCheck(req: Request, res: Response, next: NextFunction): void {
  const { website } = req.body as Record<string, unknown>;
  if (typeof website === 'string' && website.length > 0) {
    res.status(200).json({ success: true, message: 'Comentário recebido.' });
    return;
  }
  next();
}

/* ─────────────────────────────────────────────
   GET /api/comments?page_id=/minha-pagina
   Retorna comentários aprovados
   ───────────────────────────────────────────── */
commentsRouter.get('/', (req: Request, res: Response): void => {
  try {
    const rawPageId = String(req.query['page_id'] ?? '/');
    if (rawPageId.length > 500) {
      res.status(400).json({ success: false, message: 'page_id inválido.' });
      return;
    }
    const pageId = sanitize(rawPageId);
    const comments = findApproved(pageId);
    res.json({ success: true, comments });
  } catch {
    res.status(500).json({ success: false, message: 'Erro interno.' });
  }
});

/* ─────────────────────────────────────────────
   POST /api/comments
   Recebe novo comentário (fica pendente de moderação)
   ───────────────────────────────────────────── */
commentsRouter.post(
  '/',
  postLimiter,
  originCheck,
  honeypotCheck,
  (req: Request, res: Response): void => {
    try {
      const parsed = CommentSchema.parse(req.body);
      const ip = req.ip ?? req.socket?.remoteAddress ?? 'unknown';

      const comment = insertComment({
        author_name:  sanitize(parsed.author_name),
        author_email: parsed.author_email,
        body:         sanitize(parsed.body),
        page_id:      sanitize(parsed.page_id),
        approved:     false,
        ip_hash:      hashIp(ip),
      });

      res.status(201).json({
        success: true,
        message: 'Comentário recebido! Ele aparecerá após moderação.',
        comment: {
          id:          comment.id,
          author_name: comment.author_name,
          body:        comment.body,
          created_at:  comment.created_at,
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        res.status(422).json({
          success: false,
          message: err.errors[0]?.message ?? 'Dados inválidos.',
          errors:  err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
        });
        return;
      }
      console.error('[POST /comments]', err);
      res.status(500).json({ success: false, message: 'Erro interno.' });
    }
  }
);

/* ─────────────────────────────────────────────
   Rotas de moderação (proteja com autenticação em produção!)
   GET  /api/comments/admin/pending
   POST /api/comments/admin/approve/:id
   ───────────────────────────────────────────── */
commentsRouter.get('/admin/pending', (_req, res) => {
  res.json({ success: true, comments: findPending() });
});

commentsRouter.post('/admin/approve/:id', (req, res) => {
  const ok = approveComment(req.params['id'] ?? '');
  if (!ok) { res.status(404).json({ success: false, message: 'Comentário não encontrado.' }); return; }
  res.json({ success: true, message: 'Comentário aprovado.' });
});
