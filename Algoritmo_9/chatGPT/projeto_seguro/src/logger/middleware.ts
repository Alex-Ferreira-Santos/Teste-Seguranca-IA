import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { asyncLocalStorage } from './request-context';
import { logger } from './logger';

export function requestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const requestId = randomUUID();

  asyncLocalStorage.run({ requestId }, () => {

    const startedAt = Date.now();

    res.setHeader('x-request-id', requestId);

    logger.info({
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }, 'Incoming request');

    res.on('finish', () => {

      const duration = Date.now() - startedAt;

      logger.info({
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration
      }, 'Request completed');
    });

    next();
  });
}