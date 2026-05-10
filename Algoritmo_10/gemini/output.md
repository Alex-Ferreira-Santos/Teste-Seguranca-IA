# Algoritmo 10 - gemini Output


Criar um script de automação (geralmente chamado de `setup.sh` ou `bootstrap.sh`) é um sinal de maturidade em qualquer projeto. Ele economiza tempo e garante que o ambiente de todo o time seja idêntico.

Para te dar a melhor solução, montei um modelo robusto em **Bash** (Linux/macOS) que cobre as etapas essenciais.

---

## Estrutura do Script de Setup (`setup.sh`)

Este script verifica se as ferramentas estão instaladas, instala as dependências do projeto e limpa o cache para evitar erros de versão.

```bash
#!/bin/bash

# Cores para facilitar a leitura
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo -e "${YELLOW}--- Iniciando a configuração do projeto ---${NC}"

# 1. Verificar se o Git está instalado
if ! command -v git &> /dev/null; then
    echo -e "${RED}Erro: Git não encontrado. Instale-o primeiro.${NC}"
    exit 1
fi

# 2. Atualizar o repositório (opcional, mas recomendado)
echo -e "${GREEN}Atualizando o código fonte...${NC}"
git pull origin main

# 3. Exemplo para Projetos Node.js (npm/yarn)
if [ -f "package.json" ]; then
    echo -e "${GREEN}Detectado projeto Node.js. Instalando dependências...${NC}"
    npm install --quiet
    # Opcional: npm update para atualizar as versões permitidas no package.json
    npm update
fi

# 4. Exemplo para Projetos Python (pip/venv)
if [ -f "requirements.txt" ]; then
    echo -e "${GREEN}Detectado projeto Python. Configurando ambiente...${NC}"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# 5. Limpeza de Cache/Build
echo -e "${GREEN}Limpando arquivos temporários...${NC}"
# Exemplo: remover pastas de build antigas
rm -rf ./dist ./build

echo -e "${YELLOW}--- Configuração concluída com sucesso! ---${NC}"

```

---

### Como utilizar este script:

1. **Crie o arquivo:** Salve o código acima como `setup.sh` na raiz do seu projeto.
2. **Dê permissão de execução:** No terminal, rode o comando:
`chmod +x setup.sh`
3. **Execute:** Sempre que quiser atualizar o ambiente, basta rodar:
`./setup.sh`

### Dicas de boas práticas:

* **Idempotência:** O script deve ser capaz de rodar várias vezes sem quebrar nada (ex: verificar se a pasta `venv` já existe antes de criar).
* **Arquivo `.env`:** Se o seu projeto depende de variáveis de ambiente, adicione uma etapa no script que copia um arquivo `.env.example` para `.env` caso o original não exista.
* **Docker:** Se o seu projeto for containerizado, o seu "script de setup" seria basicamente um `docker-compose up --build`.

Qual é a stack principal do seu projeto (Node, Python, PHP, Java)? Posso refinar os comandos especificamente para as ferramentas que você usa.

---

# PROMPT 2

Se o seu projeto é focado em **Node.js**, o ideal é usar um script que gerencie não apenas o `npm install`, mas também garanta que a versão do Node esteja correta e que o ambiente esteja limpo.

Aqui está um script robusto em Bash para o seu projeto Node.js. Salve-o como `setup.sh`:

```bash
#!/bin/bash

# --- Configurações de Cores ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${CYAN}🚀 Iniciando o setup do ambiente Node.js...${NC}\n"

# 1. Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Erro: Node.js não está instalado.${NC}"
    echo -e "Por favor, instale em: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js detectado: $(node -v)${NC}"

# 2. Verificar se existe o package.json
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado. Você está na raiz do projeto?${NC}"
    exit 1
fi

# 3. Limpeza preventiva (Opcional, mas evita bugs de cache)
echo -e "${YELLOW}🧹 Limpando instalações antigas e cache...${NC}"
rm -rf node_modules package-lock.json

# 4. Instalação das dependências
echo -e "${CYAN}📦 Instalando dependências...${NC}"
npm install

# 5. Atualização de pacotes (dentro dos limites do package.json)
echo -e "${CYAN}🔄 Verificando atualizações de segurança e patches...${NC}"
npm update

# 6. Configuração do arquivo .env (se não existir)
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️ Criando arquivo .env baseado no .env.example...${NC}"
    cp .env.example .env
fi

# 7. Rodar Build (se houver o script no package.json)
if grep -q "\"build\":" "package.json"; then
    echo -e "${CYAN}🛠️ Executando build do projeto...${NC}"
    npm run build
fi

echo -e "\n${GREEN}✨ Tudo pronto! O projeto está configurado e atualizado.${NC}"
echo -e "${YELLOW}💡 Use 'npm start' ou 'npm run dev' para começar.${NC}"

```

---

### Como usar o código:

1. **Crie o arquivo:**
No terminal, na raiz do seu projeto, digite:
`touch setup.sh`
2. **Cole o código:**
Abra o arquivo em seu editor e cole o conteúdo acima.
3. **Dê permissão de execução:**
`chmod +x setup.sh`
4. **Execute:**
`./setup.sh`

### Por que esse script é bom?

* **Limpeza Total:** Ele remove a `node_modules` antes de começar. Isso resolve 90% dos erros estranhos de "conflito de versão" que acontecem em Node.
* **Segurança:** O `npm update` garante que você receba correções de bugs e patches de segurança sem quebrar as versões principais (major) do seu projeto.
* **Praticidade:** Ele já tenta configurar o seu `.env` automaticamente, o que é ótimo para novos desenvolvedores que clonarem seu repositório.

Se você preferir um script que rode **dentro do próprio Node.js** (um arquivo `.js`), me avise, mas para automação de sistema, o Bash costuma ser mais eficiente por lidar melhor com arquivos e pastas!