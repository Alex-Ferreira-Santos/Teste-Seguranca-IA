import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { SecurityAudit } from './audit.service';
import { randomBytes } from 'crypto';

export class AuthService {
  private static readonly SALT_ROUNDS = 12;

  static async register(email: string, password: string, ip: string, userAgent: string) {
    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Get default user role
    const defaultRole = await Role.findOne({ where: { name: 'user' } });
    if (!defaultRole) {
      throw new Error('Default role not found');
    }

    // Create user
    const user = new User();
    user.email = email;
    user.passwordHash = passwordHash;
    user.roles = [defaultRole];
    user.isActive = true;
    user.metadata = {
      failedLoginAttempts: 0,
    };

    await user.save();

    // Log registration
    await SecurityAudit.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      resource: 'auth',
      details: { email },
      ipAddress: ip,
      userAgent,
      success: true,
      severity: 'MEDIUM',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  static async login(email: string, password: string, ip: string, userAgent: string) {
    const user = await User.findOne({
      where: { email, isActive: true },
      relations: ['roles'],
    });

    if (!user) {
      // Simulate delay to prevent timing attacks
      await bcrypt.hash('dummy', this.SALT_ROUNDS);
      throw new Error('Invalid credentials');
    }

    // Check account lock
    if (user.metadata?.lockedUntil && new Date() < new Date(user.metadata.lockedUntil)) {
      throw new Error('Account locked. Try again later');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = (user.metadata?.failedLoginAttempts || 0) + 1;
      
      if (failedAttempts >= 5) {
        user.metadata = {
          ...user.metadata,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
          failedLoginAttempts: failedAttempts,
        };
      } else {
        user.metadata = {
          ...user.metadata,
          failedLoginAttempts: failedAttempts,
        };
      }
      
      await user.save();
      throw new Error('Invalid credentials');
    }

    // Reset failed attempts
    user.metadata = {
      ...user.metadata,
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLogin: new Date(),
      lastLoginIP: ip,
    };
    await user.save();

    // Log successful login
    await SecurityAudit.log({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'auth',
      ipAddress: ip,
      userAgent,
      success: true,
      severity: 'LOW',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  private static async generateTokens(user: User) {
    const payload = {
      userId: user.id,
      email: user.email,
      roles: user.roles.map(r => r.name),
      mfaRequired: user.mfaEnabled,
    };

    // Access token (short lived)
    const accessToken = jwt.sign(payload, process.env.JWT_PRIVATE_KEY!, {
      algorithm: 'RS256',
      expiresIn: '15m',
    });

    // Refresh token (long lived, stored in DB/Redis)
    const refreshToken = randomBytes(64).toString('hex');
    await redisClient.setEx(
      `refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  static async refreshAccessToken(refreshToken: string) {
    // Implementation would verify refresh token and issue new access token
    // Similar to above but with validation
  }

  static async logout(userId: string, accessToken: string) {
    // Blacklist access token
    const decoded = jwt.decode(accessToken) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn > 0) {
      await redisClient.setEx(`revoked:${accessToken}`, expiresIn, 'true');
    }
    
    // Remove refresh token
    await redisClient.del(`refresh:${userId}`);
    
    // Invalidate permission cache
    await PermissionCache.invalidate(userId);
  }
}