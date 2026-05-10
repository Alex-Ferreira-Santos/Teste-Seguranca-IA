# Algoritmo 10 - deepseek Output

Aqui está um script shell completo que instala e configura dependências, além de atualizar o que for necessário:

## Script Principal (setup.sh)

```bash
#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar sistema operacional
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        if command -v apt-get &> /dev/null; then
            PKG_MANAGER="apt"
        elif command -v yum &> /dev/null; then
            PKG_MANAGER="yum"
        elif command -v dnf &> /dev/null; then
            PKG_MANAGER="dnf"
        else
            error "Sistema Linux não suportado"
            exit 1
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        if command -v brew &> /dev/null; then
            PKG_MANAGER="brew"
        else
            warn "Homebrew não encontrado. Instalando..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        fi
    else
        error "Sistema operacional não suportado: $OSTYPE"
        exit 1
    fi
    success "Sistema detectado: $OS"
}

# Atualizar sistema
update_system() {
    log "Atualizando sistema..."
    case $PKG_MANAGER in
        apt)
            sudo apt-get update
            sudo apt-get upgrade -y
            ;;
        yum)
            sudo yum update -y
            ;;
        dnf)
            sudo dnf update -y
            ;;
        brew)
            brew update
            brew upgrade
            ;;
    esac
    success "Sistema atualizado"
}

# Instalar dependências básicas
install_basic_deps() {
    log "Instalando dependências básicas..."
    
    case $PKG_MANAGER in
        apt)
            sudo apt-get install -y \
                curl \
                wget \
                git \
                build-essential \
                python3 \
                python3-pip \
                nodejs \
                npm
            ;;
        yum|dnf)
            sudo $PKG_MANAGER install -y \
                curl \
                wget \
                git \
                gcc \
                gcc-c++ \
                make \
                python3 \
                python3-pip \
                nodejs \
                npm
            ;;
        brew)
            brew install \
                curl \
                wget \
                git \
                python3 \
                node
            ;;
    esac
    success "Dependências básicas instaladas"
}

# Instalar dependências do projeto específicas
install_project_deps() {
    log "Instalando dependências do projeto..."
    
    # Verificar se existe package.json
    if [ -f "package.json" ]; then
        log "Instalando dependências Node.js..."
        npm install
        npm update
        success "Dependências Node.js instaladas"
    fi
    
    # Verificar se existe requirements.txt
    if [ -f "requirements.txt" ]; then
        log "Instalando dependências Python..."
        pip3 install --upgrade pip
        pip3 install -r requirements.txt
        success "Dependências Python instaladas"
    fi
    
    # Verificar se existe composer.json
    if [ -f "composer.json" ]; then
        log "Instalando dependências PHP..."
        if command -v composer &> /dev/null; then
            composer install
            composer update
        else
            warn "Composer não instalado. Instalando..."
            php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
            php composer-setup.php
            php -r "unlink('composer-setup.php');"
            sudo mv composer.phar /usr/local/bin/composer
            composer install
        fi
        success "Dependências PHP instaladas"
    fi
}

# Configurar ambiente
setup_environment() {
    log "Configurando ambiente..."
    
    # Criar arquivo .env se não existir
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        success "Arquivo .env criado a partir do .env.example"
    fi
    
    # Configurar permissões
    chmod +x *.sh 2>/dev/null || true
    
    # Criar diretórios necessários
    mkdir -p logs temp uploads
    
    success "Ambiente configurado"
}

# Configurar variáveis de ambiente
setup_env_vars() {
    log "Configurando variáveis de ambiente..."
    
    # Adicionar ao PATH se necessário
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
        export PATH="$HOME/.local/bin:$PATH"
        success "PATH atualizado"
    fi
    
    # Configurar alias
    if ! grep -q "alias ll=" ~/.bashrc 2>/dev/null; then
        echo 'alias ll="ls -la"' >> ~/.bashrc
        echo 'alias gs="git status"' >> ~/.bashrc
        echo 'alias ..="cd .."' >> ~/.bashrc
        success "Alias configurados"
    fi
}

# Verificar dependências
check_dependencies() {
    log "Verificando dependências instaladas..."
    
    local deps=("git" "curl" "wget" "python3" "node")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if command -v $dep &> /dev/null; then
            success "$dep: $(command -v $dep)"
        else
            warn "$dep: não encontrado"
            missing+=($dep)
        fi
    done
    
    if [ ${#missing[@]} -ne 0 ]; then
        warn "Faltando dependências: ${missing[*]}"
    fi
}

# Limpar cache e arquivos temporários
cleanup() {
    log "Limpando cache e arquivos temporários..."
    
    # Limpar cache do npm
    if command -v npm &> /dev/null; then
        npm cache clean --force 2>/dev/null || true
    fi
    
    # Limpar cache do pip
    if command -v pip3 &> /dev/null; then
        pip3 cache purge 2>/dev/null || true
    fi
    
    # Limpar diretórios temporários
    rm -rf temp/* 2>/dev/null || true
    
    success "Limpeza concluída"
}

# Função principal
main() {
    echo "========================================="
    echo "    CONFIGURADOR DE PROJETO"
    echo "========================================="
    
    # Detecta sistema
    detect_os
    
    # Atualiza sistema
    update_system
    
    # Instala dependências básicas
    install_basic_deps
    
    # Instala dependências do projeto
    install_project_deps
    
    # Configura ambiente
    setup_environment
    
    # Configura variáveis de ambiente
    setup_env_vars
    
    # Verifica dependências
    check_dependencies
    
    # Limpa cache
    cleanup
    
    echo "========================================="
    success "Configuração concluída com sucesso!"
    echo "========================================="
}

# Executar script
main "$@"
```

