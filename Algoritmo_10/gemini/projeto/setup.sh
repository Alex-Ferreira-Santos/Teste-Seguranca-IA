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