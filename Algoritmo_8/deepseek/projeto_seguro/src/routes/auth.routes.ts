import { Router } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthMiddleware } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validation';
import { userSchemas } from '../schemas/validation.schemas';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// Rate limiting específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: 'Too many login attempts, please try again later',
});

router.post('/register',
  validateRequest(userSchemas.register),
  async (req, res) => {
    try {
      const { user, accessToken, refreshToken } = await AuthService.register(
        req.body.email,
        req.body.password,
        req.ip,
        req.get('user-agent') || 'unknown'
      );

      // Set secure cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles.map(r => ({ id: r.id, name: r.name })),
        },
        refreshToken,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

router.post('/login',
  loginLimiter,
  validateRequest(userSchemas.login),
  async (req, res) => {
    try {
      const { user, accessToken, refreshToken } = await AuthService.login(
        req.body.email,
        req.body.password,
        req.ip,
        req.get('user-agent') || 'unknown'
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles.map(r => ({ id: r.id, name: r.name })),
        },
        refreshToken,
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }
);

router.post('/logout',
  AuthMiddleware.authenticate,
  async (req, res) => {
    await AuthService.logout(req.user!.id, req.cookies.access_token);
    
    res.clearCookie('access_token');
    res.json({ message: 'Logged out successfully' });
  }
);

export default router;