## Como usar:

1. **Salve o script** em um arquivo chamado `setup.sh`

2. **Dê permissão de execução:**
```bash
chmod +x setup.sh
```

3. **Execute o script:**
```bash
./setup.sh
```

## Script de Verificação e Manutenção (update.sh)

Para atualizações periódicas:

```bash
#!/bin/bash

# update.sh - Script para manter dependências atualizadas

echo "🔄 Iniciando atualização do projeto..."

# Atualizar dependências Node.js
if [ -f "package.json" ]; then
    echo "📦 Atualizando dependências Node.js..."
    npm outdated
    npm update
    npm audit fix
fi

# Atualizar dependências Python
if [ -f "requirements.txt" ]; then
    echo "🐍 Atualizando dependências Python..."
    pip3 install --upgrade pip
    pip3 list --outdated
    pip3 install --upgrade -r requirements.txt
fi

# Atualizar dependências PHP
if [ -f "composer.json" ]; then
    echo "🐘 Atualizando dependências PHP..."
    composer outdated
    composer update
fi

# Verificar versões
echo "📊 Versões atuais:"
echo "Node: $(node --version 2>/dev/null || echo 'não instalado')"
echo "NPM: $(npm --version 2>/dev/null || echo 'não instalado')"
echo "Python: $(python3 --version 2>/dev/null || echo 'não instalado')"
echo "PIP: $(pip3 --version 2>/dev/null || echo 'não instalado')"

echo "✅ Atualização concluída!"
```

## Exemplo de arquivos de dependência:

### package.json (Node.js)
```json
{
  "name": "meu-projeto",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "axios": "^1.4.0"
  },
  "devDependencies": {
    "jest": "^29.0.0"
  }
}
```

### requirements.txt (Python)
```txt
flask==2.3.0
requests==2.31.0
numpy==1.24.0
```

### .env.example
```env
PORT=3000
DATABASE_URL=postgresql://localhost/meu_db
API_KEY=sua_chave_aqui
DEBUG=true
```

Este script é compatível com Linux e macOS, instala dependências automáticas, configura o ambiente e fornece feedback visual com cores.

---

# PROMPT 2

Aqui está um código Node.js completo e pronto para executar, que instala e configura as dependências do projeto:

## Script Principal (setup.js)

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

