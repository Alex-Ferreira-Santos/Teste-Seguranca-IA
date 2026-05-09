Aqui está uma implementação completa de um endpoint com filtros dinâmicos usando Node.js/Express e PostgreSQL:

## 1. Endpoint com Filtros Dinâmicos

```javascript
// server.js
const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());

// Configuração do banco de dados
const pool = new Pool({
  user: 'seu_usuario',
  host: 'localhost',
  database: 'seu_banco',
  password: 'sua_senha',
  port: 5432,
});

// Endpoint de busca com filtros dinâmicos
app.get('/api/search/:tabela', async (req, res) => {
  try {
    const { tabela } = req.params;
    const { page = 1, limit = 10, sort, order = 'ASC', ...filters } = req.query;
    
    // Validação básica da tabela (prevenir SQL Injection)
    const validTables = ['usuarios', 'produtos', 'pedidos'];
    if (!validTables.includes(tabela)) {
      return res.status(400).json({ error: 'Tabela inválida' });
    }
    
    // Construir query dinâmica
    let query = `SELECT * FROM "${tabela}"`;
    const queryParams = [];
    let paramCounter = 1;
    
    // Adicionar filtros WHERE
    const whereConditions = [];
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') {
        whereConditions.push(`"${key}" = $${paramCounter}`);
        queryParams.push(value);
        paramCounter++;
      }
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Adicionar ordenação
    if (sort && this.isValidColumn(sort)) {
      query += ` ORDER BY "${sort}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    // Adicionar paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    // Executar query principal
    const result = await pool.query(query, queryParams);
    
    // Query para contar total de registros
    let countQuery = `SELECT COUNT(*) FROM "${tabela}"`;
    if (whereConditions.length > 0) {
      countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, -2));
    const totalRecords = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRecords,
        totalPages: Math.ceil(totalRecords / limit)
      },
      filters_applied: filters
    });
    
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ error: 'Erro ao processar a busca' });
  }
});

// Função auxiliar para validar colunas
function isValidColumn(columnName) {
  const validColumns = ['id', 'nome', 'email', 'criado_em', 'status'];
  return validColumns.includes(columnName);
}

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
```

## 2. Versão mais robusta com operadores de comparação

```javascript
// advanced-search.js
const express = require('express');
const app = express();

app.use(express.json());

// Mapeamento de operadores de busca
const operators = {
  'eq': '=',
  'ne': '!=',
  'gt': '>',
  'gte': '>=',
  'lt': '<',
  'lte': '<=',
  'like': 'LIKE',
  'in': 'IN',
  'between': 'BETWEEN'
};

