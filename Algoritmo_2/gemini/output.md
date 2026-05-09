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