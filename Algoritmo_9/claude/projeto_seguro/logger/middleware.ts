import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { Logger } from "./logger.js";

/**
 * Middleware Express que:
 *  1. Injeta um correlationId em cada requisição (rastreabilidade).
 *  2. Loga início e fim da request.
 *  3. Captura e loga erros não tratados.
 *
 * OWASP A09: Security Logging & Monitoring
 */
export function requestLogger(logger: Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Aceita correlationId externo (ex: API Gateway) ou gera novo
    const correlationId =
      (req.headers["x-correlation-id"] as string) ?? randomUUID();

    // Expõe para uso nos handlers
    req.correlationId = correlationId;
    res.setHeader("x-correlation-id", correlationId);

    const startedAt = Date.now();

    res.on("finish", () => {
      logger.logRequest({
        correlationId,
        method: req.method,
        path: req.path,           // nunca req.url (evita query strings com dados sensíveis)
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        userId: (req as any).userId,
        ip: req.ip,
      });
    });

    next();
  };
}

/**
 * Error handler — DEVE ser registrado após as rotas.
 * Garante que erros não tratados sejam logados com contexto suficiente.
 */
export function errorLogger(logger: Logger) {
  return (err: Error, req: Request, res: Response, _next: NextFunction): void => {
    logger.error(
      "Unhandled request error",
      err,
      { method: req.method, path: req.path },
      req.correlationId
    );

    // Nunca exponha stack trace para o cliente em produção
    const isDev = process.env.NODE_ENV !== "production";
    res.status(500).json({
      error: "Internal Server Error",
      correlationId: req.correlationId,
      ...(isDev && { message: err.message }),
    });
  };
}

// Augmentação de tipo para Express
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}