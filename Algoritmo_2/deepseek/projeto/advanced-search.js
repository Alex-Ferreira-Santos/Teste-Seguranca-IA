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