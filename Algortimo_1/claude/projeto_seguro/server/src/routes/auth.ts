import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/AuthService';
import { validateRegister, validateLogin } from '../middleware/validation';
import { requireAuth } from './auth';

const router = Router();

// ─── RATE LIMITING ESPECÍFICO PARA AUTH ──────────────────────────────────────
// Mais restritivo que o global (OWASP A07 - Identification and Authentication Failures)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,                   // Máximo 10 tentativas por IP em 15 minutos
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Aguarde 15 minutos.' },
  skipSuccessfulRequests: true // Não conta requests bem-sucedidos
});

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', authLimiter, validateRegister, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.register(
      email.trim().toLowerCase(),
      password
    );

    const statusCode = result.success ? 201 : 400;
    res.status(statusCode).json(result.success
      ? { message: result.message }
      : { error: result.message }
    );
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', authLimiter, validateLogin, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email.trim(), password);

    if (!result.success) {
      res.status(401).json({ error: result.message });
      return;
    }

    res.status(200).json({
      message: result.message,
      token: result.token,
      user: result.user
    });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ error: 'Erro ao realizar login. Tente novamente.' });
  }
});

// ─── GET /api/auth/me (rota protegida de exemplo) ─────────────────────────────
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Usuário autenticado com sucesso.',
    user: req.user
  });
});

export default router;