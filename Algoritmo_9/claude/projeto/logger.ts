import winston from "winston";
import path from "path";

// ─── Níveis customizados ───────────────────────────────────────────────────
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// ─── Formato para console (desenvolvimento) ────────────────────────────────
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

// ─── Formato para arquivo (produção) ──────────────────────────────────────
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ─── Transports ───────────────────────────────────────────────────────────
const transports: winston.transport[] = [
  // Console sempre ativo
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Todos os logs em combined.log
  new winston.transports.File({
    filename: path.join("logs", "combined.log"),
    format: fileFormat,
    maxsize: 10 * 1024 * 1024, // 10MB
    maxFiles: 7,               // mantém 7 arquivos rotacionados
    tailable: true,
  }),

  // Apenas erros em error.log
  new winston.transports.File({
    filename: path.join("logs", "error.log"),
    level: "error",
    format: fileFormat,
    maxsize: 10 * 1024 * 1024,
    maxFiles: 30,
    tailable: true,
  }),
];

// ─── Instância do logger ───────────────────────────────────────────────────
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  levels,
  transports,
  // Captura exceções não tratadas e rejeições de Promise
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join("logs", "exceptions.log"),
      format: fileFormat,
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join("logs", "rejections.log"),
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

// ─── Helper: loga um erro com stack trace ─────────────────────────────────
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  } else {
    logger.error("Erro desconhecido", { error, ...context });
  }
}

export default logger;