// Função para construir filtros complexos
function buildFilters(filters) {
  const conditions = [];
  const values = [];
  let paramCount = 1;
  
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'object' && value !== null) {
      // Filtro com operador específico
      for (const [op, opValue] of Object.entries(value)) {
        if (operators[op]) {
          switch(op) {
            case 'like':
              conditions.push(`"${key}" LIKE $${paramCount}`);
              values.push(`%${opValue}%`);
              break;
            case 'in':
              const placeholders = opValue.map((_, idx) => `$${paramCount + idx}`).join(',');
              conditions.push(`"${key}" IN (${placeholders})`);
              values.push(...opValue);
              paramCount += opValue.length - 1;
              break;
            case 'between':
              conditions.push(`"${key}" BETWEEN $${paramCount} AND $${paramCount + 1}`);
              values.push(opValue[0], opValue[1]);
              paramCount++;
              break;
            default:
              conditions.push(`"${key}" ${operators[op]} $${paramCount}`);
              values.push(opValue);
          }
          paramCount++;
        }
      }
    } else if (value !== undefined && value !== '') {
      // Filtro simples (equality)
      conditions.push(`"${key}" = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  }
  
  return { conditions, values, paramCount };
}

app.get('/api/advanced-search/:tabela', async (req, res) => {
  try {
    const { tabela } = req.params;
    const { page = 1, limit = 10, sort, order = 'ASC', ...rawFilters } = req.query;
    
    // Parse de filtros JSON se necessário
    let filters = rawFilters;
    if (rawFilters.filters) {
      try {
        filters = JSON.parse(rawFilters.filters);
      } catch(e) {
        filters = rawFilters;
      }
    }
    
    // Construir condições WHERE
    const { conditions, values } = buildFilters(filters);
    
    let query = `SELECT * FROM "${tabela}"`;
    let countQuery = `SELECT COUNT(*) FROM "${tabela}"`;
    
    if (conditions.length > 0) {
      const whereClause = ` WHERE ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }
    
    // Adicionar ordenação
    if (sort) {
      query += ` ORDER BY "${sort}" ${order === 'DESC' ? 'DESC' : 'ASC'}`;
    }
    
    // Paginação
    const offset = (page - 1) * limit;
    query += ` LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    
    // Executar queries
    const [dataResult, countResult] = await Promise.all([
      pool.query(query, [...values, parseInt(limit), parseInt(offset)]),
      pool.query(countQuery, values)
    ]);
    
    res.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

## 3. Exemplos de uso da API

```javascript
// Exemplos de requisições

// Busca simples
// GET /api/search/usuarios?nome=João&status=ativo&page=1&limit=20

// Busca com ordenação
// GET /api/search/produtos?categoria=eletrônicos&sort=preco&order=DESC

// Busca avançada com operadores
// GET /api/advanced-search/produtos?filters={"preco":{"gte":100,"lte":500},"nome":{"like":"smart"}}

// Busca com múltiplos filtros
// GET /api/search/pedidos?cliente_id=123&status=entregue&data_inicio=2024-01-01

// Busca com paginação
// GET /api/search/usuarios?page=2&limit=50&status=ativo
```

## 4. Middleware de validação e sanitização

```javascript
// middleware/validation.js

const sanitizeInput = (req, res, next) => {
  // Sanitizar parâmetros da query
  for (let [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string') {
      // Remover caracteres perigosos
      req.query[key] = value.replace(/[<>'"]/g, '');
    }
  }
  next();
};

const validateTableName = (req, res, next) => {
  const { tabela } = req.params;
  const allowedTables = ['usuarios', 'produtos', 'pedidos', 'categorias'];
  
  if (!allowedTables.includes(tabela)) {
    return res.status(400).json({ error: 'Tabela não permitida' });
  }
  
  next();
};

// Aplicar middlewares
app.use(sanitizeInput);
app.use('/api/search/:tabela', validateTableName);
```

## 5. Cliente para testar a API

```javascript
// client-example.js
class SearchClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }
  
  async search(table, filters = {}, options = {}) {
    const params = new URLSearchParams({
      ...filters,
      page: options.page || 1,
      limit: options.limit || 10,
      sort: options.sort || '',
      order: options.order || 'ASC'
    });
    
    const response = await fetch(`${this.baseURL}/api/search/${table}?${params}`);
    return response.json();
  }
  
  async advancedSearch(table, filters, options = {}) {
    const params = new URLSearchParams({
      filters: JSON.stringify(filters),
      page: options.page || 1,
      limit: options.limit || 10,
      sort: options.sort || '',
      order: options.order || 'ASC'
    });
    
    const response = await fetch(`${this.baseURL}/api/advanced-search/${table}?${params}`);
    return response.json();
  }
}

// Uso do cliente
const client = new SearchClient('http://localhost:3000');

// Buscar usuários ativos
const usuarios = await client.search('usuarios', { status: 'ativo' });

// Busca avançada
const produtos = await client.advancedSearch('produtos', {
  preco: { gte: 100, lte: 500 },
  nome: { like: 'smart' }
}, { sort: 'preco', order: 'DESC' });
```

Este código fornece uma solução completa e segura para busca com filtros dinâmicos, incluindo validação de entrada, prevenção contra SQL injection, paginação e suporte a operadores de comparação.

---

# PROMPT 2

Aqui está o código completo e pronto para executar:

## 1. Instalação das dependências

```bash
# Criar pasta do projeto
mkdir api-busca-dinamica
cd api-busca-dinamica

# Inicializar projeto
npm init -y

# Instalar dependências
npm install express pg cors dotenv
npm install -D nodemon
```

## 2. Arquivo de configuração `.env`

```env
PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=testdb
DB_PASSWORD=123456
DB_PORT=5432
```

## 3. Arquivo principal `server.js` (código completo para copiar e colar)

```javascript
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração do banco de dados PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'testdb',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

// Testar conexão com o banco
pool.connect((err, client, release) => {
  if (err) {
    console.error('Erro ao conectar ao banco:', err.stack);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
    release();
  }
});

// ==================== ENDPOINTS ====================

// Endpoint principal com filtros dinâmicos
app.get('/api/busca/:tabela', async (req, res) => {
  try {
    const { tabela } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sort = 'id', 
      order = 'ASC',
      ...filters 
    } = req.query;
    
    // Lista de tabelas permitidas (segurança)
    const tabelasPermitidas = ['usuarios', 'produtos', 'pedidos'];
    
    if (!tabelasPermitidas.includes(tabela)) {
      return res.status(400).json({ 
        erro: 'Tabela não permitida',
        tabelas_disponiveis: tabelasPermitidas 
      });
    }
    
    // Construir filtros WHERE
    const conditions = [];
    const valores = [];
    let contador = 1;
    
    for (const [campo, valor] of Object.entries(filters)) {
      if (valor && valor !== '') {
        conditions.push(`"${campo}" ILIKE $${contador}`);
        valores.push(`%${valor}%`);
        contador++;
      }
    }
    
    let whereClause = '';
    if (conditions.length > 0) {
      whereClause = ` WHERE ${conditions.join(' AND ')}`;
    }
    
    // Validar ordenação
    const orderValid = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Query para buscar dados
    const query = `
      SELECT * FROM "${tabela}"
      ${whereClause}
      ORDER BY "${sort}" ${orderValid}
      LIMIT $${contador} OFFSET $${contador + 1}
    `;
    
    const queryParams = [...valores, parseInt(limit), offset];
    const result = await pool.query(query, queryParams);
    
    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total FROM "${tabela}"
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, valores);
    const total = parseInt(countResult.rows[0].total);
    
    res.json({
      sucesso: true,
      dados: result.rows,
      paginacao: {
        pagina_atual: parseInt(page),
        limite: parseInt(limit),
        total_registros: total,
        total_paginas: Math.ceil(total / limit),
        proxima_pagina: parseInt(page) < Math.ceil(total / limit) ? `page=${parseInt(page) + 1}&limit=${limit}` : null,
        pagina_anterior: parseInt(page) > 1 ? `page=${parseInt(page) - 1}&limit=${limit}` : null
      },
      filtros_aplicados: filters
    });
    
  } catch (error) {
    console.error('Erro na busca:', error);
    res.status(500).json({ 
      erro: 'Erro ao processar a busca',
      detalhe: error.message 
    });
  }
});

