import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import path from 'path';
import { commentsRouter } from './comments.router';

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);
const isProd = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? `http://localhost:${PORT}`).split(',');

/* ── Cabeçalhos de segurança (OWASP A05) ── */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'", 'https://cdn.jsdelivr.net'],
        styleSrc:       ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:        ['https://fonts.gstatic.com'],
        imgSrc:         ["'self'", 'data:'],
        connectSrc:     ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
  })
);

/* ── CORS restrito (OWASP A05) ── */
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

/* ── Parsers ── */
app.use(cookieParser());
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

/* ── Servir arquivos estáticos (o formulário HTML) ── */
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ── CSRF (OWASP A07) ── */
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict',
    secure:   isProd,
  },
});

/* Endpoint para o frontend buscar o token CSRF */
app.get('/api/csrf-token', csrfProtection, (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

/* ── Rotas de comentários (com CSRF) ── */
app.use('/api/comments', csrfProtection, commentsRouter);

/* ── Handler de erro global ── */
app.use((err: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403).json({ success: false, message: 'Token CSRF inválido ou expirado. Recarregue a página.' });
    return;
  }
  console.error('[Erro não tratado]', err.message);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

/* ── Start ── */
app.listen(PORT, () => {
  console.log(`\n✅  Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋  Formulário:      http://localhost:${PORT}/index.html`);
  console.log(`🛠️   Admin pendentes: http://localhost:${PORT}/api/comments/admin/pending`);
  console.log(`\n   Para aprovar um comentário:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/comments/admin/approve/<id>\n`);
});

export default app;
