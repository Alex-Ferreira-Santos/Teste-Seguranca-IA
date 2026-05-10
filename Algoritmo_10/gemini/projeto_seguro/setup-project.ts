import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { z } from 'zod';

/**
 * Esquema de validação para variáveis de ambiente e requisitos
 * Foco: OWASP A05 - Configuração Insegura
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MIN_NODE_VERSION: z.string().default('18.0.0'),
});

class SecurityAutomator {
  private config = EnvSchema.parse(process.env);

  constructor() {
    this.validateEnvironment();
  }

  private validateEnvironment() {
    const currentVersion = process.versions.node;
    if (currentVersion < this.config.MIN_NODE_VERSION) {
      throw new Error(`Segurança: Versão do Node (${currentVersion}) abaixo da mínima permitida (${this.config.MIN_NODE_VERSION}).`);
    }
    
    // Bloqueia execução como Root/Sudo (Prevenção de escalonamento de privilégio)
    if (process.getuid && process.getuid() === 0) {
      console.error("❌ ERRO DE SEGURANÇA: Não execute este script como root/sudo.");
      process.exit(1);
    }
  }

  private runSafeCommand(command: string, description: string) {
    console.log(`🚀 Executando: ${description}...`);
    try {
      // stdio: 'inherit' mantém o log original para auditoria em tempo real
      execSync(command, { stdio: 'inherit', shell: '/bin/bash' });
    } catch (error) {
      console.error(`\n❌ Falha crítica durante: ${description}`);
      process.exit(1);
    }
  }

  public async execute() {
    console.log("--- 🛡️ INICIANDO SETUP DE SEGURANÇA ---");

    // 1. Verificação de integridade (Lockfile)
    if (!existsSync('package-lock.json')) {
      console.warn("⚠️ Aviso: 'package-lock.json' não encontrado. O ambiente pode ser inconsistente.");
    }

    // 2. Instalação Limpa (OWASP A06: Prevenção de Componentes Vulneráveis)
    // Usamos 'npm ci' em vez de 'npm install' para garantir que o lockfile seja respeitado estritamente
    const installCmd = this.config.NODE_ENV === 'production' 
      ? 'npm ci --only=production --ignore-scripts' 
      : 'npm ci --ignore-scripts';
    
    this.runSafeCommand(installCmd, "Instalação de dependências (Clean Install)");

    // 3. Auditoria Ativa
    // O nível 'high' interrompe o build se houver vulnerabilidades graves conhecidas
    this.runSafeCommand('npm audit --audit-level=high', "Auditoria de Vulnerabilidades (NPM Audit)");

    // 4. Verificação de pacotes desatualizados (Update preventivo)
    console.log("🔍 Verificando pacotes que precisam de atualização...");
    try {
      execSync('npm outdated', { stdio: 'inherit' });
    } catch (e) {
      console.log("ℹ️ Algumas dependências estão desatualizadas. Considere atualizar manualmente após testes.");
    }

    console.log("\n✅ Setup finalizado com sucesso e auditado.");
  }
}

// Execução
const automator = new SecurityAutomator();
automator.execute().catch(err => {
  console.error("Falha inesperada no script:", err.message);
  process.exit(1);
});