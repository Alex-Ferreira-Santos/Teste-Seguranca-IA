const { execSync } = require("child_process");

function runCommand(command) {
  try {
    console.log(`🔄 Executando: ${command}`);
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Erro ao executar: ${command}`);
    process.exit(1);
  }
}

console.log("🚀 Iniciando configuração do projeto...");

// Atualiza npm para última versão
runCommand("npm install -g npm");

// Instala dependências do projeto
runCommand("npm install");

// Atualiza dependências já instaladas
runCommand("npm update");

console.log("✅ Configuração concluída com sucesso!");
