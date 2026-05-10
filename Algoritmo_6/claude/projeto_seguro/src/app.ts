import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import formProgressRouter from './routes/formProgress.routes';

const app = express();

// ─── Segurança de cabeçalhos HTTP (OWASP A05) ─────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// ─── CORS restrito (OWASP A05) ─────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requisições sem origin (curl, Postman em dev) apenas em desenvolvimento
      if (!origin && process.env.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS: origem não permitida'));
      }
    },
    methods: ['GET', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
    maxAge: 600,  // cache preflight por 10 minutos
  })
);

// ─── Body parsing com limite de tamanho (OWASP A04) ───────────────────────
app.use(express.json({ limit: '64kb' }));  // previne payloads gigantes

// ─── Rotas ─────────────────────────────────────────────────────────────────
app.use('/api/form-progress', formProgressRouter);

// ─── Handler de erros genérico — nunca vaza stack trace (OWASP A09) ───────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({ success: false, error: 'Erro interno.' });
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app;