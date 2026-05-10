import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { SecureLogger } from '../core/Logger';
import { SecureErrorHandler, requestLogger } from '../middleware/ErrorHandler';
import { SecurityContext } from '../types';
import * as crypto from 'crypto';

const app = express();
const port = process.env.PORT || 3000;

// Middleware de segurança
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Adicionar ID único a cada requisição
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Inicializar logger
const logger = new SecureLogger();
const errorHandler = new SecureErrorHandler(logger);

// Middleware para extrair contexto de segurança
app.use((req, res, next) => {
  const securityContext: SecurityContext = {
    userId: req.user?.id,
    sessionId: req.session?.id,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.id
  };
  
  (req as any).securityContext = securityContext;
  next();
});

// Middleware de logging de requisições
app.use(requestLogger(logger));

// Rotas de exemplo
app.get('/', (req, res) => {
  res.json({
    message: 'Secure Logging System API',
    version: '1.0.0',
    requestId: req.id
  });
});

app.get('/test-info', async (req, res) => {
  await logger.info('Test info endpoint accessed', (req as any).securityContext, {
    endpoint: '/test-info'
  });
  
  res.json({ message: 'Info logged successfully', requestId: req.id });
});

app.get('/test-warning', async (req, res) => {
  await logger.warn('Test warning endpoint accessed', (req as any).securityContext, {
    endpoint: '/test-warning',
    threshold: 0.8
  });
  
  res.json({ message: 'Warning logged successfully', requestId: req.id });
});

app.get('/test-error', async (req, res, next) => {
  try {
    throw new Error('Test error with sensitive data: user@example.com and password=secret123');
  } catch (error) {
    next(error);
  }
});

app.post('/test-validation', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.name = 'ValidationError';
      throw error;
    }
    
    await logger.info('Validation passed', (req as any).securityContext, {
      email: email // Isso será sanitizado automaticamente
    });
    
    res.json({ message: 'Validation successful', requestId: req.id });
  } catch (error) {
    next(error);
  }
});

// Rota para simular rate limiting
app.get('/test-rate-limit', async (req, res) => {
  for (let i = 0; i < 150; i++) {
    await logger.debug(`Rate limit test message ${i}`, (req as any).securityContext);
  }
  
  res.json({ message: 'Rate limit test completed', requestId: req.id });
});

// Handler de erros (deve ser o último middleware)
app.use(errorHandler.handleError);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await logger.destroy();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await logger.destroy();
  process.exit(0);
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Secure Logging System API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`\nTest endpoints:`);
  console.log(`  GET  http://localhost:${port}/`);
  console.log(`  GET  http://localhost:${port}/test-info`);
  console.log(`  GET  http://localhost:${port}/test-warning`);
  console.log(`  GET  http://localhost:${port}/test-error`);
  console.log(`  POST http://localhost:${port}/test-validation`);
  console.log(`  GET  http://localhost:${port}/test-rate-limit`);
});

export { app, logger };