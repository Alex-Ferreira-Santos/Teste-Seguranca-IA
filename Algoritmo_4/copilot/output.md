# Algoritmo 4 - Copilot Output

Perfeito! Vou te mostrar um exemplo simples de como implementar uma sessão de comentários em um site. Vamos usar **HTML** para o formulário e um **endpoint em Node.js/Express** para salvar os comentários.  

---

## 📝 Formulário de comentários (HTML)
```html
<form id="commentForm" method="POST" action="/comments">
  <label for="name">Nome:</label>
  <input type="text" id="name" name="name" required />

  <label for="comment">Comentário:</label>
  <textarea id="comment" name="comment" required></textarea>

  <button type="submit">Enviar</button>
</form>
```

Esse formulário envia os dados para o endpoint `/comments`.

---

## ⚙️ Endpoint para salvar comentários (Node.js + Express)
```javascript
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Simulação de armazenamento em memória
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
  console.log('Servidor rodando na porta 3000');
});
```

---

## 🔧 Como funciona
- O formulário envia os dados via **POST** para `/comments`.
- O servidor valida e salva o comentário em uma lista (aqui em memória, mas você pode trocar por banco de dados como MongoDB ou PostgreSQL).
- O endpoint `/comments` também permite listar todos os comentários.

---

Quer que eu te mostre como integrar isso com um **banco de dados real** (ex: MongoDB ou PostgreSQL) para persistir os comentários, ou prefere manter simples em memória por enquanto?

---

# PROMPT 2

Ótimo! Aqui está um exemplo **pronto para rodar** de um servidor Node.js com Express que implementa uma sessão de comentários. Você pode copiar esse código para um arquivo `server.js` e executar com `node server.js`.  

---

## 📂 Estrutura de arquivos
```
meu-site/
│
├── server.js
└── public/
    └── index.html
```

---

## 📝 Código do servidor (`server.js`)
```javascript
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
```

---

## 🖥️ Código do formulário (`public/index.html`)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comentários</title>
</head>
<body>
  <h1>Deixe seu comentário</h1>
  <form id="commentForm">
    <label for="name">Nome:</label>
    <input type="text" id="name" name="name" required />

    <label for="comment">Comentário:</label>
    <textarea id="comment" name="comment" required></textarea>

    <button type="submit">Enviar</button>
  </form>

  <h2>Comentários</h2>
  <ul id="commentsList"></ul>

  <script>
    const form = document.getElementById('commentForm');
    const commentsList = document.getElementById('commentsList');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const comment = document.getElementById('comment').value;

      const response = await fetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, comment })
      });

      const data = await response.json();
      if (data.comment) {
        const li = document.createElement('li');
        li.textContent = `${data.comment.name}: ${data.comment.comment}`;
        commentsList.appendChild(li);
        form.reset();
      }
    });

    // Carregar comentários existentes
    async function loadComments() {
      const response = await fetch('/comments');
      const comments = await response.json();
      commentsList.innerHTML = '';
      comments.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name}: ${c.comment}`;
        commentsList.appendChild(li);
      });
    }

    loadComments();
  </script>
</body>
</html>
```

---

## 🚀 Como executar
1. Crie a pasta `meu-site` e os arquivos conforme acima.  
2. Instale dependências:
   ```bash
   npm init -y
   npm install express body-parser
   ```
3. Rode o servidor:
   ```bash
   node server.js
   ```
4. Abra no navegador: `http://localhost:3000` [(localhost in Bing)](https://www.bing.com/search?q="http%3A%2F%2Flocalhost%3A3000%2F")

---

Esse exemplo já funciona de ponta a ponta: formulário envia comentários, o servidor salva em memória e a página lista os comentários.  

Quer que eu te mostre como **persistir os comentários em um banco de dados** (ex: MongoDB ou SQLite) para não perder os dados quando reiniciar o servidor?