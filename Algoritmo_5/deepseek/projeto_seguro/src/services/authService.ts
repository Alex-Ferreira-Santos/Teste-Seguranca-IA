import { query } from '../database/db';
import { SecurityService } from './securityService';
import { CreateUserDTO, User, SafeUser } from '../types/user';
import { logger } from '../utils/logger';

export class AuthService {
  static async createUser(userData: CreateUserDTO): Promise<SafeUser> {
    const client = await query('BEGIN');
    
    try {
      // Verificar email único
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [userData.email.toLowerCase()]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }
      
      // Validar senha
      const passwordValidation = SecurityService.validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new Error(`INVALID_PASSWORD: ${passwordValidation.errors.join(', ')}`);
      }
      
      // Verificar se senha está em breach
      const isBreached = await SecurityService.isPasswordBreached(userData.password);
      if (isBreached) {
        throw new Error('PASSWORD_BREACHED');
      }
      
      // Hash da senha
      const passwordHash = await SecurityService.hashPassword(userData.password);
      const activationToken = SecurityService.generateSecureToken();
      
      // Inserir usuário
      const result = await query(
        `INSERT INTO users (email, password_hash, name, activation_token, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, name, created_at, is_active`,
        [
          userData.email.toLowerCase(),
          passwordHash,
          SecurityService.sanitizeInput(userData.name),
          activationToken,
          false // Conta inativa até confirmação por email
        ]
      );
      
      await query('COMMIT');
      
      // Log seguro
      logger.info('Usuário criado', { 
        userId: result.rows[0].id, 
        email: userData.email,
        ip: 'redacted' 
      });
      
      return result.rows[0];
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  static async login(email: string, password: string): Promise<{ user: SafeUser; token: string }> {
    // Buscar usuário
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      // Delay uniforme para prevenir timing attack
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error('INVALID_CREDENTIALS');
    }
    
    const user = result.rows[0] as User;
    
    // Verificar se conta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('ACCOUNT_LOCKED');
    }
    
    // Verificar senha
    const isValidPassword = await SecurityService.comparePasswords(password, user.password_hash);
    
    if (!isValidPassword) {
      // Incrementar tentativas falhas
      await query(
        `UPDATE users 
         SET failed_attempts = failed_attempts + 1,
             locked_until = CASE 
               WHEN failed_attempts + 1 >= 5 THEN NOW() + INTERVAL '30 minutes'
               ELSE locked_until
             END
         WHERE id = $1`,
        [user.id]
      );
      throw new Error('INVALID_CREDENTIALS');
    }
    
    // Resetar tentativas falhas
    await query(
      `UPDATE users 
       SET failed_attempts = 0, 
           locked_until = NULL,
           last_login = NOW()
       WHERE id = $1`,
      [user.id]
    );
    
    // Gerar token JWT
    const token = this.generateJWT(user);
    
    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at,
      is_active: user.is_active
    };
    
    return { user: safeUser, token };
  }
  
  private static generateJWT(user: User): string {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        is_active: user.is_active 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h', algorithm: 'HS256' }
    );
  }
}