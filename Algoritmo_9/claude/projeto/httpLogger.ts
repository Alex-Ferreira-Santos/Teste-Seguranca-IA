import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import logger from "./logger";

// ─── Rotas que NÃO devem ser logadas ──────────────────────────────────────
const SKIP_ROUTES = ["/health", "/metrics", "/favicon.ico"];

// ─── Middleware principal ──────────────────────────────────────────────────
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  if (SKIP_ROUTES.includes(req.path)) return next();

  // ID único por requisição — útil para rastrear logs de uma mesma chamada
  const requestId = (req.headers["x-request-id"] as string) ?? uuidv4();
  req.headers["x-request-id"] = requestId;
  res.setHeader("x-request-id", requestId);

  const startTime = Date.now();

  // Quando a resposta terminar, loga o resultado
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    const logData = {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      contentLength: res.getHeader("content-length"),
    };

    if (statusCode >= 500) {
      logger.error("HTTP 5xx", logData);
    } else if (statusCode >= 400) {
      logger.warn("HTTP 4xx", logData);
    } else {
      logger.http("HTTP request", logData);
    }
  });

  next();
}