import { Logger } from "./logger.js";
import { LogLevel, LoggerConfig } from "./types.js";

export { Logger } from "./logger.js";
export { LogLevel } from "./types.js";
export type { LogEntry, LoggerConfig } from "./types.js";
export { sanitize } from "./sanitizer.js";
export { requestLogger, errorLogger } from "./middleware.js";

/**
 * Cria um logger pré-configurado a partir de variáveis de ambiente.
 * Uso: const logger = createLogger({ service: "payment-service" });
 */
export function createLogger(overrides: Partial<LoggerConfig> & { service: string }): Logger {
  const config: LoggerConfig = {
    service: overrides.service,
    level: (process.env.LOG_LEVEL as LogLevel) ?? LogLevel.INFO,
    outputFile: process.env.LOG_FILE ?? "",
    maxFileSizeMb: Number(process.env.LOG_MAX_FILE_SIZE_MB ?? 50),
    maxFiles: Number(process.env.LOG_MAX_FILES ?? 10),
    enableConsole: process.env.LOG_CONSOLE !== "false",
    rateLimitPerSecond: Number(process.env.LOG_RATE_LIMIT ?? 500),
    ...overrides,
  };

  return new Logger(config);
}

/**
 * Singleton global — use apenas se não tiver DI configurado.
 */
let _globalLogger: Logger | null = null;

export function getGlobalLogger(service?: string): Logger {
  if (!_globalLogger) {
    _globalLogger = createLogger({ service: service ?? "app" });
  }
  return _globalLogger;
}