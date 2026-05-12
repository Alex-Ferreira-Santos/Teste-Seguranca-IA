import rateLimit from 'express-rate-limit';

/**
 * Rate limiter para rotas de autenticação.
 * OWASP A07 - Identification and Authentication Failures
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 10,                    // máximo 10 tentativas por janela
  standardHeaders: true,
  legacyHeaders: false,
  // Nunca revelar limite restante em 429 (evita descoberta do threshold)
  message: { error: 'Too many requests, please try again later' },
  skipSuccessfulRequests: true, // Apenas conta falhas
});

/**
 * Rate limiter geral para API.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});
