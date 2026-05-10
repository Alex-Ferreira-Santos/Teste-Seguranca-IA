export class LogSanitizer {
  private sensitivePatterns: RegExp[];
  private sensitiveFields: string[];

  constructor() {
    this.sensitivePatterns = [
      /\b[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}\b/g,
      /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
      /\b\d{3}-\d{2}-\d{4}\b/g,
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
      /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
      /ApiKey\s+[A-Za-z0-9]+/g,
    ];
    
    this.sensitiveFields = [
      'password', 'senha', 'token', 'secret', 'authorization',
      'jwt', 'api_key', 'apikey', 'credit_card', 'ssn', 'cpf',
      'access_token', 'refresh_token', 'private_key'
    ];
  }

  sanitize<T extends { message?: string; stackTrace?: string; metadata?: Record<string, unknown> }>(entry: T): T {
    const sanitized = { ...entry };
    
    if (sanitized.message) {
      sanitized.message = this.sanitizeString(sanitized.message);
    }
    
    if (sanitized.stackTrace) {
      sanitized.stackTrace = this.sanitizeString(sanitized.stackTrace);
    }
    
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeObject(sanitized.metadata);
    }
    
    return sanitized;
  }

  private sanitizeString(input: string): string {
    let sanitized = input;
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    return sanitized;
  }

  private sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const isSensitive = this.sensitiveFields.some(field => 
        key.toLowerCase().includes(field)
      );
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeObject(value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null 
            ? this.sanitizeObject(item as Record<string, unknown>)
            : typeof item === 'string' 
              ? this.sanitizeString(item)
              : item
        );
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  public addSensitivePattern(pattern: RegExp): void {
    this.sensitivePatterns.push(pattern);
  }

  public addSensitiveField(field: string): void {
    this.sensitiveFields.push(field);
  }
}