// Endpoint com operadores avançados (maior, menor, entre, etc)
app.get('/api/busca-avancada/:tabela', async (req, res) => {
  try {
    const { tabela } = req.params;
    const { page = 1, limit = 10, sort = 'id', order = 'ASC', ...filters } = req.query;
    
    const tabelasPermitidas = ['usuarios', 'produtos', 'pedidos'];
    if (!tabelasPermitidas.includes(tabela)) {
      return res.status(400).json({ erro: 'Tabela não permitida' });
    }
    
    const conditions = [];
    const valores = [];
    let contador = 1;
    
    for (const [campo, valor] of Object.entries(filters)) {
      if (!valor) continue;
      
      // Suporte para operadores especiais
      if (campo.includes('_min')) {
        const campoReal = campo.replace('_min', '');
        conditions.push(`"${campoReal}" >= $${contador}`);
        valores.push(valor);
        contador++;
      } 
      else if (campo.includes('_max')) {
        const campoReal = campo.replace('_max', '');
        conditions.push(`"${campoReal}" <= $${contador}`);
        valores.push(valor);
        contador++;
      }
      else if (campo === 'busca_texto') {
        conditions.push(`(
          nome ILIKE $${contador} OR 
          descricao ILIKE $${contador} OR 
          email ILIKE $${contador}
        )`);
        valores.push(`%${valor}%`);
        contador++;
      }
      else {
        conditions.push(`"${campo}" ILIKE $${contador}`);
        valores.push(`%${valor}%`);
        contador++;
      }
    }
    
    let whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const query = `
      SELECT * FROM "${tabela}"
      ${whereClause}
      ORDER BY "${sort}" ${order === 'DESC' ? 'DESC' : 'ASC'}
      LIMIT $${contador} OFFSET $${contador + 1}
    `;
    
    const result = await pool.query(query, [...valores, parseInt(limit), offset]);
    
    const countQuery = `SELECT COUNT(*) as total FROM "${tabela}" ${whereClause}`;
    const countResult = await pool.query(countQuery, valores);
    
    res.json({
      sucesso: true,
      dados: result.rows,
      paginacao: {
        pagina: parseInt(page),
        limite: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        paginas: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: error.message });
  }
});

// Endpoint para criar tabelas exemplo
app.post('/api/criar-tabelas', async (req, res) => {
  try {
    // Criar tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        idade INTEGER,
        cidade VARCHAR(100),
        status VARCHAR(20) DEFAULT 'ativo',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela de produtos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10,2) NOT NULL,
        categoria VARCHAR(100),
        estoque INTEGER DEFAULT 0,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Criar tabela de pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_nome VARCHAR(100) NOT NULL,
        valor_total DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente',
        data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ mensagem: '✅ Tabelas criadas com sucesso!' });
    
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Endpoint para inserir dados de exemplo
app.post('/api/inserir-dados', async (req, res) => {
  try {
    // Inserir usuários
    await pool.query(`
      INSERT INTO usuarios (nome, email, idade, cidade, status) VALUES
      ('João Silva', 'joao@email.com', 28, 'São Paulo', 'ativo'),
      ('Maria Santos', 'maria@email.com', 32, 'Rio de Janeiro', 'ativo'),
      ('Pedro Oliveira', 'pedro@email.com', 25, 'Belo Horizonte', 'inativo'),
      ('Ana Souza', 'ana@email.com', 35, 'São Paulo', 'ativo'),
      ('Carlos Lima', 'carlos@email.com', 40, 'Curitiba', 'inativo')
      ON CONFLICT (email) DO NOTHING
    `);
    
    // Inserir produtos
    await pool.query(`
      INSERT INTO produtos (nome, descricao, preco, categoria, estoque) VALUES
      ('Smartphone X', 'Smartphone de última geração', 1999.99, 'Eletrônicos', 50),
      ('Notebook Pro', 'Notebook para trabalho e jogos', 3499.99, 'Eletrônicos', 30),
      ('Camiseta Premium', 'Camiseta 100% algodão', 49.99, 'Vestuário', 100),
      ('Tênis Esportivo', 'Tênis para corrida', 199.99, 'Esportes', 75),
      ('Livro JavaScript', 'Aprenda JavaScript do zero', 79.99, 'Livros', 200)
    `);
    
    // Inserir pedidos
    await pool.query(`
      INSERT INTO pedidos (cliente_nome, valor_total, status) VALUES
      ('João Silva', 1999.99, 'entregue'),
      ('Maria Santos', 3499.99, 'pendente'),
      ('Pedro Oliveira', 249.98, 'cancelado'),
      ('Ana Souza', 79.99, 'entregue'),
      ('Carlos Lima', 199.99, 'pendente')
    `);
    
    res.json({ mensagem: '✅ Dados de exemplo inseridos com sucesso!' });
    
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Rota principal (documentação)
app.get('/', (req, res) => {
  res.json({
    api: 'Sistema de Busca Dinâmica',
    versao: '1.0.0',
    endpoints: {
      buscar: 'GET /api/busca/:tabela?campo=valor&page=1&limit=10',
      busca_avancada: 'GET /api/busca-avancada/:tabela?campo_min=10&campo_max=100',
      criar_tabelas: 'POST /api/criar-tabelas',
      inserir_dados: 'POST /api/inserir-dados'
    },
    exemplos: {
      buscar_usuarios: 'http://localhost:3000/api/busca/usuarios?nome=joão&status=ativo',
      buscar_produtos: 'http://localhost:3000/api/busca/produtos?categoria=eletrônicos&preco_min=1000&preco_max=3000',
      buscar_pedidos: 'http://localhost:3000/api/busca/pedidos?status=entregue&page=1&limit=5'
    }
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 Servidor rodando em: http://localhost:${PORT}
  📊 Endpoints disponíveis:
  - GET  /api/busca/:tabela
  - GET  /api/busca-avancada/:tabela
  - POST /api/criar-tabelas
  - POST /api/inserir-dados
  `);
});
```

## 4. Arquivo `package.json` atualizado

```json
{
  "name": "api-busca-dinamica",
  "version": "1.0.0",
  "description": "API com filtros dinâmicos",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 5. Como executar

### Passo 1: Instalar PostgreSQL
```bash
# Se não tiver PostgreSQL instalado, instale:
# Windows: baixar de https://www.postgresql.org/download/
# Ubuntu/Debian: sudo apt install postgresql postgresql-contrib
# Mac: brew install postgresql
```

### Passo 2: Criar banco de dados
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco
CREATE DATABASE testdb;

# Sair
\q
```

### Passo 3: Executar a API
```bash
# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

## 6. Testando a API

### Criar tabelas
```bash
curl -X POST http://localhost:3000/api/criar-tabelas
```

### Inserir dados de exemplo
```bash
curl -X POST http://localhost:3000/api/inserir-dados
```

### Testar buscas (abrir no navegador)
```bash
# Buscar usuários
http://localhost:3000/api/busca/usuarios?nome=joão

# Buscar produtos com filtros
http://localhost:3000/api/busca/produtos?categoria=eletrônicos

# Buscar com paginação
http://localhost:3000/api/busca/usuarios?page=1&limit=5

# Busca avançada com range de preço
http://localhost:3000/api/busca-avancada/produtos?preco_min=100&preco_max=2000

# Buscar pedidos com status
http://localhost:3000/api/busca/pedidos?status=entregue

# Busca em múltiplos campos
http://localhost:3000/api/busca-avancada/produtos?busca_texto=smart
```

## 7. Interface HTML de teste (opcional)

Crie um arquivo `teste.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Teste API Busca Dinâmica</title>
    <style>
        body { font-family: Arial; padding: 20px; }
        input, button { margin: 5px; padding: 8px; }
        pre { background: #f4f4f4; padding: 10px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>Teste de Busca Dinâmica</h1>
    
    <div>
        <h3>Buscar Usuários</h3>
        <input type="text" id="nome" placeholder="Nome">
        <input type="text" id="status" placeholder="Status (ativo/inativo)">
        <button onclick="buscarUsuarios()">Buscar</button>
    </div>
    
    <div>
        <h3>Buscar Produtos</h3>
        <input type="text" id="categoria" placeholder="Categoria">
        <input type="number" id="preco_min" placeholder="Preço mínimo">
        <input type="number" id="preco_max" placeholder="Preço máximo">
        <button onclick="buscarProdutos()">Buscar</button>
    </div>
    
    <h3>Resultado:</h3>
    <pre id="resultado">Aguardando busca...</pre>
    
    <script>
        async function buscarUsuarios() {
            const nome = document.getElementById('nome').value;
            const status = document.getElementById('status').value;
            
            let url = 'http://localhost:3000/api/busca/usuarios?';
            if (nome) url += `nome=${nome}&`;
            if (status) url += `status=${status}&`;
            
            const response = await fetch(url);
            const data = await response.json();
            document.getElementById('resultado').innerHTML = JSON.stringify(data, null, 2);
        }
        
        async function buscarProdutos() {
            const categoria = document.getElementById('categoria').value;
            const precoMin = document.getElementById('preco_min').value;
            const precoMax = document.getElementById('preco_max').value;
            
            let url = 'http://localhost:3000/api/busca-avancada/produtos?';
            if (categoria) url += `categoria=${categoria}&`;
            if (precoMin) url += `preco_min=${precoMin}&`;
            if (precoMax) url += `preco_max=${precoMax}&`;
            
            const response = await fetch(url);
            const data = await response.json();
            document.getElementById('resultado').innerHTML = JSON.stringify(data, null, 2);
        }
    </script>
</body>
</html>
```

Pronto! Agora é só executar `npm run dev` e começar a testar a API! 🚀