import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
import { initDatabase, createTestUser } from './database';
import { secureLogin, authenticateToken, refreshAccessToken, secureLogout, AuthRequest } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições, tente novamente mais tarde.'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentativas por IP em 15 minutos
  skipSuccessfulRequests: true,
});

app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Rota de login
app.post('/api/login', loginLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('Senha deve ter no mínimo 6 caracteres'),
], async (req, res) => {
  // Validação
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  try {
    const { accessToken, refreshToken, user } = await secureLogin(email, password, ip, userAgent);
    
    // Configurar cookies seguros
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    });
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 dias
    });
    
    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Rota de refresh token
app.post('/api/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token não encontrado' });
  }
  
  try {
    const newAccessToken = await refreshAccessToken(refreshToken);
    
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

// Rota de logout
app.post('/api/logout', authenticateToken, async (req: AuthRequest, res) => {
  if (req.user) {
    await secureLogout(req.user.id);
  }
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true });
});

// Rota protegida exemplo
app.get('/api/user', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// Iniciar servidor
async function startServer() {
  await initDatabase();
  await createTestUser(); // Remove em produção!
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor seguro rodando na porta ${PORT}`);
    console.log(`🔒 Modo: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(console.error);