import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { LogEntry } from '../types';

interface AuditEntry {
  id: string;
  timestamp: string;
  eventType: string;
  severity: string;
  source: string;
  messageHash: string;
  errorType?: string;
  userId?: string;
  requestId?: string;
}

export class AuditTrail {
  private auditLogPath: string;
  private buffer: AuditEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.auditLogPath = path.join(process.cwd(), 'logs', 'audit.log');
    this.ensureLogDirectory();
    this.flushInterval = setInterval(() => this.flush(), 5000);
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  async record(logEntry: LogEntry): Promise<void> {
    const auditEntry: AuditEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      eventType: 'ERROR_LOG',
      severity: logEntry.level,
      source: logEntry.source,
      messageHash: this.hashMessage(logEntry.message),
      errorType: logEntry.errorType,
      userId: logEntry.userId,
      requestId: logEntry.requestId
    };
    
    this.buffer.push(auditEntry);
    
    if (this.buffer.length >= 10) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entriesToWrite = [...this.buffer];
    this.buffer = [];

    try {
      const lines = entriesToWrite.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.appendFileSync(this.auditLogPath, lines);
    } catch (error) {
      console.error('Failed to write audit log:', error);
      this.buffer.unshift(...entriesToWrite);
    }
  }

  private hashMessage(message: string): string {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  async query(filters: Partial<AuditEntry>, limit = 100): Promise<AuditEntry[]> {
    await this.flush();
    
    if (!fs.existsSync(this.auditLogPath)) {
      return [];
    }

    const content = fs.readFileSync(this.auditLogPath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const entries = lines
      .map(line => JSON.parse(line) as AuditEntry)
      .filter(entry => {
        return Object.entries(filters).every(([key, value]) => entry[key as keyof AuditEntry] === value);
      })
      .slice(-limit);

    return entries;
  }

  async rotate(oldPath: string): Promise<void> {
    await this.flush();
    
    if (fs.existsSync(this.auditLogPath)) {
      const stats = fs.statSync(this.auditLogPath);
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (stats.size > maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newPath = `${this.auditLogPath}.${timestamp}`;
        fs.renameSync(this.auditLogPath, newPath);
      }
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flush();
    }
  }
}