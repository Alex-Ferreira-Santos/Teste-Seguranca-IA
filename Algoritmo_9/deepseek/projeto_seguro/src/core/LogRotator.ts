import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface RotationConfig {
  maxSizeInBytes: number;
  maxAgeInDays: number;
  maxFiles: number;
  compress: boolean;
}

export class LogRotator {
  private config: RotationConfig;
  private logDirectory: string;

  constructor(logDirectory: string = 'logs', config?: Partial<RotationConfig>) {
    this.logDirectory = path.join(process.cwd(), logDirectory);
    this.config = {
      maxSizeInBytes: config?.maxSizeInBytes || 10 * 1024 * 1024, // 10MB
      maxAgeInDays: config?.maxAgeInDays || 30,
      maxFiles: config?.maxFiles || 10,
      compress: config?.compress ?? true
    };

    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
      console.log(`Created log directory: ${this.logDirectory}`);
    }
  }

  async checkAndRotate(filePath: string): Promise<void> {
    const fullPath = path.join(this.logDirectory, path.basename(filePath));
    
    if (!fs.existsSync(fullPath)) {
      return;
    }

    const stats = fs.statSync(fullPath);
    
    if (stats.size >= this.config.maxSizeInBytes) {
      await this.rotateFile(fullPath);
    }
  }

  private async rotateFile(filePath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const parsedPath = path.parse(filePath);
    const rotatedPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-${timestamp}${parsedPath.ext}`
    );

    try {
      // Renomeia o arquivo atual
      fs.renameSync(filePath, rotatedPath);
      
      // Cria um novo arquivo vazio
      fs.writeFileSync(filePath, '');
      
      // Opcionalmente comprime o arquivo rotacionado
      if (this.config.compress && this.shouldCompress(rotatedPath)) {
        await this.compressFile(rotatedPath);
      }
      
      // Limpa arquivos antigos
      await this.cleanOldFiles(parsedPath.dir, parsedPath.name);
      
      console.log(`Rotated log file: ${rotatedPath}`);
    } catch (error) {
      console.error(`Failed to rotate log file ${filePath}:`, error);
    }
  }

  private shouldCompress(filePath: string): boolean {
    // Não comprimir arquivos já comprimidos
    return !filePath.endsWith('.gz') && !filePath.endsWith('.zip');
  }

  private async compressFile(filePath: string): Promise<void> {
    try {
      if (process.platform === 'win32') {
        // Para Windows, usar uma abordagem diferente
        await this.compressFileWindows(filePath);
      } else {
        // Para Unix/Linux/Mac
        await execAsync(`gzip "${filePath}"`);
      }
      console.log(`Compressed: ${filePath}`);
    } catch (error) {
      console.error(`Failed to compress file ${filePath}:`, error);
    }
  }

  private async compressFileWindows(filePath: string): Promise<void> {
    // Implementação simples para Windows usando fs
    const compressedPath = `${filePath}.gz`;
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    
    const fileContent = fs.readFileSync(filePath);
    const compressed = await gzipAsync(fileContent);
    fs.writeFileSync(compressedPath, compressed);
    fs.unlinkSync(filePath);
  }

  private async cleanOldFiles(directory: string, baseName: string): Promise<void> {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    
    // Filtra arquivos relacionados ao log
    const logFiles = files
      .filter(file => file.startsWith(baseName))
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        mtime: fs.statSync(path.join(directory, file)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime); // Mais recentes primeiro

    // Remove arquivos por idade
    for (const file of logFiles) {
      const ageInDays = (now - file.mtime) / (1000 * 60 * 60 * 24);
      if (ageInDays > this.config.maxAgeInDays) {
        fs.unlinkSync(file.path);
        console.log(`Removed old log file: ${file.name}`);
      }
    }

    // Mantém apenas os N arquivos mais recentes
    if (logFiles.length > this.config.maxFiles) {
      const filesToRemove = logFiles.slice(this.config.maxFiles);
      for (const file of filesToRemove) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log(`Removed excess log file: ${file.name}`);
        }
      }
    }
  }

  async rotateAllLogs(): Promise<void> {
    const files = fs.readdirSync(this.logDirectory);
    
    for (const file of files) {
      const filePath = path.join(this.logDirectory, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && (file.endsWith('.log') || file.includes('application') || file.includes('error'))) {
        await this.checkAndRotate(file);
      }
    }
  }

  getLogFiles(): { name: string; size: number; modified: Date }[] {
    if (!fs.existsSync(this.logDirectory)) {
      return [];
    }

    const files = fs.readdirSync(this.logDirectory);
    
    return files
      .filter(file => file.endsWith('.log') || file.endsWith('.gz'))
      .map(file => {
        const filePath = path.join(this.logDirectory, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());
  }

  async getLogStats(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    const files = this.getLogFiles();
    
    let totalSize = 0;
    let oldestFile: Date | null = null;
    let newestFile: Date | null = null;
    
    for (const file of files) {
      totalSize += file.size;
      if (!oldestFile || file.modified < oldestFile) oldestFile = file.modified;
      if (!newestFile || file.modified > newestFile) newestFile = file.modified;
    }
    
    return {
      totalSize,
      fileCount: files.length,
      oldestFile,
      newestFile
    };
  }

  async cleanup(): Promise<void> {
    await this.cleanOldFiles(this.logDirectory, '');
  }
}

// Utilitário para agendamento de rotação automática
export class ScheduledLogRotator {
  private rotator: LogRotator;
  private intervalId?: NodeJS.Timeout;
  private checkIntervalMs: number;

  constructor(logDirectory?: string, checkIntervalMinutes: number = 60) {
    this.rotator = new LogRotator(logDirectory);
    this.checkIntervalMs = checkIntervalMinutes * 60 * 1000;
  }

  start(): void {
    if (this.intervalId) {
      return;
    }

    // Executa imediatamente
    this.rotator.rotateAllLogs().catch(console.error);
    
    // Agenda verificações periódicas
    this.intervalId = setInterval(() => {
      this.rotator.rotateAllLogs().catch(console.error);
    }, this.checkIntervalMs);
    
    console.log(`Log rotator started with interval: ${this.checkIntervalMs / 60000} minutes`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      console.log('Log rotator stopped');
    }
  }

  async rotateNow(): Promise<void> {
    await this.rotator.rotateAllLogs();
  }

  getStats(): Promise<ReturnType<LogRotator['getLogStats']>> {
    return this.rotator.getLogStats();
  }
}