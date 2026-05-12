import { Permission, Role } from '../types/rbac.types';

interface AuditEntry {
  event: 'access_granted' | 'access_denied' | 'role_changed' | 'login' | 'logout';
  userId: string;
  role: Role | string;
  requiredPermissions?: Permission[];
  path?: string;
  method?: string;
  ip?: string;
  targetUserId?: string;
  oldRole?: Role;
  newRole?: Role;
}

/**
 * OWASP A09 - Security Logging and Monitoring Failures.
 * Em produção, enviar para sistema de SIEM (Datadog, Splunk, CloudWatch, etc).
 * NUNCA logar dados sensíveis: senhas, tokens completos, PII não necessária.
 */
export function auditLog(entry: AuditEntry): void {
  const log = {
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Produção: substituir por integração com SIEM
  if (process.env.NODE_ENV === 'production') {
    // Ex: await siem.send(log)
    console.log(JSON.stringify(log));
  } else {
    console.log('[AUDIT]', JSON.stringify(log, null, 2));
  }
}
