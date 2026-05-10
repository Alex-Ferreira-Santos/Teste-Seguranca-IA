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