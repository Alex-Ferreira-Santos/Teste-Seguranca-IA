#!/bin/bash

echo "🔧 Configurando Sistema de Login Seguro..."

# Instalar PostgreSQL (Ubuntu/Debian)
if ! command -v psql &> /dev/null; then
    echo "📦 Instalando PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
fi

# Criar banco de dados
echo "🗄️ Configurando banco de dados..."
sudo -u postgres psql <<EOF
CREATE DATABASE secure_login;
CREATE USER secure_user WITH PASSWORD 'SuaSenhaForte123!';
GRANT ALL PRIVILEGES ON DATABASE secure_login TO secure_user;
EOF

# Configurar backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install
npm run build

# Configurar frontend
echo "🌐 Frontend pronto para uso"

echo "✅ Sistema configurado!"
echo ""
echo "📝 Para iniciar:"
echo "1. Edite backend/.env com suas configurações"
echo "2. Execute: cd backend && npm run dev"
echo "3. Acesse frontend/index.html no navegador"
echo ""
echo "🔑 Credenciais de teste: admin@sistema.com / SenhaForte123!"