// app.js
const express = require('express');
const app = express();

app.use(express.json());
app.use('/api/search', require('./routes/search'));

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));