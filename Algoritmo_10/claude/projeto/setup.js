#!/usr/bin/env node
// =============================================================================
// setup.js — Instalação de dependências Node.js (multiplataforma)
// Uso: node setup.js [--check-updates]
// =============================================================================

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// ── Argumentos ────────────────────────────────────────────────────────────
const CHECK_UPDATES = process.argv.includes("--check-updates");

// ── Cores ANSI ────────────────────────────────────────────────────────────
const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
};

const log = {
  info:    (msg) => console.log(`${c.cyan}[INFO]${c.reset}  ${msg}`),
  success: (msg) => console.log(`${c.green}[OK]${c.reset}    ${msg}`),
  warn:    (msg) => console.log(`${c.yellow}[WARN]${c.reset}  ${msg}`),
  error:   (msg) => console.error(`${c.red}[ERRO]${c.reset}  ${msg}`),
};

// ── Helpers ────────────────────────────────────────────────────────────────
function commandExists(cmd) {
  const result = spawnSync(cmd, ["--version"], { stdio: "ignore", shell: true });
  return result.status === 0;
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit", shell: true });
}

function fileExists(filename) {
  return fs.existsSync(path.join(process.cwd(), filename));
}

// ── Banner ─────────────────────────────────────────────────────────────────
console.log();
console.log(`${c.cyan}${c.bold}╔══════════════════════════════════════╗`);
console.log(`║        Setup — Node.js Project       ║`);
console.log(`╚══════════════════════════════════════╝${c.reset}`);
console.log();

// ── 1. Verificar Node.js ───────────────────────────────────────────────────
log.info("Verificando Node.js...");

const nodeVersion = process.version;
const nodeMajor = parseInt(nodeVersion.replace(/^v/, "").split(".")[0], 10);

log.success(`Node.js ${nodeVersion} detectado.`);

if (nodeMajor < 18) {
  log.warn(`Node.js ${nodeVersion} é menor que v18. Considere atualizar: https://nodejs.org`);
}

// ── 2. Verificar package.json ─────────────────────────────────────────────
log.info("Verificando package.json...");

if (!fileExists("package.json")) {
  log.error("package.json não encontrado. Execute o script na raiz do projeto.");
  process.exit(1);
}

log.success("package.json encontrado.");

// ── 3. Detectar gerenciador de pacotes ────────────────────────────────────
log.info("Detectando gerenciador de pacotes...");

let pm;

if (fileExists("pnpm-lock.yaml") && commandExists("pnpm")) {
  pm = "pnpm";
} else if (fileExists("yarn.lock") && commandExists("yarn")) {
  pm = "yarn";
} else if (commandExists("npm")) {
  pm = "npm";
} else {
  log.error("Nenhum gerenciador de pacotes encontrado (npm, yarn ou pnpm).");
  process.exit(1);
}

log.info(`Gerenciador de pacotes detectado: ${c.bold}${pm}${c.reset}`);

// ── 4. Instalar dependências ───────────────────────────────────────────────
log.info(`Instalando dependências com ${pm}...`);

try {
  run(`${pm} install`);
  log.success("Dependências instaladas com sucesso.");
} catch {
  log.error("Falha ao instalar dependências.");
  process.exit(1);
}

// ── 5. Verificar atualizações (opcional) ──────────────────────────────────
if (CHECK_UPDATES) {
  log.info("Verificando pacotes desatualizados...");
  try {
    run(`${pm} outdated`);
  } catch {
    // outdated retorna exit code != 0 quando há pacotes desatualizados — isso é normal
  }
}

// ── Conclusão ──────────────────────────────────────────────────────────────
console.log();
console.log(`${c.green}${c.bold}✔ Setup concluído!${c.reset}`);
console.log();
console.log("  Para verificar atualizações de pacotes, execute:");
console.log(`  ${c.cyan}node setup.js --check-updates${c.reset}`);
console.log();