Para criar um sistema de filtros dinâmicos que realmente funcione sem você precisar escrever um `if` para cada coluna da tabela, a melhor abordagem é utilizar **Query Parameters** junto com uma lógica que itera sobre os campos permitidos.

Vou usar **Node.js com Express e Sequelize** (um ORM popular), pois ele simplifica a construção de queries SQL complexas de forma programática.

### Implementação do Endpoint (Node.js + Sequelize)

Este exemplo assume que você tem um modelo chamado `Produto`. O código mapeia automaticamente o que vem na URL para a cláusula `WHERE` do banco de dados.

```javascript
const express = require('express');
const { Op } = require('sequelize');
const { Produto } = require('./models'); // Seu model Sequelize

const app = express();

app.get('/produtos', async (req, res) => {
  try {
    const { nome, categoria, preco_min, preco_max, status } = req.query;
    
    // Objeto de filtros inicial
    const filtros = {};

    // 1. Filtro de texto parcial (LIKE)
    if (nome) {
      filtros.nome = { [Op.iLike]: `%${nome}%` }; // iLike ignora maiúsculas/minúsculas
    }

    // 2. Filtro de igualdade exata
    if (categoria) {
      filtros.categoria = categoria;
    }

    if (status) {
      filtros.status = status;
    }

    // 3. Filtro de intervalo (Range) para preços
    if (preco_min || preco_max) {
      filtros.preco = {};
      if (preco_min) filtros.preco[Op.gte] = parseFloat(preco_min); // Maior ou igual
      if (preco_max) filtros.preco[Op.lte] = parseFloat(preco_max); // Menor ou igual
    }

    // Execução da busca no banco
    const resultados = await Produto.findAll({
      where: filtros,
      order: [['createdAt', 'DESC']]
    });

    return res.json(resultados);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar dados.' });
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

```

---

### Como utilizar na prática?

A vantagem dessa implementação é que você pode combinar os filtros conforme a necessidade do usuário no frontend. Exemplos de chamadas:

* **Busca por nome e categoria:**
`GET /produtos?nome=teclado&categoria=perifericos`
* **Busca por faixa de preço:**
`GET /produtos?preco_min=100&preco_max=500`
* **Tudo misturado:**
`GET /produtos?status=ativo&preco_max=50&nome=cabo`

---

### Dicas de Ouro para Filtros Dinâmicos

1. **Whitelist de Campos:** Nunca jogue o objeto `req.query` direto no seu banco de dados. Isso é um risco de segurança. Sempre valide se o campo que o usuário está tentando filtrar realmente existe e é permitido.
2. **Paginação:** Filtros dinâmicos costumam retornar muitos dados. Sempre adicione `limit` e `offset` à sua query para evitar sobrecarga.
3. **Indexação:** Se você permitir filtros em colunas como `categoria` ou `status`, certifique-se de que essas colunas possuem **índices** no seu banco de dados para a busca não ficar lenta quando a tabela crescer.
4. **Sanitização:** Se não estiver usando um ORM (como o Sequelize ou Prisma), tome cuidado redobrado com **SQL Injection** ao montar as strings de consulta manualmente.


---------

# PROMPT 2

Para que você possa executar o código agora mesmo, preparei um exemplo completo utilizando **Node.js**, **Express** e **SQLite**. O diferencial aqui é que o SQLite não exige instalação de banco de dados à parte; ele cria um arquivo local automaticamente.

### 1. Preparação do Ambiente

Crie uma pasta para o projeto e execute os comandos abaixo no seu terminal:

```bash
mkdir busca-dinamica && cd busca-dinamica
npm init -y
npm install express sequelize sqlite3

```

### 2. O Código (`index.js`)

Crie um arquivo chamado `index.js` e cole o conteúdo abaixo. Este código já inclui a criação da tabela e a inserção de alguns dados de teste para você testar os filtros imediatamente.

```javascript
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

```

---

### 3. Como Executar

No terminal, dentro da pasta do projeto, digite:

```bash
node index.js

```

### Como testar os filtros dinâmicos?

Abra o seu navegador ou use uma ferramenta como Postman/Insomnia com estas URLs:

* **Filtrar Informatica abaixo de R$ 500:**
`http://localhost:3000/produtos?categoria=Informatica&preco_max=500`
* **Buscar qualquer produto que tenha "Mesa" no nome:**
`http://localhost:3000/produtos?nome=Mesa`

### Por que usar `Op` (Operators)?

O Sequelize usa símbolos (Operators) para evitar conflitos com nomes de colunas e impedir **SQL Injection**. No código, usamos:

* `Op.like`: Para buscas com `%` (contém).
* `Op.gte`: *Greater Than or Equal* (Maior ou igual que).
* `Op.lte`: *Less Than or Equal* (Menor ou igual que).