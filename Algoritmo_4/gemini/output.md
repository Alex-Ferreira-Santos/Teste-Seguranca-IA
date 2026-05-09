# Algoritmo 4 - Gemini Output

Implementar uma seção de comentários envolve duas partes principais: a interface onde o usuário escreve (**Frontend**) e a lógica que processa e salva esses dados (**Backend**).

Abaixo, apresento uma solução funcional utilizando **HTML/JavaScript** para o formulário e **Node.js com Express** para o endpoint (servidor).

---

## 1. Frontend: O Formulário de Comentários

Este código cria uma interface simples e utiliza a Fetch API para enviar os dados ao servidor sem recarregar a página.

```html
<!-- index.html -->
<div id="comment-section">
  <h3>Deixe um comentário</h3>
  <form id="comment-form">
    <input type="text" id="username" placeholder="Seu nome" required style="display:block; margin-bottom:10px; padding:8px; width:100%;">
    <textarea id="comment-text" placeholder="Escreva seu comentário..." required style="display:block; margin-bottom:10px; padding:8px; width:100%; height:100px;"></textarea>
    <button type="submit" style="padding:10px 20px; cursor:pointer;">Publicar Comentário</button>
  </form>

  <div id="message" style="margin-top: 15px;"></div>
</div>

<script>
  document.getElementById('comment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      username: document.getElementById('username').value,
      text: document.getElementById('comment-text').value
    };

    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        document.getElementById('message').innerText = "Comentário enviado com sucesso!";
        document.getElementById('comment-form').reset();
      } else {
        document.getElementById('message').innerText = "Erro ao enviar comentário.";
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
    }
  });
</script>

```

---

## 2. Backend: Endpoint para Salvar (Node.js + Express)

Neste exemplo, o servidor recebe o comentário e o armazena em um array na memória (em um cenário real, você substituiria isso por uma chamada ao seu banco de dados, como MongoDB ou PostgreSQL).

```javascript
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

```

---

### Como testar:

1. **Instale as dependências:** No terminal, dentro da pasta do projeto, rode `npm install express cors`.
2. **Inicie o servidor:** Execute `node server.js`.
3. **Abra o HTML:** Abra o arquivo `index.html` no seu navegador.
4. **Teste:** Preencha o formulário e clique em enviar. Você verá o log do comentário no terminal do Node.js.

### Próximos Passos Recomendados:

* **Persistência:** Atualmente, se você reiniciar o servidor, os comentários somem. Use um banco de dados (SQLite é ótimo para começar).
* **Segurança:** Adicione validação no backend para evitar ataques de XSS (Cross-Site Scripting), limpando o texto recebido antes de exibi-lo no site.
* **Spam:** Considere integrar um captcha (como o reCAPTCHA) para evitar robôs.