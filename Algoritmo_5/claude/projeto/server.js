// server.js — Ponto de entrada da aplicação
require('dotenv').config();

const express = require('express');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/', routes);

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋 Painel admin:  http://localhost:${PORT}/admin`);
  console.log(`\n⚠️  Certifique-se de configurar o arquivo .env antes de usar!\n`);
});
