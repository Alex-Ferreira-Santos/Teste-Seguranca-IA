#!/usr/bin/env node
/**
 * Script seguro para instalar e atualizar dependências
 * Evita problemas comuns (OWASP), gera logs e auditoria
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function runCommand(cmd) {
  try {
    console.log(`Executando: ${cmd}`);
    const output = execSync(cmd, { stdio: "pipe" }).toString();
    fs.appendFileSync(path.join("logs", "dependency-report.txt"), `\n### ${cmd}\n${output}\n`);
    return output;
  } catch (error) {
    console.error(`❌ Erro ao executar ${cmd}:`, error.message);
    process.exit(1);
  }
}

function main() {
  // Criar pasta de logs se não existir
  if (!fs.existsSync("logs")) fs.mkdirSync("logs");

  console.log("🔒 Iniciando gerenciamento seguro de dependências...\n");

  // Instalação limpa baseada no lockfile
  if (!fs.existsSync("node_modules")) {
    runCommand("npm ci");
  } else {
    console.log("📦 Dependências já instaladas, prosseguindo...");
  }

  // Verificar pacotes desatualizados
  runCommand("npm outdated");

  // Atualizar pacotes respeitando lockfile
  runCommand("npm update");

  // Auditoria de vulnerabilidades
  runCommand("npm audit --production");

  console.log("\n✅ Processo concluído com segurança. Relatório disponível em logs/dependency-report.txt");
}

main();
