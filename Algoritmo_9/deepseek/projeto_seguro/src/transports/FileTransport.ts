import * as fs from 'fs';
import * as path from 'path';
import { LogEntry, LogLevel } from '../types';

export interface FileTransportConfig {
  filename: string;
  level?: LogLevel;
  maxSize?: number;
  maxFiles?: number;
  format?: 'json' | 'text';
  createSymlink?: boolean;
}

export class FileTransport {
  private logFilePath: string;
  private errorLogPath: string;
  private config: Required<FileTransportConfig>;
  private stream: fs.WriteStream | null = null;
  private errorStream: fs.WriteStream | null = null;

  constructor(config: FileTransportConfig) {
    this.config = {
      filename: config.filename,
      level: config.level || LogLevel.INFO,
      maxSize: config.maxSize || 10 * 1024 * 1024, // 10MB
      maxFiles: config.maxFiles || 5,
      format: config.format || 'json',
      createSymlink: config.createSymlink ?? true
    };

    this.logFilePath = path.join(process.cwd(), 'logs', this.config.filename);
    this.errorLogPath = path.join(process.cwd(), 'logs', `error-${this.config.filename}`);
    
    this.initialize();
  }

  private initialize(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.openStreams();
    this.setupRotation();
  }

  private openStreams(): void {
    if (this.stream) {
      this.stream.end();
    }
    
    this.stream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
    this.errorStream = fs.createWriteStream(this.errorLogPath, { flags: 'a' });
    
    this.stream.on('error', (error) => {
      console.error('File transport error:', error);
    });
    
    this.errorStream.on('error', (error) => {
      console.error('Error file transport error:', error);
    });
  }

  private setupRotation(): void {
    // Verifica o tamanho do arquivo a cada hora
    setInterval(() => {
      this.checkAndRotate(this.logFilePath);
      this.checkAndRotate(this.errorLogPath);
    }, 3600000);
  }

  private checkAndRotate(filePath: string): void {
    if (!fs.existsSync(filePath)) {
      return;
    }

    const stats = fs.statSync(filePath);
    
    if (stats.size >= this.config.maxSize) {
      this.rotateFile(filePath);
    }
  }

  private rotateFile(filePath: string): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const parsedPath = path.parse(filePath);
    const rotatedPath = path.join(
      parsedPath.dir,
      `${parsedPath.name}-${timestamp}${parsedPath.ext}`
    );

    try {
      // Fecha o stream atual
      if (filePath === this.logFilePath && this.stream) {
        this.stream.end();
      } else if (filePath === this.errorLogPath && this.errorStream) {
        this.errorStream.end();
      }
      
      // Renomeia o arquivo
      fs.renameSync(filePath, rotatedPath);
      
      // Remove arquivos antigos
      this.cleanOldFiles(parsedPath.dir, parsedPath.name);
      
      // Reabre os streams
      if (filePath === this.logFilePath) {
        this.stream = fs.createWriteStream(filePath, { flags: 'a' });
      } else if (filePath === this.errorLogPath) {
        this.errorStream = fs.createWriteStream(filePath, { flags: 'a' });
      }
      
      console.log(`Rotated: ${rotatedPath}`);
    } catch (error) {
      console.error(`Failed to rotate ${filePath}:`, error);
      // Tenta reabrir o stream em caso de erro
      if (filePath === this.logFilePath) {
        this.stream = fs.createWriteStream(filePath, { flags: 'a' });
      } else if (filePath === this.errorLogPath) {
        this.errorStream = fs.createWriteStream(filePath, { flags: 'a' });
      }
    }
  }

  private cleanOldFiles(directory: string, baseName: string): void {
    const files = fs.readdirSync(directory);
    const logFiles = files
      .filter(file => file.startsWith(baseName) && file !== `${baseName}.log`)
      .map(file => ({
        name: file,
        path: path.join(directory, file),
        mtime: fs.statSync(path.join(directory, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    // Mantém apenas os N arquivos mais recentes
    if (logFiles.length > this.config.maxFiles) {
      const filesToRemove = logFiles.slice(this.config.maxFiles);
      for (const file of filesToRemove) {
        fs.unlinkSync(file.path);
        console.log(`Removed old log file: ${file.name}`);
      }
    }
  }

  async write(entry: LogEntry): Promise<void> {
    // Verifica o nível do log
    const levelOrder = {
      [LogLevel.ERROR]: 0,
      [LogLevel.WARN]: 1,
      [LogLevel.INFO]: 2,
      [LogLevel.DEBUG]: 3
    };
    
    const entryLevel = levelOrder[entry.level];
    const configLevel = levelOrder[this.config.level];
    
    if (entryLevel > configLevel) {
      return;
    }

    const formattedEntry = this.formatEntry(entry);
    
    return new Promise((resolve, reject) => {
      const targetStream = entry.level === LogLevel.ERROR ? this.errorStream : this.stream;
      
      if (!targetStream) {
        reject(new Error('Stream not initialized'));
        return;
      }
      
      targetStream.write(formattedEntry + '\n', (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private formatEntry(entry: LogEntry): string {
    if (this.config.format === 'json') {
      return JSON.stringify(entry);
    } else {
      // Formato texto
      return `[${entry.timestamp}] [${entry.level}] [${entry.source}] ${entry.message}${
        entry.stackTrace ? `\nStack: ${entry.stackTrace}` : ''
      }`;
    }
  }

  async writeBatch(entries: LogEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.write(entry);
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.stream) {
        this.stream.end(() => {
          if (this.errorStream) {
            this.errorStream.end(() => {
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  getLogFiles(): { regular: string; error: string } {
    return {
      regular: this.logFilePath,
      error: this.errorLogPath
    };
  }

  async getSize(): Promise<{ regular: number; error: number }> {
    const getFileSize = (filePath: string): number => {
      try {
        if (fs.existsSync(filePath)) {
          return fs.statSync(filePath).size;
        }
      } catch (error) {
        console.error(`Failed to get size for ${filePath}:`, error);
      }
      return 0;
    };
    
    return {
      regular: getFileSize(this.logFilePath),
      error: getFileSize(this.errorLogPath)
    };
  }

  async tail( lines: number = 100, errorOnly: boolean = false): Promise<string[]> {
    const filePath = errorOnly ? this.errorLogPath : this.logFilePath;
    
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        const allLines = data.split('\n').filter(line => line.trim());
        const lastLines = allLines.slice(-lines);
        resolve(lastLines);
      });
    });
  }
}

// Transporte com buffer para melhor performance
export class BufferedFileTransport extends FileTransport {
  private buffer: LogEntry[] = [];
  private bufferSize: number;
  private flushInterval: NodeJS.Timeout;

  constructor(config: FileTransportConfig, bufferSize: number = 100, flushIntervalMs: number = 5000) {
    super(config);
    this.bufferSize = bufferSize;
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }

  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.bufferSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }
    
    const entries = [...this.buffer];
    this.buffer = [];
    
    await this.writeBatch(entries);
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
    await super.close();
  }
}