#!/usr/bin/env node

/**
 * setup.js
 *
 * Script de instalação e configuração automática do projeto.
 *
 * Funionalidades:
 * - Verifica Node.js
 * - Instala dependências
 * - Atualiza dependências
 * - Cria .env automaticamente
 * - Executa migrations (se existir)
 * - Builda o projeto (se existir)
 * - Inicia o projeto
 *
 * Uso:
 * node setup.js
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = process.cwd();

function log(message) {
  console.log(`\n🔹 ${message}`);
}

function success(message) {
  console.log(`✅ ${message}`);
}

function warning(message) {
  console.log(`⚠️  ${message}`);
}

function error(message) {
  console.error(`❌ ${message}`);
}

function run(command) {
  try {
    log(`Executando: ${command}`);
    execSync(command, {
      stdio: "inherit",
      cwd: ROOT,
    });
    success(`Comando concluído: ${command}`);
  } catch (err) {
    error(`Falha ao executar: ${command}`);
    process.exit(1);
  }
}

function fileExists(file) {
  return fs.existsSync(path.join(ROOT, file));
}

/**
 * Verifica Node.js
 */
function checkNode() {
  log("Verificando Node.js...");

  const version = process.version;
  console.log(`Node atual: ${version}`);

  const major = parseInt(version.replace("v", "").split(".")[0]);

  if (major < 18) {
    error("Node.js 18+ é obrigatório.");
    process.exit(1);
  }

  success("Versão do Node válida.");
}

/**
 * Instala dependências
 */
function installDependencies() {
  if (fileExists("package-lock.json")) {
    run("npm ci");
  } else {
    run("npm install");
  }
}

/**
 * Atualiza dependências
 */
function updateDependencies() {
  log("Atualizando dependências...");

  try {
    run("npm update");
  } catch {
    warning("Falha ao atualizar dependências.");
  }
}

/**
 * Cria .env automaticamente
 */
function setupEnv() {
  log("Configurando .env...");

  if (fileExists(".env")) {
    warning(".env já existe.");
    return;
  }

  if (fileExists(".env.example")) {
    fs.copyFileSync(
      path.join(ROOT, ".env.example"),
      path.join(ROOT, ".env")
    );

    success(".env criado a partir do .env.example");
  } else {
    fs.writeFileSync(
      path.join(ROOT, ".env"),
      `PORT=3000
NODE_ENV=development
`
    );

    success(".env padrão criado.");
  }
}

/**
 * Executa migrations
 */
function runMigrations() {
  log("Verificando migrations...");

  const packageJson = require(path.join(ROOT, "package.json"));

  const scripts = packageJson.scripts || {};

  if (scripts.migrate) {
    run("npm run migrate");
  } else if (scripts["db:migrate"]) {
    run("npm run db:migrate");
  } else {
    warning("Nenhuma migration encontrada.");
  }
}

/**
 * Build do projeto
 */
function buildProject() {
  log("Verificando build...");

  const packageJson = require(path.join(ROOT, "package.json"));

  const scripts = packageJson.scripts || {};

  if (scripts.build) {
    run("npm run build");
  } else {
    warning("Script build não encontrado.");
  }
}

/**
 * Inicia projeto
 */
function startProject() {
  log("Verificando script de inicialização...");

  const packageJson = require(path.join(ROOT, "package.json"));

  const scripts = packageJson.scripts || {};

  if (scripts.dev) {
    run("npm run dev");
  } else if (scripts.start) {
    run("npm start");
  } else {
    warning("Nenhum script de inicialização encontrado.");
  }
}

/**
 * MAIN
 */
function main() {
  console.clear();

  console.log(`
========================================
🚀 SETUP AUTOMÁTICO DO PROJETO
========================================
`);

  checkNode();
  installDependencies();
  updateDependencies();
  setupEnv();
  runMigrations();
  buildProject();
  startProject();

  console.log(`
========================================
🎉 Projeto configurado com sucesso!
========================================
`);
}

main();