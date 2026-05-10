import { AuditLog } from '../entities/AuditLog';
import { AppDataSource } from '../config/database';
import { Between, LessThan, MoreThan, FindOptionsWhere } from 'typeorm';

interface AuditLogEntry {
  userId: string;
  action: string;
  resource: string;
  details?: any;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  errorMessage?: string;
}

export class SecurityAudit {
  private static auditRepository = AppDataSource.getRepository(AuditLog);

  static async log(entry: AuditLogEntry): Promise<void> {
    try {
      const auditLog = new AuditLog();
      auditLog.userId = entry.userId;
      auditLog.action = entry.action;
      auditLog.resource = entry.resource;
      auditLog.details = entry.details || {};
      auditLog.ipAddress = entry.ipAddress;
      auditLog.userAgent = entry.userAgent;
      auditLog.success = entry.success;
      auditLog.severity = entry.severity;
      auditLog.errorMessage = entry.errorMessage;

      await this.auditRepository.save(auditLog);

      // Alertas em tempo real para eventos críticos
      if (entry.severity === 'CRITICAL' || 
          (entry.severity === 'HIGH' && !entry.success)) {
        await this.sendRealTimeAlert(entry);
      }

      // Rotação automática de logs (manter apenas 90 dias)
      await this.rotateLogs();
    } catch (error) {
      console.error('Failed to save audit log:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  }

  private static async sendRealTimeAlert(entry: AuditLogEntry): Promise<void> {
    // Implementar integração com Slack, Discord, Email, etc.
    const alertMessage = `
      🚨 SECURITY ALERT - ${entry.severity}
      Action: ${entry.action}
      User: ${entry.userId}
      Resource: ${entry.resource}
      IP: ${entry.ipAddress}
      Success: ${entry.success}
      Time: ${new Date().toISOString()}
    `;

    console.error('CRITICAL ALERT:', alertMessage);
    
    // Exemplo: enviar para webhook do Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          body: JSON.stringify({ text: alertMessage }),
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }
  }

  private static async rotateLogs(): Promise<void> {
    const retentionDays = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    await this.auditRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
  }

  // Buscar logs com filtros
  static async getAuditLogs(filters: {
    page: number;
    limit: number;
    severity?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
  }): Promise<{ data: AuditLog[]; total: number; page: number; totalPages: number }> {
    const where: FindOptionsWhere<AuditLog> = {};
    
    if (filters.severity) where.severity = filters.severity as any;
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    
    if (filters.startDate && filters.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    } else if (filters.startDate) {
      where.createdAt = MoreThan(filters.startDate);
    } else if (filters.endDate) {
      where.createdAt = LessThan(filters.endDate);
    }

    const [data, total] = await this.auditRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    return {
      data,
      total,
      page: filters.page,
      totalPages: Math.ceil(total / filters.limit),
    };
  }

  // Estatísticas de segurança
  static async getSecurityStats(): Promise<any> {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 3600000);
    const last24h = new Date(now.getTime() - 86400000);
    const last7d = new Date(now.getTime() - 604800000);

    const stats = {
      failedLogins: {
        lastHour: await this.countEvents('USER_LOGIN_FAILED', 3600),
        last24h: await this.countEvents('USER_LOGIN_FAILED', 86400),
        last7d: await this.countEvents('USER_LOGIN_FAILED', 604800),
      },
      unauthorizedAttempts: {
        lastHour: await this.countEvents('UNAUTHORIZED_ACCESS_ATTEMPT', 3600),
        last24h: await this.countEvents('UNAUTHORIZED_ACCESS_ATTEMPT', 86400),
        last7d: await this.countEvents('UNAUTHORIZED_ACCESS_ATTEMPT', 604800),
      },
      criticalEvents: {
        last24h: await this.countCriticalEvents(86400),
        last7d: await this.countCriticalEvents(604800),
      },
      topOffendingIPs: await this.getTopOffendingIPs(10),
      auditTrail: {
        totalLogs: await this.auditRepository.count(),
        oldestLog: await this.getOldestLog(),
        newestLog: await this.getNewestLog(),
      },
    };

    return stats;
  }

  static async countEvents(action: string, secondsAgo: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - secondsAgo * 1000);
    return await this.auditRepository.count({
      where: {
        action,
        createdAt: MoreThan(cutoffDate),
      },
    });
  }

  static async countCriticalEvents(secondsAgo: number): Promise<number> {
    const cutoffDate = new Date(Date.now() - secondsAgo * 1000);
    return await this.auditRepository.count({
      where: {
        severity: 'CRITICAL',
        createdAt: MoreThan(cutoffDate),
      },
    });
  }

  static async countBlockedIPs(): Promise<number> {
    // Implementar lógica de IPs bloqueados
    return 0;
  }

  private static async getTopOffendingIPs(limit: number): Promise<any[]> {
    const result = await this.auditRepository
      .createQueryBuilder('log')
      .select('log.ipAddress', 'ip')
      .addSelect('COUNT(*)', 'count')
      .where('log.success = :success', { success: false })
      .groupBy('log.ipAddress')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
    
    return result;
  }

  private static async getOldestLog(): Promise<Date | null> {
    const oldest = await this.auditRepository.findOne({
      order: { createdAt: 'ASC' },
    });
    return oldest?.createdAt || null;
  }

  private static async getNewestLog(): Promise<Date | null> {
    const newest = await this.auditRepository.findOne({
      order: { createdAt: 'DESC' },
    });
    return newest?.createdAt || null;
  }

  // Limpar logs antigos manualmente
  static async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await this.auditRepository.delete({
      createdAt: LessThan(cutoffDate),
    });
    
    return result.affected || 0;
  }
}

// Exportar para compatibilidade
export const AuditService = SecurityAudit;