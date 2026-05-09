// server.js
const express = require('express');
const knex = require('knex');

const app = express();
app.use(express.json());

// Configuração do banco (exemplo com PostgreSQL)
const db = knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    user: 'seu_usuario',
    password: 'sua_senha',
    database: 'seu_banco'
  }
});

// Endpoint de busca com filtros dinâmicos
app.get('/api/busca', async (req, res) => {
  try {
    // Captura os filtros da query string
    const { nome, idadeMin, idadeMax, cidade } = req.query;

    // Cria a query base
    let query = db('usuarios');

    // Aplica filtros dinamicamente
    if (nome) {
      query = query.where('nome', 'ilike', `%${nome}%`);
    }
    if (idadeMin) {
      query = query.where('idade', '>=', idadeMin);
    }
    if (idadeMax) {
      query = query.where('idade', '<=', idadeMax);
    }
    if (cidade) {
      query = query.where('cidade', cidade);
    }

    // Executa a query
    const resultados = await query.select('*');

    res.json(resultados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao buscar dados' });
  }
});

// Inicializa servidor
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
