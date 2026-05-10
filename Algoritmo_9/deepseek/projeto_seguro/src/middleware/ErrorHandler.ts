import { Request, Response, NextFunction } from 'express';
import { SecureLogger } from '../core/Logger';
import { SecurityContext } from '../types';

export class SecureErrorHandler {
  private logger: SecureLogger;

  constructor(logger: SecureLogger) {
    this.logger = logger;
  }

  handleError = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const securityContext: SecurityContext = {
      userId: req.user?.id,
      sessionId: req.session?.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    };
    
    const statusCode = this.getStatusCode(err);
    const errorType = this.getErrorType(err);
    
    this.logger.error(
      err.message,
      securityContext,
      {
        path: req.path,
        method: req.method,
        statusCode: statusCode,
        errorName: err.name,
        errorType: errorType,
        queryParams: Object.keys(req.query).join(','),
        requestId: req.id
      }
    );

    const responseBody: any = {
      error: 'Internal server error',
      requestId: req.id,
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV !== 'production') {
      responseBody.message = err.message;
      responseBody.errorType = errorType;
    }

    res.status(statusCode).json(responseBody);
  };

  private getStatusCode(err: Error): number {
    if (err.name === 'ValidationError') return 400;
    if (err.name === 'UnauthorizedError') return 401;
    if (err.name === 'ForbiddenError') return 403;
    if (err.name === 'NotFoundError') return 404;
    return 500;
  }

  private getErrorType(err: Error): string {
    if (err.name === 'ValidationError') return 'VALIDATION_ERROR';
    if (err.name === 'UnauthorizedError') return 'UNAUTHORIZED';
    if (err.name === 'ForbiddenError') return 'FORBIDDEN';
    if (err.name === 'NotFoundError') return 'NOT_FOUND';
    if (err.message.includes('database')) return 'DATABASE_ERROR';
    if (err.message.includes('network')) return 'NETWORK_ERROR';
    return 'INTERNAL_ERROR';
  }
}

export const requestLogger = (logger: SecureLogger) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();
    
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const duration = Date.now() - start;
      
      if (res.statusCode >= 400 && res.statusCode < 500) {
        const securityContext: SecurityContext = {
          userId: req.user?.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: req.id
        };
        
        logger.warn(
          `HTTP ${res.statusCode}: ${req.method} ${req.path}`,
          securityContext,
          {
            statusCode: res.statusCode,
            duration,
            requestId: req.id,
            userAgent: req.get('user-agent')
          }
        );
      }
      
      originalEnd.apply(res, args as any);
    };
    
    next();
  };
};