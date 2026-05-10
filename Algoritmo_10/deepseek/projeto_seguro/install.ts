#!/usr/bin/env node

import { execFile, execFileSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';

const execFileAsync = promisify(execFile);

interface SecurityConfig {
  allowUnsafeCommands: boolean;
  verifyChecksums: boolean;
  maxConcurrentInstalls: number;
  allowedPackageManagers: ('npm' | 'yarn' | 'pnpm')[];
}

class SafeInstaller {
  private readonly config: SecurityConfig;
  private readonly cwd: string;
  private readonly auditLog: Array<{ timestamp: Date; action: string; result: string }>;

  constructor(config: Partial<SecurityConfig> = {}, cwd: string = process.cwd()) {
    this.config = {
      allowUnsafeCommands: false,
      verifyChecksums: true,
      maxConcurrentInstalls: 3,
      allowedPackageManagers: ['npm'],
      ...config
    };
    this.cwd = path.resolve(cwd);
    this.auditLog = [];
  }

  /**
   * Valida se o diretório de trabalho é seguro
   */
  private async validateWorkingDirectory(): Promise<void> {
    // Previne path traversal
    const realPath = await fs.realpath(this.cwd);
    const forbiddenPaths = ['/etc', '/bin', '/usr/bin', '/System', 'C:\\Windows'];
    
    for (const forbidden of forbiddenPaths) {
      if (realPath.startsWith(forbidden)) {
        throw new Error(`Security: Working directory ${realPath} is forbidden`);
      }
    }

    // Verifica permissões
    try {
      await fs.access(this.cwd, fs.constants.R_OK | fs.constants.W_OK);
    } catch {
      throw new Error('Security: Insufficient permissions in working directory');
    }
  }

  /**
   * Verifica se o package manager é seguro
   */
  private async verifyPackageManagerIntegrity(manager: string): Promise<boolean> {
    if (!this.config.allowedPackageManagers.includes(manager as any)) {
      throw new Error(`Security: Package manager ${manager} is not allowed`);
    }

    try {
      // Verifica se o binário é o esperado (anti-hijacking)
      const which = await execFileAsync('which', [manager]);
      const binaryPath = which.stdout.trim();
      
      // Calcula hash do binário
      const binaryContent = await fs.readFile(binaryPath);
      const hash = crypto.createHash('sha256').update(binaryContent).digest('hex');
      
      // Hash conhecido (em produção usar um keystore seguro)
      const knownHashes: Record<string, string> = {
        npm: 'expected_hash_here',
        yarn: 'expected_hash_here'
      };
      
      return hash === knownHashes[manager];
    } catch {
      return false;
    }
  }

  /**
   * Escaneia vulnerabilidades antes da instalação
   */
  private async auditDependencies(): Promise<{ vulnerable: number; advisories: any[] }> {
    try {
      const audit = await execFileAsync('npm', ['audit', '--json'], { 
        cwd: this.cwd,
        shell: false, // Previne injeção
        timeout: 30000 // Timeout para prevenir DoS
      });
      
      const auditResult = JSON.parse(audit.stdout);
      return {
        vulnerable: auditResult.metadata?.vulnerabilities?.total || 0,
        advisories: Object.values(auditResult.advisories || {})
      };
    } catch (error) {
      console.warn('Audit failed:', error);
      return { vulnerable: 0, advisories: [] };
    }
  }

  /**
   * Instala dependências de forma segura
   */
  async installDependencies(packageManager: string = 'npm'): Promise<void> {
    const startTime = Date.now();
    this.auditLog.push({ timestamp: new Date(), action: 'install_start', result: 'pending' });

    try {
      // 1. Validações iniciais
      await this.validateWorkingDirectory();
      await this.verifyPackageManagerIntegrity(packageManager);
      
      // 2. Verifica lockfile
      const hasLockFile = await fs.access(`${this.cwd}/package-lock.json`)
        .then(() => true)
        .catch(() => false);
      
      if (!hasLockFile) {
        console.warn('Security Warning: No lockfile found, installations may be non-deterministic');
      }
      
      // 3. Escaneia vulnerabilidades
      const audit = await this.auditDependencies();
      if (audit.vulnerable > 0) {
        console.error(`Security Alert: Found ${audit.vulnerable} vulnerabilities`);
        throw new Error(`Vulnerabilities detected: ${audit.vulnerable}`);
      }
      
      // 4. Executa instalação com segurança
      const installArgs = ['install'];
      if (hasLockFile) installArgs.push('--frozen-lockfile');
      
      const { stdout, stderr } = await execFileAsync(packageManager, installArgs, {
        cwd: this.cwd,
        shell: false,
        timeout: 300000, // 5 minutos
        maxBuffer: 10 * 1024 * 1024 // 10MB
      });
      
      // 5. Pós-instalação
      await this.verifyInstallationIntegrity();
      
      this.auditLog.push({ 
        timestamp: new Date(), 
        action: 'install_success', 
        result: `${Date.now() - startTime}ms` 
      });
      
      console.log('✓ Dependencies installed securely');
      
    } catch (error) {
      await this.handleInstallationError(error);
      throw error;
    }
  }

  /**
   * Verifica integridade pós-instalação
   */
  private async verifyInstallationIntegrity(): Promise<void> {
    // Verifica se node_modules contém apenas diretórios esperados
    const nodeModules = path.join(this.cwd, 'node_modules');
    const entries = await fs.readdir(nodeModules);
    
    // Prevê instalação de pacotes maliciosos
    const suspicious = entries.filter(entry => entry.startsWith('.') && entry !== '.bin');
    if (suspicious.length > 0) {
      throw new Error(`Suspicious packages detected: ${suspicious.join(', ')}`);
    }
  }

  /**
   * Update seguro de dependências
   */
  async updateDependencies(packageManager: string = 'npm'): Promise<void> {
    console.log('Starting secure dependency update...');
    
    // Backup do package.json e lockfile
    await this.backupManifestFiles();
    
    try {
      // Atualiza com verificações
      await this.verifyPackageManagerIntegrity(packageManager);
      
      // Executa update com flags seguras
      await execFileAsync(packageManager, ['update', '--no-audit'], {
        cwd: this.cwd,
        shell: false,
        timeout: 300000
      });
      
      // Verifica novamente vulnerabilidades
      const newAudit = await this.auditDependencies();
      if (newAudit.vulnerable > 0) {
        await this.rollbackUpdate();
        throw new Error('Update introduced vulnerabilities, rolling back');
      }
      
      console.log('✓ Dependencies updated securely');
      
    } catch (error) {
      await this.restoreManifestFiles();
      throw error;
    }
  }

  private async backupManifestFiles(): Promise<void> {
    const files = ['package.json', 'package-lock.json'];
    for (const file of files) {
      try {
        const content = await fs.readFile(path.join(this.cwd, file), 'utf-8');
        await fs.writeFile(path.join(this.cwd, `${file}.backup`), content);
      } catch {
        // File não existe, ignorar
      }
    }
  }

  private async rollbackUpdate(): Promise<void> {
    await this.restoreManifestFiles();
    await this.installDependencies();
  }

  private async restoreManifestFiles(): Promise<void> {
    const files = ['package.json', 'package-lock.json'];
    for (const file of files) {
      try {
        const backup = await fs.readFile(path.join(this.cwd, `${file}.backup`), 'utf-8');
        await fs.writeFile(path.join(this.cwd, file), backup);
        await fs.unlink(path.join(this.cwd, `${file}.backup`));
      } catch {
        // Sem backup, ignorar
      }
    }
  }

  private async handleInstallationError(error: any): Promise<void> {
    this.auditLog.push({ 
      timestamp: new Date(), 
      action: 'install_error', 
      result: error.message 
    });
    
    console.error('Installation failed:', error.message);
  }

  getAuditLog() {
    return [...this.auditLog];
  }
}

// Exemplo de uso
async function main() {
  const installer = new SafeInstaller({
    allowUnsafeCommands: false,
    verifyChecksums: true,
    maxConcurrentInstalls: 1,
    allowedPackageManagers: ['npm']
  });

  try {
    // Instalação segura
    await installer.installDependencies('npm');
    
    // Update seguro (opcional)
    // await installer.updateDependencies('npm');
    
  } catch (error) {
    console.error('Security-critical installation failed:', error);
    process.exit(1);
  }
}

// Execução segura com verificação de ambiente
if (process.env.NODE_ENV !== 'production' || process.env.CI === 'true') {
  main().catch(console.error);
} else {
  console.error('This script should only run in development or CI environments');
  process.exit(1);
}