// Cores para o console
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Funções de logging
const log = (msg, color = colors.cyan) => console.log(`${color}${msg}${colors.reset}`);
const success = (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`);
const error = (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`);
const warn = (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
const info = (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);

// Executar comando com tratamento de erro
function runCommand(command, options = {}) {
    try {
        return execSync(command, {
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
    } catch (err) {
        if (!options.ignoreError) {
            error(`Erro ao executar: ${command}`);
            throw err;
        }
        return null;
    }
}

// Executar comando e retornar output
function runCommandOutput(command) {
    try {
        return execSync(command, { encoding: 'utf-8' }).trim();
    } catch (err) {
        return null;
    }
}

// Verificar se comando existe
function commandExists(command) {
    try {
        execSync(`${command} --version`, { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Perguntar ao usuário
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

// Verificar versão do Node.js
function checkNodeVersion() {
    const version = process.version.slice(1);
    const major = parseInt(version.split('.')[0]);
    
    if (major < 14) {
        error(`Node.js versão ${version} é muito antiga. Necessário versão 14+`);
        process.exit(1);
    }
    
    success(`Node.js versão ${version} OK`);
}

// Instalar dependências do sistema
async function installSystemDeps() {
    const platform = os.platform();
    
    if (platform === 'linux') {
        info('Detectado Linux. Verificando dependências do sistema...');
        
        if (commandExists('apt-get')) {
            const gitInstalled = commandExists('git');
            if (!gitInstalled) {
                warn('Git não encontrado. Instalando...');
                runCommand('sudo apt-get update');
                runCommand('sudo apt-get install -y git');
            }
        }
    } else if (platform === 'darwin') {
        info('Detectado macOS. Verificando dependências...');
        
        if (!commandExists('brew')) {
            warn('Homebrew não encontrado. Instalando...');
            runCommand('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"');
        }
        
        if (!commandExists('git')) {
            runCommand('brew install git');
        }
    }
}

// Verificar e instalar pnpm/yarn/npm
async function setupPackageManager() {
    info('Configurando gerenciador de pacotes...');
    
    const usePnpm = commandExists('pnpm');
    const useYarn = commandExists('yarn');
    const useNpm = commandExists('npm');
    
    if (usePnpm) {
        success('pnpm encontrado');
        return 'pnpm';
    } else if (useYarn) {
        success('yarn encontrado');
        return 'yarn';
    } else if (useNpm) {
        success('npm encontrado');
        return 'npm';
    } else {
        warn('Nenhum gerenciador de pacotes encontrado. Instalando npm...');
        return 'npm';
    }
}

// Instalar dependências do projeto
async function installProjectDependencies(packageManager) {
    info(`Instalando dependências com ${packageManager}...`);
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        error('package.json não encontrado!');
        return false;
    }
    
    try {
        switch(packageManager) {
            case 'pnpm':
                if (!commandExists('pnpm')) {
                    runCommand('npm install -g pnpm');
                }
                runCommand('pnpm install');
                break;
            case 'yarn':
                if (!commandExists('yarn')) {
                    runCommand('npm install -g yarn');
                }
                runCommand('yarn install');
                break;
            default:
                runCommand('npm install');
        }
        success('Dependências instaladas com sucesso!');
        return true;
    } catch (err) {
        error('Falha ao instalar dependências');
        return false;
    }
}

// Atualizar dependências
async function updateDependencies(packageManager) {
    info('Verificando atualizações...');
    
    try {
        switch(packageManager) {
            case 'pnpm':
                runCommand('pnpm update', { ignoreError: true });
                runCommand('pnpm outdated', { ignoreError: true });
                break;
            case 'yarn':
                runCommand('yarn upgrade', { ignoreError: true });
                runCommand('yarn outdated', { ignoreError: true });
                break;
            default:
                runCommand('npm update', { ignoreError: true });
                runCommand('npm outdated', { ignoreError: true });
        }
        success('Dependências atualizadas!');
    } catch (err) {
        warn('Algumas dependências não puderam ser atualizadas');
    }
}

// Configurar variáveis de ambiente
async function setupEnvironment() {
    info('Configurando ambiente...');
    
    const envExamplePath = path.join(process.cwd(), '.env.example');
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
        fs.copyFileSync(envExamplePath, envPath);
        success('.env criado a partir de .env.example');
        
        const shouldEdit = await askQuestion('Deseja editar o arquivo .env agora? (s/N): ');
        if (shouldEdit.toLowerCase() === 's') {
            const editor = process.env.EDITOR || 'nano';
            runCommand(`${editor} ${envPath}`);
        }
    } else if (!fs.existsSync(envPath)) {
        warn('.env.example não encontrado. Criando .env padrão...');
        const defaultEnv = `# Ambiente
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://localhost:5432/meu_db

# API
API_KEY=sua_chave_aqui
SECRET_KEY=seu_secret_aqui
`;
        fs.writeFileSync(envPath, defaultEnv);
        success('.env criado com configurações padrão');
    } else {
        info('.env já existe');
    }
}

// Instalar dependências de desenvolvimento globais
async function installGlobalDevTools() {
    info('Instalando ferramentas globais de desenvolvimento...');
    
    const tools = [
        'nodemon',
        'pm2',
        'concurrently'
    ];
    
    const npmGlobalList = runCommandOutput('npm list -g --depth=0');
    
    for (const tool of tools) {
        if (!npmGlobalList || !npmGlobalList.includes(tool)) {
            info(`Instalando ${tool}...`);
            runCommand(`npm install -g ${tool}`);
            success(`${tool} instalado`);
        } else {
            success(`${tool} já instalado`);
        }
    }
}

// Configurar scripts no package.json
function setupPackageJsonScripts() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
        return;
    }
    
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        
        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }
        
        // Adicionar scripts padrão se não existirem
        const defaultScripts = {
            'start': 'node index.js',
            'dev': 'nodemon index.js',
            'setup': 'node setup.js',
            'update': 'npm update && node setup.js',
            'test': 'echo "Error: no test specified" && exit 1',
            'lint': 'eslint .',
            'format': 'prettier --write .'
        };
        
        let modified = false;
        
        for (const [script, command] of Object.entries(defaultScripts)) {
            if (!packageJson.scripts[script]) {
                packageJson.scripts[script] = command;
                modified = true;
            }
        }
        
        if (modified) {
            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            success('Scripts adicionados ao package.json');
        }
    } catch (err) {
        warn('Erro ao configurar scripts no package.json');
    }
}

// Criar estrutura de diretórios
function createDirectoryStructure() {
    info('Criando estrutura de diretórios...');
    
    const directories = [
        'src',
        'src/controllers',
        'src/models',
        'src/routes',
        'src/middlewares',
        'src/utils',
        'src/services',
        'src/config',
        'test',
        'public',
        'public/css',
        'public/js',
        'public/images',
        'logs',
        'temp',
        'uploads'
    ];
    
    for (const dir of directories) {
        const dirPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            success(`Diretório criado: ${dir}`);
        }
    }
}

