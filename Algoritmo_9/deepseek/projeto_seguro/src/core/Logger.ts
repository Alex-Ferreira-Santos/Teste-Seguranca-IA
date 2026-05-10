import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { LogEntry, LogLevel, SecurityContext } from '../types';
import { LogSanitizer } from './LogSanitizer';
import { LogValidator } from './LogValidator';
import { LogEncryption } from '../security/LogEncryption';
import { AuditTrail } from '../security/AuditTrail';
import { FileTransport, BufferedFileTransport } from '../transports/FileTransport';
import { ScheduledLogRotator } from './LogRotator';

export class SecureLogger {
  private logger: winston.Logger;
  private sanitizer: LogSanitizer;
  private validator: LogValidator;
  private encryption: LogEncryption;
  private auditTrail: AuditTrail;
  private rateLimiter: Map<string, number[]>;

  constructor() {
    this.sanitizer = new LogSanitizer();
    this.validator = new LogValidator();
    this.encryption = new LogEncryption();
    this.auditTrail = new AuditTrail();
    this.rateLimiter = new Map();
    
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: this.configureTransports()
    });
  }

  private configureTransports(): winston.transport[] {
    const transports: winston.transport[] = [];

    if (process.env.NODE_ENV !== 'production' || process.env.LOG_TO_CONSOLE === 'true') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      );
    }

    const fileRotateTransport = new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: process.env.LOG_MAX_SIZE_MB ? `${process.env.LOG_MAX_SIZE_MB}m` : '10m',
      maxFiles: process.env.LOG_RETENTION_DAYS || '30d',
      format: winston.format.json()
    });

    transports.push(fileRotateTransport);

    const errorRotateTransport = new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '10m',
      maxFiles: '30d',
      format: winston.format.json()
    });

    transports.push(errorRotateTransport);

    return transports;
  }

  

  private checkRateLimit(source: string): boolean {
    const now = Date.now();
    const windowMs = 60000;
    const maxRequests = 100;

    if (!this.rateLimiter.has(source)) {
      this.rateLimiter.set(source, []);
    }

    const timestamps = this.rateLimiter.get(source)!;
    const validTimestamps = timestamps.filter(t => now - t < windowMs);
    
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    this.rateLimiter.set(source, validTimestamps);
    return true;
  }

  async log(level: LogLevel, message: string, context?: SecurityContext, metadata?: Record<string, unknown>): Promise<void> {
    try {
      if (!this.checkRateLimit(context?.ipAddress || 'unknown')) {
        console.warn('Rate limit exceeded for logging source:', context?.ipAddress);
        return;
      }

      const logEntry: LogEntry = {
        id: require('crypto').randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        message,
        source: context?.userId || 'system',
        userId: context?.userId,
        requestId: context?.requestId,
        metadata: {
          ...metadata,
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          sessionId: context?.sessionId
        }
      };

      const validation = this.validator.validate(logEntry);
      if (!validation.isValid) {
        throw new Error(`Invalid log entry: ${validation.errors.join(', ')}`);
      }

      let sanitizedEntry = this.sanitizer.sanitize(logEntry);

      if (process.env.NODE_ENV === 'production' && process.env.LOG_ENCRYPTION_KEY) {
        sanitizedEntry = this.encryption.encryptSensitiveFields(sanitizedEntry);
      }

      this.logger.log({
        level: level.toLowerCase(),
        ...sanitizedEntry
      });

      if (level === LogLevel.ERROR) {
        await this.auditTrail.record(sanitizedEntry);
      }

    } catch (error) {
      console.error('Logging system error:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  error(message: string, context?: SecurityContext, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.ERROR, message, context, metadata);
  }

  warn(message: string, context?: SecurityContext, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.WARN, message, context, metadata);
  }

  info(message: string, context?: SecurityContext, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.INFO, message, context, metadata);
  }

  debug(message: string, context?: SecurityContext, metadata?: Record<string, unknown>): Promise<void> {
    return this.log(LogLevel.DEBUG, message, context, metadata);
  }

  async destroy(): Promise<void> {
    this.auditTrail.destroy();
    await new Promise<void>((resolve) => {
      this.logger.close();
      resolve();
    });
  }

    enableFileTransport(config?: {
    filename?: string;
    buffered?: boolean;
    bufferSize?: number;
  }): void {
    const transport = config?.buffered
      ? new BufferedFileTransport(
          { filename: config?.filename || 'application.log' },
          config?.bufferSize || 100
        )
      : new FileTransport({ filename: config?.filename || 'application.log' });
    
    // Adiciona o transport ao winston
    this.logger.add(new winston.transports.Stream({
      stream: {
        write: (message: string) => {
          try {
            const entry = JSON.parse(message);
            transport.write(entry).catch(console.error);
          } catch (error) {
            console.error('Failed to write to file transport:', error);
          }
        }
      }
    }));
  }

  enableAutoRotation(intervalMinutes: number = 60): ScheduledLogRotator {
    const rotator = new ScheduledLogRotator('logs', intervalMinutes);
    rotator.start();
    return rotator;
  }
}