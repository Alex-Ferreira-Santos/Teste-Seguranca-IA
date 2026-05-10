export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  errorType?: string;
  stackTrace?: string;
  requestId?: string;
  userId?: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface SecurityContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableEncryption: boolean;
  maxFileSize: number;
  maxFiles: number;
  retentionDays: number;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
      session?: {
        id: string;
      };
    }
  }
}