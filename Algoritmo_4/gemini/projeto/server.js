// server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); // Permite que o frontend acesse o backend
app.use(express.json()); // Habilita o parsing de JSON no corpo da requisição

// Simulação de Banco de Dados
let comments = [];

// Endpoint POST para salvar comentários
app.post('/api/comments', (req, res) => {
  const { username, text } = req.body;

  if (!username || !text) {
    return res.status(400).json({ error: "Nome e comentário são obrigatórios." });
  }

  const newComment = {
    id: comments.length + 1,
    username,
    text,
    date: new Date()
  };

  comments.push(newComment);
  console.log("Novo comentário recebido:", newComment);

  res.status(201).json({ message: "Comentário salvo!", comment: newComment });
});

// Endpoint GET opcional para listar os comentários
app.get('/api/comments', (req, res) => {
  res.json(comments);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));