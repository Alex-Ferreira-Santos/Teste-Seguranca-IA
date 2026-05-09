Aqui está uma implementação completa de endpoint com filtros dinâmicos para Express + PostgreSQL:

```javascript
// routes/search.js
const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * GET /api/search
 *
 * Query params suportados:
 *   - table        (obrigatório) nome da tabela
 *   - fields       campos a retornar, separados por vírgula (default: *)
 *   - page         página atual (default: 1)
 *   - limit        itens por página (default: 20, max: 100)
 *   - sort         campo para ordenar (ex: created_at)
 *   - order        asc | desc (default: asc)
 *   - [qualquer outro param] vira filtro de igualdade (ex: status=active)
 *
 * Filtros especiais via prefixo no valor:
 *   - gt:10        maior que 10
 *   - gte:10       maior ou igual a 10
 *   - lt:10        menor que 10
 *   - lte:10       menor ou igual a 10
 *   - like:João    ILIKE %João%
 *   - in:a,b,c     IN ('a', 'b', 'c')
 *   - null:        IS NULL
 *   - notnull:     IS NOT NULL
 *   - not:valor    diferente de valor
 */

// Tabelas permitidas — SEMPRE mantenha essa lista para evitar SQL injection
const ALLOWED_TABLES = new Set(['users', 'products', 'orders', 'categories']);

// Campos reservados que não devem virar filtros
const RESERVED_PARAMS = new Set(['table', 'fields', 'page', 'limit', 'sort', 'order']);

function parseOperator(raw) {
  const operators = [
    { prefix: 'gte:', op: '>=' },
    { prefix: 'gt:',  op: '>'  },
    { prefix: 'lte:', op: '<=' },
    { prefix: 'lt:',  op: '<'  },
    { prefix: 'like:', op: 'ILIKE' },
    { prefix: 'not:',  op: '<>'  },
    { prefix: 'in:',   op: 'IN'  },
    { prefix: 'null:', op: 'IS NULL' },
    { prefix: 'notnull:', op: 'IS NOT NULL' },
  ];

  for (const { prefix, op } of operators) {
    if (raw.startsWith(prefix)) {
      return { op, value: raw.slice(prefix.length) };
    }
  }

  return { op: '=', value: raw };
}

function buildWhereClause(filters) {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  for (const [column, raw] of Object.entries(filters)) {
    // Valida nome da coluna (apenas letras, números e _)
    if (!/^\w+$/.test(column)) continue;

    const { op, value } = parseOperator(raw);

    if (op === 'IS NULL' || op === 'IS NOT NULL') {
      conditions.push(`"${column}" ${op}`);
      continue;
    }

    if (op === 'IN') {
      const items = value.split(',').map((_, i) => `$${paramIndex + i}`);
      conditions.push(`"${column}" IN (${items.join(', ')})`);
      value.split(',').forEach(v => values.push(v.trim()));
      paramIndex += value.split(',').length;
      continue;
    }

    if (op === 'ILIKE') {
      conditions.push(`"${column}" ILIKE $${paramIndex}`);
      values.push(`%${value}%`);
    } else {
      conditions.push(`"${column}" ${op} $${paramIndex}`);
      values.push(value);
    }

    paramIndex++;
  }

  return { conditions, values };
}

router.get('/', async (req, res) => {
  const {
    table,
    fields = '*',
    page = 1,
    limit = 20,
    sort,
    order = 'asc',
    ...rawFilters
  } = req.query;

  // Validações básicas
  if (!table) {
    return res.status(400).json({ error: 'O parâmetro "table" é obrigatório.' });
  }

  if (!ALLOWED_TABLES.has(table)) {
    return res.status(400).json({ error: `Tabela "${table}" não permitida.` });
  }

  // Sanitiza campos de retorno
  const selectedFields = fields === '*'
    ? '*'
    : fields.split(',')
        .filter(f => /^\w+$/.test(f.trim()))
        .map(f => `"${f.trim()}"`)
        .join(', ');

  if (!selectedFields) {
    return res.status(400).json({ error: 'Nenhum campo válido fornecido em "fields".' });
  }

  // Remove params reservados dos filtros
  const filters = Object.fromEntries(
    Object.entries(rawFilters).filter(([k]) => !RESERVED_PARAMS.has(k))
  );

  const { conditions, values } = buildWhereClause(filters);

  // Paginação
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  const offset   = (pageNum - 1) * limitNum;

  // ORDER BY
  const orderClause = sort && /^\w+$/.test(sort)
    ? `ORDER BY "${sort}" ${order === 'desc' ? 'DESC' : 'ASC'}`
    : '';

  // WHERE
  const whereClause = conditions.length
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Query principal
  const dataQuery = `
    SELECT ${selectedFields}
    FROM "${table}"
    ${whereClause}
    ${orderClause}
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  // Query de contagem total
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "${table}"
    ${whereClause}
  `;

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(dataQuery, [...values, limitNum, offset]),
      pool.query(countQuery, values),
    ]);

    const total = parseInt(countResult.rows[0].total);

    return res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error('[search] Erro na query:', err.message);
    return res.status(500).json({ error: 'Erro interno ao executar a busca.' });
  }
});

module.exports = router;
```

```javascript
// app.js
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/search', require('./routes/search'));

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
```

---

**Exemplos de uso:**

```bash
# Busca simples por igualdade
GET /api/search?table=users&status=active

# ILIKE (busca parcial)
GET /api/search?table=users&name=like:João

# Range de datas + paginação
GET /api/search?table=orders&created_at=gte:2024-01-01&created_at=lte:2024-12-31&page=2&limit=10

# IN + ordenação
GET /api/search?table=products&category_id=in:1,2,3&sort=price&order=desc

# Campos específicos + IS NULL
GET /api/search?table=users&fields=id,name,email&deleted_at=null:
```

---

**Pontos de atenção para produção:**

| Aspecto | O que foi feito |
|---|---|
| SQL Injection | Whitelist de tabelas + `$1, $2...` parametrizados |
| Validação de colunas | Regex `^\w+$` em todo campo/coluna recebido |
| Paginação | Offset/limit com máximo de 100 por página |
| Contagem total | Query paralela com `Promise.all` para performance |
| Operadores | 9 operadores suportados via prefixo no valor |

Para adicionar uma nova tabela, basta incluí-la no `ALLOWED_TABLES`. Para filtros mais complexos (OR, subqueries, joins), o próximo passo natural seria migrar para um query builder como o **Knex.js**.