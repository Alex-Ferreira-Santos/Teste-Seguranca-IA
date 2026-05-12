import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { sanitize } from "./sanitizer.js";
import { LogEntry, LogLevel, LoggerConfig } from "./types.js";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
  [LogLevel.FATAL]: 4,
};

export class Logger {
  private readonly config: Required<LoggerConfig>;
  private fileStream: fs.WriteStream | null = null;

  // Rate limiting simples — produção deve usar token bucket externo
  private readonly rateBucket = new Map<string, number>();

  constructor(config: LoggerConfig) {
    this.config = {
      level: LogLevel.INFO,
      maxFileSizeMb: 50,
      maxFiles: 10,
      enableConsole: true,
      rateLimitPerSecond: 500,
      outputFile: "",
      ...config,
    };

    if (this.config.outputFile) {
      this.initFileStream();
    }
  }

  // ─── Métodos públicos ─────────────────────────────────────────────────────

  debug(message: string, context?: unknown, correlationId?: string): void {
    this.log(LogLevel.DEBUG, message, context, undefined, correlationId);
  }

  info(message: string, context?: unknown, correlationId?: string): void {
    this.log(LogLevel.INFO, message, context, undefined, correlationId);
  }

  warn(message: string, context?: unknown, correlationId?: string): void {
    this.log(LogLevel.WARN, message, context, undefined, correlationId);
  }

  error(message: string, err?: unknown, context?: unknown, correlationId?: string): void {
    this.log(LogLevel.ERROR, message, context, err, correlationId);
  }

  fatal(message: string, err?: unknown, context?: unknown, correlationId?: string): void {
    this.log(LogLevel.FATAL, message, context, err, correlationId);
  }

  /**
   * Loga uma requisição HTTP de forma padronizada.
   */
  logRequest(params: {
    correlationId: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    userId?: string;
    ip?: string;
  }): void {
    const level = params.statusCode >= 500 ? LogLevel.ERROR
      : params.statusCode >= 400 ? LogLevel.WARN
      : LogLevel.INFO;

    const entry = this.buildEntry(level, `HTTP ${params.method} ${params.path}`, undefined, undefined, params.correlationId);

    entry.httpMethod = params.method;
    entry.requestPath = params.path;
    entry.statusCode = params.statusCode;
    entry.durationMs = params.durationMs;
    entry.userId = params.userId;
    // Mascara último octeto do IP (privacidade LGPD)
    entry.ip = params.ip ? this.maskIp(params.ip) : undefined;

    this.write(entry);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private log(
    level: LogLevel,
    message: string,
    context?: unknown,
    err?: unknown,
    correlationId?: string
  ): void {
    if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[this.config.level]) return;
    if (this.isRateLimited(level)) return;

    const entry = this.buildEntry(level, message, context, err, correlationId);
    this.write(entry);
  }

  private buildEntry(
    level: LogLevel,
    message: string,
    context?: unknown,
    err?: unknown,
    correlationId?: string
  ): LogEntry {
    // Limita tamanho da mensagem para evitar log injection / flooding
    const safeMessage = String(message).slice(0, 500).replace(/[\r\n]/g, " ");

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      correlationId: correlationId ?? randomUUID(),
      service: this.config.service,
      message: safeMessage,
    };

    if (context !== undefined) {
      entry.context = sanitize(context);
    }

    if (err !== undefined) {
      const sanitized = sanitize(err) as { name?: string; message?: string; stack?: string };
      entry.error = {
        name: sanitized.name ?? "UnknownError",
        message: sanitized.message ?? String(err),
        ...(sanitized.stack && { stack: sanitized.stack }),
      };
    }

    return entry;
  }

  private write(entry: LogEntry): void {
    // Previne log injection: JSON é seguro, mas garantimos que não há escape
    const line = JSON.stringify(entry) + "\n";

    if (this.config.enableConsole) {
      const fn = entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL
        ? console.error
        : console.log;
      fn(line);
    }

    if (this.fileStream) {
      this.fileStream.write(line);
      this.rotateIfNeeded();
    }
  }

  private initFileStream(): void {
    const dir = path.dirname(this.config.outputFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    this.fileStream = fs.createWriteStream(this.config.outputFile, { flags: "a" });
    this.fileStream.on("error", (err) => {
      // Falha silenciosa no stream → não deve derrubar a aplicação
      console.error("[Logger] File stream error:", err.message);
    });
  }

  private rotateIfNeeded(): void {
    if (!this.config.outputFile || !this.fileStream) return;
    try {
      const stats = fs.statSync(this.config.outputFile);
      const sizeMb = stats.size / (1024 * 1024);
      if (sizeMb >= this.config.maxFileSizeMb) {
        this.rotate();
      }
    } catch {
      // Arquivo pode não existir ainda
    }
  }

  private rotate(): void {
    this.fileStream?.close();

    for (let i = this.config.maxFiles - 1; i >= 1; i--) {
      const from = `${this.config.outputFile}.${i}`;
      const to = `${this.config.outputFile}.${i + 1}`;
      if (fs.existsSync(from)) {
        if (i + 1 > this.config.maxFiles) fs.unlinkSync(from);
        else fs.renameSync(from, to);
      }
    }

    if (fs.existsSync(this.config.outputFile)) {
      fs.renameSync(this.config.outputFile, `${this.config.outputFile}.1`);
    }

    this.initFileStream();
  }

  /**
   * Rate limiting por nível de log (evita DoS via log flooding).
   * Produção: substituir por Redis / token bucket distribuído.
   */
  private isRateLimited(level: LogLevel): boolean {
    if (this.config.rateLimitPerSecond <= 0) return false;

    const key = `${level}:${Math.floor(Date.now() / 1000)}`;
    const count = (this.rateBucket.get(key) ?? 0) + 1;
    this.rateBucket.set(key, count);

    // Limpa entradas antigas
    if (this.rateBucket.size > 100) {
      const cutoff = Math.floor(Date.now() / 1000) - 5;
      for (const k of this.rateBucket.keys()) {
        const ts = parseInt(k.split(":")[1], 10);
        if (ts < cutoff) this.rateBucket.delete(k);
      }
    }

    return count > this.config.rateLimitPerSecond;
  }

  private maskIp(ip: string): string {
    // IPv4: mascara último octeto. IPv6: mantém primeiros 3 grupos.
    if (ip.includes(".")) {
      return ip.replace(/\.\d+$/, ".xxx");
    }
    return ip.split(":").slice(0, 3).join(":") + ":xxxx";
  }
}