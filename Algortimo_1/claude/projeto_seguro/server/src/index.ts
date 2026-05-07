import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import path from 'path';
import authRoutes from './routes/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SEGURANÇA: Helmet adiciona headers HTTP de segurança ───────────────────
// Protege contra: XSS, Clickjacking, MIME-sniffing, e outros (OWASP A05)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// ─── CORS: Apenas origens confiáveis ────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Parse JSON com limite de tamanho (previne ataques DoS) ─────────────────
app.use(express.json({ limit: '10kb' }));

// ─── Rate Limiting global (OWASP A07 - Auth Failures) ───────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições, tente novamente em 15 minutos.' }
});
app.use(globalLimiter);

// ─── Servir arquivos estáticos do frontend ──────────────────────────────────
app.use(express.static(path.join(__dirname, '../../public')));

// ─── Rotas de autenticação ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Rota catch-all: serve o frontend ───────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// ─── Handler de erros global ────────────────────────────────────────────────
// Nunca exponha stack traces em produção (OWASP A09)
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

export default app;