// Configurar Git
async function setupGit() {
    info('Configurando Git...');
    
    if (fs.existsSync(path.join(process.cwd(), '.git'))) {
        info('Git já inicializado');
        return;
    }
    
    const initGit = await askQuestion('Inicializar repositório Git? (s/N): ');
    
    if (initGit.toLowerCase() === 's') {
        runCommand('git init');
        
        // Criar .gitignore se não existir
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
            const gitignoreContent = `# Dependências
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Ambiente
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Sistema
.DS_Store
Thumbs.db

# Build
dist/
build/
coverage/

# Temporários
temp/
tmp/
`;
            fs.writeFileSync(gitignorePath, gitignoreContent);
            success('.gitignore criado');
        }
        
        runCommand('git add .');
        runCommand('git commit -m "Initial commit: Project setup"');
        success('Git inicializado com commit inicial');
    }
}

// Relatório final
function showReport(packageManager) {
    console.log('\n' + '='.repeat(50));
    success('CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(50));
    
    console.log(`\n${colors.green}📦 Gerenciador:${colors.reset} ${packageManager}`);
    console.log(`${colors.green}📂 Diretório:${colors.reset} ${process.cwd()}`);
    console.log(`${colors.green}📅 Data:${colors.reset} ${new Date().toLocaleString()}`);
    
    console.log(`\n${colors.cyan}Próximos passos:${colors.reset}`);
    console.log(`  1. Configure as variáveis no arquivo .env`);
    console.log(`  2. Execute: ${colors.yellow}${packageManager} run dev${colors.reset}`);
    console.log(`  3. Acesse: ${colors.yellow}http://localhost:3000${colors.reset}`);
    
    console.log(`\n${colors.cyan}Comandos úteis:${colors.reset}`);
    console.log(`  ${packageManager} start  - Iniciar produção`);
    console.log(`  ${packageManager} run dev - Iniciar desenvolvimento`);
    console.log(`  ${packageManager} update - Atualizar dependências`);
    console.log(`  node setup.js         - Reconfigurar projeto`);
    
    console.log('\n' + '='.repeat(50) + '\n');
}

// Função principal
async function main() {
    console.log('\n' + '='.repeat(50));
    log('   CONFIGURADOR DE PROJETO NODE.JS', colors.cyan);
    console.log('='.repeat(50) + '\n');
    
    // Verificar Node.js
    checkNodeVersion();
    
    // Instalar dependências do sistema
    await installSystemDeps();
    
    // Configurar gerenciador de pacotes
    const packageManager = await setupPackageManager();
    
    // Configurar package.json scripts
    setupPackageJsonScripts();
    
    // Instalar dependências do projeto
    await installProjectDependencies(packageManager);
    
    // Atualizar dependências
    const shouldUpdate = await askQuestion('Deseja atualizar as dependências? (s/N): ');
    if (shouldUpdate.toLowerCase() === 's') {
        await updateDependencies(packageManager);
    }
    
    // Instalar ferramentas globais
    const installTools = await askQuestion('Instalar ferramentas globais (nodemon, pm2)? (s/N): ');
    if (installTools.toLowerCase() === 's') {
        await installGlobalDevTools();
    }
    
    // Configurar ambiente
    await setupEnvironment();
    
    // Criar estrutura de diretórios
    createDirectoryStructure();
    
    // Configurar Git
    await setupGit();
    
    // Relatório final
    showReport(packageManager);
}

// Executar com tratamento de erro
main().catch(err => {
    error(`Erro fatal: ${err.message}`);
    process.exit(1);
});
```

## Como executar:

1. **Salve o script** como `setup.js` na raiz do seu projeto

2. **Execute com Node.js:**
```bash
node setup.js
```

## Exemplo de package.json inicial:

```json
{
  "name": "meu-projeto-node",
  "version": "1.0.0",
  "description": "Projeto Node.js configurado automaticamente",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "setup": "node setup.js",
    "update": "npm update && node setup.js",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "keywords": ["nodejs", "automation", "setup"],
  "author": "Seu Nome",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  }
}
```

## Exemplo de .env.example:

```env
# Ambiente
NODE_ENV=development
PORT=3000
HOST=localhost

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha123
DB_NAME=meu_banco

# JWT
JWT_SECRET=seu_secret_jwt_aqui
JWT_EXPIRES_IN=7d

# API
API_VERSION=v1
API_PREFIX=/api

# Logs
LOG_LEVEL=debug
LOG_DIR=logs

# Uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu@email.com
SMTP_PASS=sua_senha
```

## Script de arquivo principal (index.js):

```javascript
// index.js - Ponto de entrada da aplicação
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rotas básicas
app.get('/', (req, res) => {
    res.json({
        message: 'API funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📝 Ambiente: ${process.env.NODE_ENV}`);
});
```

Este script Node.js é completo, interativo e pronto para uso! Ele configura todo o ambiente, instala dependências, cria estrutura de pastas e fornece feedback visual.
