#!/usr/bin/env npx ts-node
/**
 * setup.ts — Script de instalação e configuração segura de dependências
 *
 * Segurança (OWASP):
 *  - A06: Componentes vulneráveis → npm audit obrigatório, bloqueio em falhas críticas
 *  - A05: Misconfiguration       → valida Node/npm mínimos antes de prosseguir
 *  - A08: Integridade            → verifica lockfile e usa `npm ci` em vez de `npm install`
 *  - Princípio do menor privilégio → aborta se executado como root
 */

import { execSync, ExecSyncOptions } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

// ─── Configuração ────────────────────────────────────────────────────────────

const CONFIG = {
  minNodeMajor: 18,
  minNpmMajor: 9,
  /** "moderate" | "high" | "critical" — nível mínimo que bloqueia o setup */
  auditFailLevel: "high" as "moderate" | "high" | "critical",
  /** Arquivo de lockfile esperado */
  lockfile: "package-lock.json",
} as const;

// ─── Utilitários de log ───────────────────────────────────────────────────────

const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED   = "\x1b[31m";
const CYAN  = "\x1b[36m";

function log(msg: string)  { console.log(`${CYAN}[setup]${RESET} ${msg}`); }
function ok(msg: string)   { console.log(`${GREEN}[✔]${RESET} ${msg}`); }
function warn(msg: string) { console.warn(`${YELLOW}[!]${RESET} ${msg}`); }
function fail(msg: string): never {
  console.error(`${RED}${BOLD}[✖] ERRO:${RESET} ${msg}`);
  process.exit(1);
}

// ─── Execução segura de comandos ─────────────────────────────────────────────

/**
 * Executa um comando de forma síncrona.
 * Não usa `shell: true` com interpolação de variáveis externas → evita
 * injeção de comandos (OWASP A03 / CWE-78).
 */
function run(
  command: string,
  opts: ExecSyncOptions = {}
): string {
  return execSync(command, {
    stdio: "pipe",
    encoding: "utf8",
    ...opts,
  }).toString().trim();
}

// ─── Etapas de verificação ───────────────────────────────────────────────────

/** 1. Bloqueia execução como root (princípio do menor privilégio) */
function checkNotRoot(): void {
  // process.getuid() não existe no Windows; pulamos a verificação lá.
  if (process.platform === "win32") return;

  const uid = process.getuid?.();
  if (uid === 0) {
    fail(
      "Este script não deve ser executado como root.\n" +
      "  Execute como usuário normal para evitar permissões excessivas."
    );
  }
  ok("Não está rodando como root");
}

/** 2. Valida versão mínima do Node */
function checkNodeVersion(): void {
  const raw = process.version; // ex: "v20.11.0"
  const major = parseInt(raw.slice(1).split(".")[0], 10);
  if (major < CONFIG.minNodeMajor) {
    fail(
      `Node.js ${CONFIG.minNodeMajor}+ é necessário. Versão atual: ${raw}\n` +
      "  Use https://github.com/nvm-sh/nvm para gerenciar versões."
    );
  }
  ok(`Node.js ${raw}`);
}

/** 3. Valida versão mínima do npm */
function checkNpmVersion(): void {
  const raw = run("npm --version");
  const major = parseInt(raw.split(".")[0], 10);
  if (major < CONFIG.minNpmMajor) {
    fail(
      `npm ${CONFIG.minNpmMajor}+ é necessário. Versão atual: ${raw}\n` +
      "  Execute: npm install -g npm@latest"
    );
  }
  ok(`npm v${raw}`);
}

/** 4. Garante que package.json existe */
function checkPackageJson(): void {
  const pkgPath = path.resolve(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    fail("package.json não encontrado. Execute o script na raiz do projeto.");
  }
  ok("package.json encontrado");
}

/** 5. Verifica integridade do lockfile (OWASP A08) */
function checkLockfile(): void {
  const lockPath = path.resolve(process.cwd(), CONFIG.lockfile);
  if (!fs.existsSync(lockPath)) {
    warn(
      `${CONFIG.lockfile} não encontrado.\n` +
      "  Será usado 'npm install' (gera novo lockfile).\n" +
      "  Recomendado: versionar o lockfile para garantir builds reproduzíveis."
    );
    return;
  }
  ok(`${CONFIG.lockfile} encontrado — usará 'npm ci' para instalação determinística`);
}

// ─── Instalação ───────────────────────────────────────────────────────────────

/**
 * 6. Instala dependências
 *  - `npm ci`      → usa o lockfile exato (integridade garantida, OWASP A08)
 *  - `npm install` → fallback quando não há lockfile (gera um novo)
 */
function installDependencies(): void {
  const lockPath = path.resolve(process.cwd(), CONFIG.lockfile);
  const hasLock  = fs.existsSync(lockPath);
  const cmd      = hasLock ? "npm ci" : "npm install";

  log(`Instalando dependências com '${cmd}'…`);
  try {
    run(cmd, { stdio: "inherit" });
    ok("Dependências instaladas com sucesso");
  } catch {
    fail(`Falha ao executar '${cmd}'. Verifique os erros acima.`);
  }
}

// ─── Auditoria de segurança ───────────────────────────────────────────────────

/**
 * 7. Executa npm audit (OWASP A06 — Vulnerable and Outdated Components)
 *
 * Níveis de severidade: low → moderate → high → critical
 * O script bloqueia se houver vulnerabilidades >= CONFIG.auditFailLevel.
 */
function runAudit(): void {
  log(`Verificando vulnerabilidades (nível mínimo: ${CONFIG.auditFailLevel})…`);

  try {
    run(`npm audit --audit-level=${CONFIG.auditFailLevel}`, { stdio: "inherit" });
    ok("Nenhuma vulnerabilidade crítica encontrada");
  } catch {
    // npm audit retorna exit code != 0 quando encontra issues no nível configurado
    warn(
      `Vulnerabilidades de nível '${CONFIG.auditFailLevel}' ou superior foram encontradas.\n` +
      "  Execute 'npm audit fix' para corrigir automaticamente o que for possível.\n" +
      "  Revise manualmente o restante antes de prosseguir."
    );
    process.exit(1);
  }
}

// ─── Confirmação interativa ───────────────────────────────────────────────────

async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(`${YELLOW}${question} [s/N]${RESET} `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "s");
    });
  });
}

// ─── Ponto de entrada ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n${BOLD}${CYAN}━━━ Setup de Dependências ━━━${RESET}\n`);

  // Verificações de segurança e ambiente
  checkNotRoot();
  checkNodeVersion();
  checkNpmVersion();
  checkPackageJson();
  checkLockfile();

  // Confirmação antes de instalar (evita execução acidental)
  const proceed = await confirm(
    "\nPronto para instalar as dependências. Deseja continuar?"
  );
  if (!proceed) {
    log("Setup cancelado pelo usuário.");
    process.exit(0);
  }

  console.log("");

  // Instalação
  installDependencies();

  console.log("");

  // Auditoria de segurança
  runAudit();

  console.log(`\n${GREEN}${BOLD}Setup concluído com sucesso!${RESET}\n`);
}

main().catch((err) => {
  fail(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`);
});