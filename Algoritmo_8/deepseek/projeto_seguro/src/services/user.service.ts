import { User } from '../entities/User';
import { Role } from '../entities/Role';
import { AppDataSource } from '../config/database';
import bcrypt from 'bcrypt';
import { SecurityAudit } from './audit.service';
import { In, Not, IsNull } from 'typeorm';
import { redisClient } from '../utils/security.utils';

export class UserService {
  private static userRepository = AppDataSource.getRepository(User);
  private static roleRepository = AppDataSource.getRepository(Role);
  private static readonly SALT_ROUNDS = 12;

  static async findById(id: string, includeSensitive: boolean = false): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (includeSensitive) {
      return {
        id: user.id,
        email: user.email,
        roles: user.roles,
        isActive: user.isActive,
        mfaEnabled: user.mfaEnabled,
        metadata: user.metadata,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => ({ id: r.id, name: r.name, level: r.level })),
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  static async findAll(filters: {
    page: number;
    limit: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: any[]; total: number; page: number; totalPages: number }> {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('user.deletedAt IS NULL');

    if (filters.search) {
      query.andWhere('user.email ILIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    const [users, total] = await query
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    const data = users.map(user => ({
      id: user.id,
      email: user.email,
      roles: user.roles.map(r => ({ id: r.id, name: r.name })),
      isActive: user.isActive,
      lastLogin: user.metadata?.lastLogin,
      createdAt: user.createdAt,
    }));

    return {
      data,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  static async update(id: string, updateData: any, updatedBy: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Atualizar email
    if (updateData.email && updateData.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateData.email },
      });
      if (existingUser) {
        throw new Error('Email already in use');
      }
      user.email = updateData.email;
    }

    // Atualizar senha
    if (updateData.newPassword) {
      if (!updateData.currentPassword) {
        throw new Error('Current password required');
      }
      
      const isValidPassword = await bcrypt.compare(updateData.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }
      
      user.passwordHash = await bcrypt.hash(updateData.newPassword, this.SALT_ROUNDS);
      user.metadata = {
        ...user.metadata,
        passwordChangedAt: new Date(),
      };
    }

    await this.userRepository.save(user);

    // Invalidar cache de permissões
    await this.invalidateUserPermissions(id);

    // Log da atualização
    await SecurityAudit.log({
      userId: updatedBy,
      action: 'USER_UPDATED',
      resource: 'user',
      details: { targetUserId: id, updatedFields: Object.keys(updateData) },
      ipAddress: 'system',
      userAgent: 'system',
      success: true,
      severity: 'MEDIUM',
    });

    return this.findById(id);
  }

  static async updateRoles(userId: string, roleIds: string[], updatedBy: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
      relations: ['roles'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    const roles = await this.roleRepository.find({
      where: { id: In(roleIds) },
    });

    if (roles.length !== roleIds.length) {
      throw new Error('Some roles not found');
    }

    // Prevenir remoção de super_admin se for o único
    const hasSuperAdmin = user.roles.some(r => r.name === 'super_admin');
    const removingSuperAdmin = hasSuperAdmin && !roles.some(r => r.name === 'super_admin');
    
    if (removingSuperAdmin) {
      const superAdminCount = await this.userRepository.count({
        where: {
          roles: { name: 'super_admin' },
          deletedAt: IsNull(),
        },
      });
      
      if (superAdminCount === 1) {
        throw new Error('Cannot remove the last super admin role');
      }
    }

    user.roles = roles;
    await this.userRepository.save(user);

    // Invalidar cache
    await this.invalidateUserPermissions(userId);

    await SecurityAudit.log({
      userId: updatedBy,
      action: 'USER_ROLES_UPDATED',
      resource: 'user',
      details: { targetUserId: userId, newRoles: roleIds },
      ipAddress: 'system',
      userAgent: 'system',
      success: true,
      severity: 'HIGH',
    });
  }

  static async softDelete(userId: string, deletedBy: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId, deletedAt: IsNull() },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Prevenir exclusão do último super admin
    const isSuperAdmin = await this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('user.id = :userId', { userId })
      .andWhere('role.name = :roleName', { roleName: 'super_admin' })
      .getExists();

    if (isSuperAdmin) {
      const superAdminCount = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.roles', 'role')
        .where('role.name = :roleName', { roleName: 'super_admin' })
        .andWhere('user.deletedAt IS NULL')
        .getCount();
      
      if (superAdminCount === 1) {
        throw new Error('Cannot delete the last super admin');
      }
    }

    user.deletedAt = new Date();
    user.isActive = false;
    await this.userRepository.save(user);

    // Invalidar cache
    await this.invalidateUserPermissions(userId);

    await SecurityAudit.log({
      userId: deletedBy,
      action: 'USER_DELETED',
      resource: 'user',
      details: { targetUserId: userId },
      ipAddress: 'system',
      userAgent: 'system',
      success: true,
      severity: 'HIGH',
    });
  }

  static async enableUser(userId: string, enabledBy: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = true;
    user.deletedAt = null;
    await this.userRepository.save(user);

    await SecurityAudit.log({
      userId: enabledBy,
      action: 'USER_ENABLED',
      resource: 'user',
      details: { targetUserId: userId },
      ipAddress: 'system',
      userAgent: 'system',
      success: true,
      severity: 'MEDIUM',
    });
  }

  static async invalidateUserPermissions(userId: string): Promise<void> {
    try {
      await redisClient.del(`perm:${userId}`);
    } catch (error) {
      console.error('Failed to invalidate permission cache:', error);
    }
  }

  static async invalidateUserPermissionsByRole(roleId: string): Promise<void> {
    const users = await this.userRepository.find({
      where: { roles: { id: roleId } },
      select: ['id'],
    });
    
    for (const user of users) {
      await this.invalidateUserPermissions(user.id);
    }
  }

  static async countUsers(): Promise<number> {
    return await this.userRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  static async countActiveUsers(): Promise<number> {
    return await this.userRepository.count({
      where: { isActive: true, deletedAt: IsNull() },
    });
  }

  static async countNewUsersToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await this.userRepository.count({
      where: {
        createdAt: MoreThan(today),
        deletedAt: IsNull(),
      },
    });
  }
}