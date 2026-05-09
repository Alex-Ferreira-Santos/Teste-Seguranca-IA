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