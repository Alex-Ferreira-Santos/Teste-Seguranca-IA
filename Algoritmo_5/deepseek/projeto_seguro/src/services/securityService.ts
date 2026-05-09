import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

export class SecurityService {
  // Verificar se senha está em breach usando k-anonymity
  static async isPasswordBreached(password: string): Promise<boolean> {
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    try {
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const data = await response.text();
      const breached = data.includes(suffix);
      
      if (breached) {
        logger.warn('Password breach detected');
      }
      
      return breached;
    } catch (error) {
      logger.error('Error checking password breach:', error);
      return false; // Fallback seguro
    }
  }
  
  // Gerar token seguro
  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  // Hash de senha com bcrypt
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }
  
  // Comparar senhas de forma segura
  static async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Sanitizar entrada
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove tags HTML básicas
      .slice(0, 255); // Limitar tamanho
  }
  
  // Validar força da senha
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 12) {
      errors.push('A senha deve ter pelo menos 12 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Tempo constante para prevenir timing attacks
  static async timingSafeCompare(a: string, b: string): Promise<boolean> {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    
    if (bufA.length !== bufB.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(bufA, bufB);
  }
}