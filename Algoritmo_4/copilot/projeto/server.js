const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Armazenamento em memória
let comments = [];

// Endpoint para salvar comentários
app.post('/comments', (req, res) => {
  const { name, comment } = req.body;

  if (!name || !comment) {
    return res.status(400).json({ error: 'Nome e comentário são obrigatórios.' });
  }

  const newComment = {
    id: comments.length + 1,
    name,
    comment,
    date: new Date()
  };

  comments.push(newComment);
  res.status(201).json({ message: 'Comentário salvo com sucesso!', comment: newComment });
});

// Endpoint para listar comentários
app.get('/comments', (req, res) => {
  res.json(comments);
});

app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
