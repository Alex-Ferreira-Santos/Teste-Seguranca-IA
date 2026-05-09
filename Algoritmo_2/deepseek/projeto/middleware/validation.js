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