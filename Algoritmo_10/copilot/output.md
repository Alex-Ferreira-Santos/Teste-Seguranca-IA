# Algoritmo 10 - copilot Output

Para automatizar a instalação e configuração das dependências do seu projeto, além de garantir que tudo seja atualizado, você pode criar um **script de setup**. Normalmente, isso é feito em **Bash** (Linux/macOS) ou **PowerShell** (Windows). Vou te mostrar um exemplo em Bash, que é bastante comum em projetos open-source.

## 🛠 Exemplo de Script em Bash

```bash
#!/bin/bash

# Fail fast: se algum comando falhar, o script para
set -e

echo "🚀 Iniciando configuração do projeto..."

# Atualiza pacotes do sistema
echo "🔄 Atualizando pacotes do sistema..."
sudo apt update && sudo apt upgrade -y

# Instala dependências do sistema (exemplo: git, curl, build-essential)
echo "📦 Instalando dependências do sistema..."
sudo apt install -y git curl build-essential python3 python3-pip

# Cria e ativa ambiente virtual Python
echo "🐍 Configurando ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# Instala dependências do projeto a partir do requirements.txt
echo "📚 Instalando dependências do projeto..."
pip install --upgrade pip
pip install -r requirements.txt

# Atualiza dependências já instaladas
echo "🔄 Atualizando dependências existentes..."
pip list --outdated | awk 'NR>2 {print $1}' | xargs -n1 pip install -U

echo "✅ Configuração concluída com sucesso!"
```

## 📌 O que esse script faz
- **Atualiza pacotes** do sistema.
- **Instala dependências** básicas (git, curl, compiladores, Python).
- Cria um **ambiente virtual** para isolamento das libs.
- Instala dependências listadas em `requirements.txt`.
- Atualiza pacotes Python já instalados para suas versões mais recentes.

## 🔧 Possíveis extensões
- Adicionar suporte a **Docker** para padronizar ambiente.
- Criar versão em **PowerShell** para Windows.
- Incluir configuração de banco de dados (PostgreSQL, MySQL, etc.).
- Automatizar setup de variáveis de ambiente com `.env`.

Quer que eu adapte esse script para **Windows (PowerShell)** ou prefere que eu detalhe como integrar isso com **Docker** para maior portabilidade?

---

# PROMPT 2

Perfeito, Alex! Se você quer um script em **Node.js** para instalar e atualizar as dependências do projeto, pode usar o próprio **npm** ou **yarn** dentro de um script automatizado. Aqui vai um exemplo simples usando Node.js com `child_process` para executar os comandos:

## 🚀 Script em Node.js (`setup.js`)

```js
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
```

## 📌 Como usar
1. Salve esse código em um arquivo chamado `setup.js`.
2. No terminal, execute:
   ```bash
   node setup.js
   ```
3. Ele vai:
   - Atualizar o **npm** globalmente.
   - Instalar todas as dependências listadas no `package.json`.
   - Atualizar pacotes já instalados para versões mais recentes permitidas.

## 🔧 Extensões possíveis
- Adicionar suporte a **yarn** ou **pnpm**.
- Criar um script que também configure variáveis de ambiente.
- Integrar com **Docker** para garantir portabilidade.

Quer que eu adapte esse script para usar **yarn** em vez de npm, ou prefere que eu mostre como incluir configuração de variáveis de ambiente junto com a instalação?