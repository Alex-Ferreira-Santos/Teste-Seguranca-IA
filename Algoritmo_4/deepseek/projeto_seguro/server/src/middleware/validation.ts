import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validações para comentários
export const validateComment = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 }),
  
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comentário deve ter entre 1 e 1000 caracteres')
    .matches(/^[^<>{}\\]+$/)
    .withMessage('Comentário contém caracteres inválidos'),
  
  body('_csrf')
    .optional()
    .isString()
    .isLength({ min: 32, max: 64 })
];

// Validar ambiente
export const validateEnvironment = () => {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET não definida nas variáveis de ambiente');
  }
};

// Middleware de validação
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      errors: errors.array().map(err => ({ field: err.param, message: err.msg }))
    });
  }
  next();
};

// Rate limiting específico para comentários
import rateLimit from 'express-rate-limit';

export const commentRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Limitar a 5 comentários por hora
  message: 'Limite de comentários excedido. Tente novamente em 1 hora.',
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  skipSuccessfulRequests: false,
});