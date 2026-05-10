import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import { getRequestId } from './request-context';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {

  const requestId = getRequestId();

  logger.error({
    requestId,
    err,
    path: req.originalUrl,
    method: req.method
  }, 'Unhandled error');

  res.status(500).json({
    error: 'internal_server_error',
    requestId
  });
}