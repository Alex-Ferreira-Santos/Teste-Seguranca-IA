import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';
import { SecurityService } from '../services/securityService';
import { logger } from '../utils/logger';
import { rateLimit } from '../middleware/rateLimiter';

export const authController = {
  register: [
    // Validações
    body('email')
      .isEmail()
      .normalizeEmail()
      .isLength({ max: 255 }),
    body('password')
      .isLength({ min: 12 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/),
    body('confirmPassword')
      .custom((value, { req }) => value === req.body.password)
      .withMessage('Senhas não conferem'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .matches(/^[a-zA-ZÀ-ÿ\s]+$/),
    
    rateLimit.registerLimiter,
    
    async (req: Request, res: Response) => {
      const startTime = Date.now();
      
      try {
        // Verificar erros de validação
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          // Delay uniforme para prevenir timing attack
          await new Promise(resolve => setTimeout(resolve, 500));
          return res.status(400).json({ 
            error: 'Dados inválidos', 
            details: errors.array() 
          });
        }
        
        // Verificar CSRF (simplificado - em produção use csrf-sync)
        const csrfToken = req.headers['x-csrf-token'];
        if (!csrfToken || csrfToken !== process.env.CSRF_SECRET) {
          logger.warn('CSRF token inválido', { ip: req.ip });
          return res.status(403).json({ error: 'Token CSRF inválido' });
        }
        
        const { email, password, name } = req.body;
        
        // Criar usuário
        const user = await AuthService.createUser({
          email,
          password,
          confirmPassword: req.body.confirmPassword,
          name
        });
        
        // Log de auditoria
        logger.info('Novo usuário registrado', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          responseTime: Date.now() - startTime
        });
        
        // Retornar sucesso sem dados sensíveis
        res.status(201).json({
          message: 'Usuário cadastrado com sucesso! Verifique seu email para ativar a conta.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            created_at: user.created_at
          }
        });
        
      } catch (error: any) {
        // Tratamento seguro de erros
        let statusCode = 400;
        let message = 'Erro ao cadastrar usuário';
        
        if (error.message === 'EMAIL_ALREADY_EXISTS') {
          message = 'Email já cadastrado';
        } else if (error.message.startsWith('INVALID_PASSWORD')) {
          message = error.message.replace('INVALID_PASSWORD: ', '');
        } else if (error.message === 'PASSWORD_BREACHED') {
          message = 'Esta senha foi encontrada em vazamentos de dados. Por favor, escolha uma senha mais segura.';
          statusCode = 400;
        } else {
          statusCode = 500;
          message = 'Erro interno do servidor';
          logger.error('Erro no registro:', error);
        }
        
        // Delay uniforme
        await new Promise(resolve => setTimeout(resolve, 500));
        
        res.status(statusCode).json({ error: message });
      }
    }
  ],
  
  login: [
    rateLimit.loginLimiter,
    async (req: Request, res: Response) => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        
        const { user, token } = await AuthService.login(email, password);
        
        res.json({
          message: 'Login realizado com sucesso',
          user,
          token
        });
        
      } catch (error: any) {
        let message = 'Email ou senha inválidos';
        let statusCode = 401;
        
        if (error.message === 'ACCOUNT_LOCKED') {
          message = 'Conta temporariamente bloqueada. Tente novamente em 30 minutos.';
        }
        
        res.status(statusCode).json({ error: message });
      }
    }
  ]
};