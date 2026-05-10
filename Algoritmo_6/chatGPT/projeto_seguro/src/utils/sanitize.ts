export function sanitizeObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }

  if (obj && typeof obj === "object") {
    const clean: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (
        key === "__proto__" ||
        key === "constructor" ||
        key === "prototype"
      ) {
        continue
      }

      clean[key] = sanitizeObject(value)
    }

    return clean
  }

  return obj
}