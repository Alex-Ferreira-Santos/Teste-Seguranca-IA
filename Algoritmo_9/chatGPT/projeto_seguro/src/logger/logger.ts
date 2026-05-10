import pino from 'pino';

const sensitiveFields = [
  'password',
  'token',
  'authorization',
  'cookie',
  'cpf',
  'creditCard',
  'headers.authorization',
  'headers.cookie'
];

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  redact: {
    paths: sensitiveFields,
    censor: '[REDACTED]'
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  formatters: {
    level(label) {
      return { level: label };
    }
  },

  serializers: {
    err: (err: any) => ({
      type: err?.name,
      message: err?.message,
      stack:
        process.env.NODE_ENV === 'production'
          ? undefined
          : err?.stack
    })
  }
});