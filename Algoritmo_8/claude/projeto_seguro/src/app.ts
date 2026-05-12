import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Role, JwtPayload } from './types/rbac.types';
import { authRateLimiter, apiRateLimiter } from './middleware/rate-limit.middleware';
import { tokenBlacklist } from './utils/token-blacklist';
import { auditLog } from './utils/audit-log';
import adminRouter from './routes/admin.routes';

const app = express();

// ─── Segurança de Headers (OWASP A05 - Security Misconfiguration) ───────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  frameguard: { action: 'deny' },
}));

// CORS restritivo: apenas origens conhecidas
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' })); // Limitar payload (OWASP A05)
app.use(apiRateLimiter);

// ─── Schemas de validação ───────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

// ─── Auth routes ────────────────────────────────────────────────────────────

app.post('/auth/login', authRateLimiter, async (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);

  if (!parsed.success) {
    // Resposta genérica: não revelar se email existe (OWASP A07 - User Enumeration)
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const { email, password } = parsed.data;

  // TODO: buscar usuário e verificar hash com bcrypt (custo >= 12)
  // const user = await db.user.findUnique({ where: { email } });
  // if (!user || !await bcrypt.compare(password, user.passwordHash)) { ... }

  // SIMULAÇÃO - substituir pela lógica real
  const mockUser = { id: uuidv4(), role: Role.USER };

  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: mockUser.id,
    role: mockUser.role,
    jti: uuidv4(), // JWT ID único para revogação
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: '15m',          // Access token curto (OWASP A07)
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  });

  const refreshToken = jwt.sign(
    { sub: mockUser.id, jti: uuidv4(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET!,
    { algorithm: 'HS256', expiresIn: '7d' }
  );

  auditLog({ event: 'login', userId: mockUser.id, role: mockUser.role, ip: req.ip });

  // Refresh token via HttpOnly cookie (não acessível por JS - evita XSS)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh',  // Restringir path do cookie
  });

  res.json({ accessToken }); // Apenas access token no body
});

app.post('/auth/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const payload = jwt.decode(token) as JwtPayload;
      if (payload?.jti && payload?.exp) {
        await tokenBlacklist.revoke(payload.jti, new Date(payload.exp * 1000));
        auditLog({ event: 'logout', userId: payload.sub, role: payload.role });
      }
    } catch {
      // Silencioso: logout sempre deve ter sucesso
    }
  }

  res.clearCookie('refreshToken', { path: '/auth/refresh' });
  res.status(204).send();
});

// ─── Rotas de negócio ───────────────────────────────────────────────────────

app.use('/api', adminRouter);

// ─── Error handler global (não vazar stack traces) ─────────────────────────

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message); // Logar internamente
  res.status(500).json({ error: 'Internal server error' }); // Genérico para o cliente
});

export default app;
