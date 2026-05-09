const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');

const app = express();
app.use(express.json());

// Inicializa o SQLite (Cria um arquivo chamado 'database.sqlite')
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Definição do Modelo
const Produto = sequelize.define('Produto', {
  nome: DataTypes.STRING,
  categoria: DataTypes.STRING,
  preco: DataTypes.FLOAT,
  estoque: DataTypes.INTEGER
});

// Endpoint de Busca Dinâmica
app.get('/produtos', async (req, res) => {
  try {
    const { nome, categoria, preco_min, preco_max } = req.query;
    let filtros = {};

    // Filtro por nome (Busca parcial)
    if (nome) {
      filtros.nome = { [Op.like]: `%${nome}%` };
    }

    // Filtro por categoria exata
    if (categoria) {
      filtros.categoria = categoria;
    }

    // Filtro por faixa de preço
    if (preco_min || preco_max) {
      filtros.preco = {};
      if (preco_min) filtros.preco[Op.gte] = parseFloat(preco_min);
      if (preco_max) filtros.preco[Op.lte] = parseFloat(preco_max);
    }

    const produtos = await Produto.findAll({ where: filtros });
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Sincronizar banco e popular dados de exemplo
async function iniciar() {
  await sequelize.sync({ force: true });
  
  await Produto.bulkCreate([
    { nome: 'Mouse Gamer', categoria: 'Informatica', preco: 150.00, estoque: 10 },
    { nome: 'Teclado Mecânico', categoria: 'Informatica', preco: 350.00, estoque: 5 },
    { nome: 'Cadeira Office', categoria: 'Moveis', preco: 890.00, estoque: 2 },
    { nome: 'Monitor 24 Pol', categoria: 'Informatica', preco: 1200.00, estoque: 8 },
    { nome: 'Mesa Escrivaninha', categoria: 'Moveis', preco: 450.00, estoque: 3 }
  ]);

  app.listen(3000, () => {
    console.log('✅ Servidor rodando em http://localhost:3000');
    console.log('---');
    console.log('Teste os filtros:');
    console.log('1. Todos: http://localhost:3000/produtos');
    console.log('2. Por Categoria: http://localhost:3000/produtos?categoria=Moveis');
    console.log('3. Por Preço: http://localhost:3000/produtos?preco_min=300&preco_max=1000');
    console.log('4. Por Nome: http://localhost:3000/produtos?nome=Mouse');
  });
}

iniciar();