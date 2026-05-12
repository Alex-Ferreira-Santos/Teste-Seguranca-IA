/**
 * Sanitizer — remove / mascara campos sensíveis antes de qualquer log.
 * OWASP A02: Cryptographic Failures / A09: Security Logging Failures
 */

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "pwd", "secret", "token", "accesstoken",
  "refreshtoken", "authorization", "apikey", "api_key", "creditcard",
  "cardnumber", "cvv", "ssn", "cpf", "cnpj", "pin", "privatekey",
  "private_key", "clientsecret", "client_secret",
]);

const MASK = "[REDACTED]";
const MAX_STRING_LENGTH = 2000; // evita log flooding com payloads gigantes
const MAX_DEPTH = 6;

export function sanitize(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[MaxDepthExceeded]";

  if (value === null || value === undefined) return value;

  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? value.slice(0, MAX_STRING_LENGTH) + "…[truncated]"
      : value;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      // Stack apenas em ambientes não-produção
      ...(process.env.NODE_ENV !== "production" && { stack: value.stack }),
    };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, "");
      result[key] = SENSITIVE_KEYS.has(normalizedKey)
        ? MASK
        : sanitize(val, depth + 1);
    }
    return result;
  }

  return String(value);
}