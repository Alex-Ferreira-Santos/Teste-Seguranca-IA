import { describe, it, expect, beforeEach } from "vitest";
import { sanitize } from "../src/logger/sanitizer.js";
import { Logger, LogLevel } from "../src/logger/index.js";

// ─── Sanitizer ───────────────────────────────────────────────────────────────
describe("sanitize()", () => {
  it("mascara campos sensíveis", () => {
    const input = { username: "joao", password: "super_secret", token: "abc123" };
    const result = sanitize(input) as Record<string, unknown>;
    expect(result.username).toBe("joao");
    expect(result.password).toBe("[REDACTED]");
    expect(result.token).toBe("[REDACTED]");
  });

  it("mascara variações de casing e separadores", () => {
    const input = { Password: "x", "access-token": "y", API_KEY: "z" };
    const result = sanitize(input) as Record<string, unknown>;
    expect(result.Password).toBe("[REDACTED]");
    expect(result["access-token"]).toBe("[REDACTED]");
    expect(result.API_KEY).toBe("[REDACTED]");
  });

  it("trunca strings longas", () => {
    const longStr = "a".repeat(3000);
    const result = sanitize(longStr);
    expect((result as string).length).toBeLessThan(2100);
    expect(result as string).toContain("[truncated]");
  });

  it("limita profundidade de objetos aninhados", () => {
    let nested: any = { value: "leaf" };
    for (let i = 0; i < 10; i++) nested = { child: nested };
    const result = sanitize(nested);
    // Não deve lançar exceção e deve conter o marcador de limite
    expect(JSON.stringify(result)).toContain("MaxDepthExceeded");
  });

  it("sanitiza arrays e limita a 50 itens", () => {
    const arr = Array.from({ length: 100 }, (_, i) => ({ password: `pwd${i}` }));
    const result = sanitize(arr) as any[];
    expect(result.length).toBe(50);
    expect(result[0].password).toBe("[REDACTED]");
  });

  it("sanitiza objetos Error", () => {
    const err = new Error("something broke");
    const result = sanitize(err) as any;
    expect(result.name).toBe("Error");
    expect(result.message).toBe("something broke");
  });

  it("trata primitivos corretamente", () => {
    expect(sanitize(42)).toBe(42);
    expect(sanitize(true)).toBe(true);
    expect(sanitize(null)).toBeNull();
    expect(sanitize(undefined)).toBeUndefined();
  });
});

// ─── Logger ──────────────────────────────────────────────────────────────────
describe("Logger", () => {
  let logs: string[] = [];
  let originalLog: typeof console.log;
  let originalError: typeof console.error;

  beforeEach(() => {
    logs = [];
    originalLog = console.log;
    originalError = console.error;
    console.log = (msg: string) => logs.push(msg);
    console.error = (msg: string) => logs.push(msg);
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
  });

  it("respeita nível mínimo de log", () => {
    const logger = new Logger({ service: "test", level: LogLevel.WARN });
    logger.debug("should not appear");
    logger.info("should not appear");
    logger.warn("should appear");
    expect(logs).toHaveLength(1);
    expect(logs[0]).toContain("WARN");
  });

  it("loga JSON válido", () => {
    const logger = new Logger({ service: "test", level: LogLevel.DEBUG });
    logger.info("hello world");
    const parsed = JSON.parse(logs[0]);
    expect(parsed.message).toBe("hello world");
    expect(parsed.service).toBe("test");
    expect(parsed.level).toBe("INFO");
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.correlationId).toBeDefined();
  });

  it("remove newlines da mensagem (previne log injection)", () => {
    const logger = new Logger({ service: "test", level: LogLevel.INFO });
    logger.info("line1\nline2\r\ninjection");
    const parsed = JSON.parse(logs[0]);
    expect(parsed.message).not.toContain("\n");
    expect(parsed.message).not.toContain("\r");
  });

  it("sanitiza contexto automaticamente", () => {
    const logger = new Logger({ service: "test", level: LogLevel.INFO });
    logger.info("ctx test", { user: "alice", password: "1234" });
    const parsed = JSON.parse(logs[0]);
    expect(parsed.context.password).toBe("[REDACTED]");
    expect(parsed.context.user).toBe("alice");
  });

  it("loga erros com stack em dev", () => {
    process.env.NODE_ENV = "development";
    const logger = new Logger({ service: "test", level: LogLevel.ERROR });
    logger.error("boom", new Error("test error"));
    const parsed = JSON.parse(logs[0]);
    expect(parsed.error.name).toBe("Error");
    expect(parsed.error.message).toBe("test error");
    expect(parsed.error.stack).toBeDefined();
    delete process.env.NODE_ENV;
  });

  it("usa correlationId fornecido", () => {
    const logger = new Logger({ service: "test", level: LogLevel.INFO });
    logger.info("with id", undefined, "my-correlation-id");
    const parsed = JSON.parse(logs[0]);
    expect(parsed.correlationId).toBe("my-correlation-id");
  });

  it("aplica rate limiting", () => {
    const logger = new Logger({ service: "test", level: LogLevel.INFO, rateLimitPerSecond: 3 });
    for (let i = 0; i < 10; i++) logger.info("flood");
    expect(logs.length).toBeLessThanOrEqual(3);
  });
});