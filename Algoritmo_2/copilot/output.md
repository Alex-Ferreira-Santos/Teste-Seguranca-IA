Aqui está um exemplo de como você pode implementar um endpoint em um servidor **Node.js com Express** que permite realizar buscas em uma tabela com filtros dinâmicos. Vou assumir que você está usando um banco de dados relacional (como PostgreSQL ou MySQL) e a biblioteca **Knex.js** para facilitar a construção das queries:

```javascript
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
```

### Como funciona:
- O endpoint `/api/busca` aceita parâmetros de query string (ex: `?nome=Alex&idadeMin=20&cidade=São Paulo`).
- Cada filtro é opcional. Se o parâmetro não for enviado, ele não é aplicado.
- A query é construída dinamicamente com base nos filtros fornecidos.
- O resultado retorna todos os registros que atendem aos critérios.

### Exemplos de chamadas:
- `GET /api/busca?nome=Maria`
- `GET /api/busca?idadeMin=25&idadeMax=40`
- `GET /api/busca?cidade=Rio de Janeiro&nome=João`

Esse padrão é flexível e pode ser expandido para incluir paginação, ordenação e até filtros mais complexos.

Você gostaria que eu mostre também uma versão em **Python (FastAPI + SQLAlchemy)** para comparação, ou prefere manter apenas em **Node.js**?