import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import { securityHeaders } from './middleware/securityHeaders';
import { authController } from './controllers/authController';
import { logger } from './utils/logger';
import { pool } from './database/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança
app.use(helmet({
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? 'https://seudominio.com' : 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(securityHeaders);
app.use(express.json({ limit: '10kb' })); // Limitar tamanho do payload
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rotas
app.post('/api/register', authController.register);
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Error handler global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  await pool.connect();
  logger.info(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV}`);
});