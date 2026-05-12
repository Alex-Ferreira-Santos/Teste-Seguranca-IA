export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
  FATAL = "FATAL",
}

export interface LogEntry {
  timestamp: string;         // ISO 8601 — auditável
  level: LogLevel;
  correlationId: string;     // rastreabilidade entre serviços
  service: string;           // nome do serviço que gerou o log
  message: string;
  context?: unknown;         // dados extras (sanitizados)
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  durationMs?: number;       // tempo de execução, útil para performance
  userId?: string;           // ID do usuário (nunca dados pessoais crus)
  requestPath?: string;
  httpMethod?: string;
  statusCode?: number;
  ip?: string;               // pode ser mascarado se necessário por LGPD
}

export interface LoggerConfig {
  service: string;
  level: LogLevel;
  outputFile?: string;       // path para o arquivo de log
  maxFileSizeMb?: number;    // rotação de arquivo
  maxFiles?: number;
  enableConsole?: boolean;
  rateLimitPerSecond?: number;
}