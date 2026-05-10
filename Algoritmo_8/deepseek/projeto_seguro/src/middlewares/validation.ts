import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Rate limiter para validações (prevenir DoS em validações pesadas)
const validationLimiter = new RateLimiterMemory({
  points: 100,
  duration: 60,
});

// Sanitização avançada
export class ValidationMiddleware {
  // Validação de input com Zod
  static validate = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Rate limiting para validações
        try {
          await validationLimiter.consume(`${req.ip}:validation`);
        } catch {
          return res.status(429).json({ error: 'Too many validation requests' });
        }

        // Validar dados
        const validatedData = await schema.parseAsync(req[source]);
        
        // Substituir dados originais pelos validados (sanitizados)
        req[source] = validatedData;
        
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({
            error: 'Validation failed',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          });
        }
        next(error);
      }
    };
  };

  // Sanitização de strings (prevenir XSS)
  static sanitizeString = (input: string): string => {
    if (!input) return input;
    
    return input
      .replace(/[&<>"']/g, (match) => {
        const escapeChars: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
        };
        return escapeChars[match];
      })
      .replace(/[\\`$]/g, '') // Remover caracteres perigosos
      .trim()
      .slice(0, 1000); // Limitar tamanho
  };

  // Sanitização profunda de objetos
  static deepSanitize = <T>(obj: T): T => {
    if (!obj) return obj;
    
    if (typeof obj === 'string') {
      return ValidationMiddleware.sanitizeString(obj) as any;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => ValidationMiddleware.deepSanitize(item)) as any;
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Pular campos sensíveis
        if (key.toLowerCase().includes('password') && process.env.NODE_ENV === 'production') {
          sanitized[key] = '***REDACTED***';
        } else {
          sanitized[key] = ValidationMiddleware.deepSanitize(value);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Validação de tipos para prevenir injection
  static validatePrimitive = (value: any, expectedType: 'string' | 'number' | 'boolean' | 'uuid'): boolean => {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string' && value.length > 0 && value.length < 1000;
      case 'number':
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'uuid':
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && uuidRegex.test(value);
      default:
        return false;
    }
  };
}

// Exportar função helper para uso rápido
export const validateRequest = (schema: AnyZodObject, source: 'body' | 'query' | 'params' = 'body') => {
  return ValidationMiddleware.validate(schema, source);
};

// Middleware para sanitizar toda request
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  req.body = ValidationMiddleware.deepSanitize(req.body);
  req.query = ValidationMiddleware.deepSanitize(req.query);
  req.params = ValidationMiddleware.deepSanitize(req.params);
  next();
};