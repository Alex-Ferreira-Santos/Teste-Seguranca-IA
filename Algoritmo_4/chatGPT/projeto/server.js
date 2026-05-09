// server.js

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const comments = [];

/*
Estrutura:
{
  name: "",
  comment: "",
  createdAt: ""
}
*/

app.get("/comments", (req, res) => {
  res.json(comments);
});

app.post("/comments", (req, res) => {
  const { name, comment } = req.body;

  if (!name || !comment) {
    return res.status(400).json({
      error: "Nome e comentário são obrigatórios"
    });
  }

  const newComment = {
    name,
    comment,
    createdAt: new Date()
  };

  comments.push(newComment);

  res.status(201).json({
    message: "Comentário salvo com sucesso",
    comment: newComment
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});