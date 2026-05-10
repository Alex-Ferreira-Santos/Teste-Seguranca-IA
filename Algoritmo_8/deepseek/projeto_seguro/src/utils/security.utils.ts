import { createClient } from 'redis';
import crypto from 'crypto';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { validationResult } from 'express-validator';

// Redis client singleton
let redisInstance: ReturnType<typeof createClient> | null = null;

export const getRedisClient = () => {
  if (!redisInstance) {
    redisInstance = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisInstance.on('error', (err) => console.error('Redis Client Error:', err));
    redisInstance.connect().catch(console.error);
  }
  return redisInstance;
};

export const redisClient = getRedisClient();

// Funções de criptografia
export class EncryptionUtils {
  private static algorithm = 'aes-256-gcm';
  private static key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-chars-long-enough!!', 'utf8');
  
  static encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
    };
  }
  
  static decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

// Sanitização de dados
export class SanitizationUtils {
  static sanitizeObject<T extends object>(obj: T, sensitiveFields: string[] = ['password', 'token', 'secret']): T {
    const sanitized = { ...obj };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        (sanitized as any)[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
  
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }
  
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove < e >
      .trim()
      .slice(0, 1000); // Limita tamanho
  }
  
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
}

// Rate limiting avançado
export class AdvancedRateLimiter {
  private static limiters = new Map<string, RateLimiterRedis>();
  
  static getLimiter(key: string, points: number = 100, duration: number = 60): RateLimiterRedis {
    if (!this.limiters.has(key)) {
      const limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `rl_${key}`,
        points,
        duration,
        blockDuration: duration * 2,
      });
      this.limiters.set(key, limiter);
    }
    return this.limiters.get(key)!;
  }
  
  static async consume(key: string, points: number = 1): Promise<void> {
    const limiter = this.getLimiter(key);
    await limiter.consume(key, points);
  }
}

// Validação de segurança para headers
export class SecurityHeadersValidator {
  static validateOrigin(origin: string | undefined, allowedOrigins: string[]): boolean {
    if (!origin) return false;
    return allowedOrigins.includes(origin);
  }
  
  static validateUserAgent(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    // Bloquear user agents suspeitos
    const blockedAgents = ['bot', 'crawler', 'scraper', 'curl', 'wget'];
    const lowerAgent = userAgent.toLowerCase();
    return !blockedAgents.some(agent => lowerAgent.includes(agent));
  }
  
  static getClientIP(req: any): string {
    return req.headers['x-forwarded-for']?.split(',')[0] || 
           req.headers['x-real-ip'] || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }
}

// Detecção de anomalias
export class AnomalyDetection {
  private static suspiciousPatterns = [
    /union.*select/i,
    /exec.*\(/i,
    /xp_cmdshell/i,
    /<script/i,
    /javascript:/i,
    /onload=/i,
  ];
  
  static detectSQLiInjection(input: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(input));
  }
  
  static detectBruteForce(attempts: number, maxAttempts: number = 10): boolean {
    return attempts > maxAttempts;
  }
  
  static async logAnomaly(ip: string, type: string, details: any): Promise<void> {
    const anomalyKey = `anomaly:${ip}`;
    await redisClient.lPush(anomalyKey, JSON.stringify({
      type,
      details,
      timestamp: new Date().toISOString(),
    }));
    await redisClient.lTrim(anomalyKey, 0, 99); // Manter últimos 100
    await redisClient.expire(anomalyKey, 86400); // Expirar em 24h
  }
}

// Gerador de tokens seguros
export class SecureTokenGenerator {
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64');
  }
  
  static generateAPIToken(): string {
    return `pk_${crypto.randomBytes(32).toString('hex')}`;
  }
  
  static generateRefreshToken(): string {
    return `rf_${crypto.randomBytes(48).toString('hex')}`;
  }
  
  static generatePasswordResetToken(): string {
    return `pr_${crypto.randomBytes(32).toString('hex')}_${Date.now()}`;
  }
}

// Máscara de dados sensíveis para logs
export class DataMasking {
  static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `***@${domain}`;
    return `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  }
  
  static maskIP(ip: string): string {
    if (ip.includes('.')) {
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    if (ip.includes(':')) {
      return ip.substring(0, 8) + ':xxxx:xxxx:xxxx:xxxx';
    }
    return ip;
  }
  
  static maskPhone(phone: string): string {
    if (phone.length <= 4) return '***';
    return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
  }
}

// Verificador de força de senha
export class PasswordStrengthChecker {
  static checkStrength(password: string): {
    score: number;
    feedback: string[];
    isStrong: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 12) score += 2;
    else if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include at least one uppercase letter');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include at least one lowercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include at least one special character');
    
    if (/(.)\1{2,}/.test(password)) score -= 1;
    if (/^(?=.*(password|123456|qwerty))/i.test(password)) score -= 2;
    
    const isStrong = score >= 4;
    
    return {
      score: Math.max(0, Math.min(5, score)),
      feedback,
      isStrong,
    };
  }
}

// Exportar cliente Redis para outros módulos
export { redisInstance as redis };