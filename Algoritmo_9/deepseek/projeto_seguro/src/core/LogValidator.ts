import { LogEntry, LogLevel } from '../types';

export class LogValidator {
  private static MAX_MESSAGE_LENGTH = 10000;
  private static MAX_STACK_TRACE_LENGTH = 5000;
  private static ALLOWED_CHARACTERS = /^[\x20-\x7E\u00A0-\uFFFF]*$/;

  validate(entry: Partial<LogEntry>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entry.level || !Object.values(LogLevel).includes(entry.level as LogLevel)) {
      errors.push('Invalid log level');
    }

    if (!entry.message || entry.message.length === 0) {
      errors.push('Message is required');
    } else if (entry.message.length > LogValidator.MAX_MESSAGE_LENGTH) {
      errors.push(`Message exceeds maximum length of ${LogValidator.MAX_MESSAGE_LENGTH}`);
    } else if (!LogValidator.ALLOWED_CHARACTERS.test(entry.message)) {
      errors.push('Message contains invalid characters');
    }

    if (entry.stackTrace && entry.stackTrace.length > LogValidator.MAX_STACK_TRACE_LENGTH) {
      errors.push(`Stack trace exceeds maximum length of ${LogValidator.MAX_STACK_TRACE_LENGTH}`);
    }

    if (entry.userId && this.hasInjectionPattern(entry.userId)) {
      errors.push('Potential injection detected in userId');
    }

    if (entry.requestId && this.hasInjectionPattern(entry.requestId)) {
      errors.push('Potential injection detected in requestId');
    }

    if (entry.source && this.hasInjectionPattern(entry.source)) {
      errors.push('Potential injection detected in source');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private hasInjectionPattern(input: string): boolean {
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /--/,
      /;.*$/,
      /\$\{.*\}/,
      /`.*`/
    ];
    return injectionPatterns.some(pattern => pattern.test(input));
  }

  validateBatch(entries: Partial<LogEntry>[]): { valid: LogEntry[]; invalid: Partial<LogEntry>[] } {
    const valid: LogEntry[] = [];
    const invalid: Partial<LogEntry>[] = [];

    for (const entry of entries) {
      const { isValid } = this.validate(entry);
      if (isValid && entry.message && entry.level) {
        valid.push(entry as LogEntry);
      } else {
        invalid.push(entry);
      }
    }

    return { valid, invalid };
  }
}