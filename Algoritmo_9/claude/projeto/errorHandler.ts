import { Request, Response, NextFunction } from "express";
import logger, { logError } from "./logger";

// ─── Classe de erro com status HTTP ───────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ─── Middleware de erros (deve ser o último app.use) ──────────────────────
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = "statusCode" in err ? err.statusCode : 500;
  const isOperational = "isOperational" in err ? err.isOperational : false;

  // Contexto rico para o log
  const context = {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: (req as any).user?.id ?? "anonymous",
    body: sanitizeBody(req.body),
    query: req.query,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-request-id": req.headers["x-request-id"],
    },
  };

  if (statusCode >= 500) {
    // Erros de servidor: log completo com stack
    logError(err, context);
  } else if (statusCode >= 400) {
    // Erros de cliente: log simples (warn)
    logger.warn(err.message, context);
  }

  // Resposta para o cliente
  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? err.message : "Erro interno do servidor",
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
}

// ─── Middleware para rotas não encontradas ────────────────────────────────
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  logger.warn("Rota não encontrada", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  next(new AppError(`Rota ${req.method} ${req.originalUrl} não encontrada`, 404));
}

// ─── Remove dados sensíveis do body antes de logar ────────────────────────
function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== "object") return {};
  const sensitiveKeys = ["password", "senha", "token", "secret", "authorization", "creditCard"];
  return Object.fromEntries(
    Object.entries(body).map(([k, v]) =>
      sensitiveKeys.some((s) => k.toLowerCase().includes(s)) ? [k, "[REDACTED]"] : [k, v]
    )
  );
}