# Algoritmo 4 - ChatGPT Output

```html
<!-- comments.html -->
<section class="comments-section">
  <h2>Comentários</h2>

  <form id="commentForm">
    <input
      type="text"
      id="name"
      placeholder="Seu nome"
      required
    />

    <textarea
      id="comment"
      placeholder="Escreva seu comentário..."
      required
    ></textarea>

    <button type="submit">Enviar comentário</button>
  </form>

  <div id="commentsList"></div>
</section>

<style>
  .comments-section {
    max-width: 600px;
    margin: 40px auto;
    font-family: Arial, sans-serif;
  }

  #commentForm {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  input,
  textarea {
    padding: 12px;
    border: 1px solid #ccc;
    border-radius: 8px;
    font-size: 16px;
  }

  textarea {
    min-height: 120px;
    resize: vertical;
  }

  button {
    padding: 12px;
    border: none;
    border-radius: 8px;
    background: black;
    color: white;
    cursor: pointer;
    font-size: 16px;
  }

  button:hover {
    opacity: 0.9;
  }

  .comment {
    border: 1px solid #ddd;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .comment strong {
    display: block;
    margin-bottom: 8px;
  }

  .comment small {
    color: gray;
  }
</style>

<script>
  const form = document.getElementById("commentForm");
  const commentsList = document.getElementById("commentsList");

  async function loadComments() {
    const response = await fetch("http://localhost:3000/comments");
    const comments = await response.json();

    commentsList.innerHTML = "";

    comments.reverse().forEach(comment => {
      const div = document.createElement("div");
      div.className = "comment";

      div.innerHTML = `
        <strong>${comment.name}</strong>
        <p>${comment.comment}</p>
        <small>${new Date(comment.createdAt).toLocaleString()}</small>
      `;

      commentsList.appendChild(div);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const comment = document.getElementById("comment").value;

    await fetch("http://localhost:3000/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        comment
      })
    });

    form.reset();
    loadComments();
  });

  loadComments();
</script>
```

---

## Backend (Node.js + Express)

Instale as dependências:

```bash
npm init -y
npm install express cors
```

Crie o arquivo:

```js
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
```

---

## Executar

Inicie o backend:

```bash
node server.js
```

Depois abra o HTML no navegador.

---

## Melhorias recomendadas

Em produção, você provavelmente vai querer:

* salvar em banco de dados:

  * PostgreSQL
  * MySQL
  * MongoDB
  * SQLite

* adicionar:

  * autenticação
  * captcha anti-spam
  * moderação
  * paginação
  * likes/respostas
  * markdown
  * upload de imagens
  * sanitização XSS

---

## Versão com banco de dados (SQLite)

Se quiser, também posso te dar:

* versão com SQLite
* versão com MongoDB
* versão com PostgreSQL
* versão em PHP
* versão em Next.js
* versão em React
* versão em Laravel
* versão com comentários em tempo real via WebSocket
* versão com login de usuários
* versão estilo Disqus/Twitter/Reddit
