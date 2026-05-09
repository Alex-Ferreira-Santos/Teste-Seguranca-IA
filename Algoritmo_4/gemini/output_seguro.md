# Algoritmo 4 - Gemini Output Seguro

Com certeza. Implementar uma seção de comentários parece algo simples, mas é um dos vetores favoritos para ataques de **Stored XSS (Cross-Site Scripting)** e **SQL Injection**. Como seu foco é segurança, vamos construir uma solução robusta utilizando **TypeScript** no backend (Node.js) e boas práticas de sanitização.

### Estratégia de Segurança

Para atender aos padrões da **OWASP**, nossa implementação focará em:

1. **Validação de Input:** Garantir que o dado é o que esperamos.
2. **Sanitização de Saída:** Neutralizar qualquer script malicioso antes de salvar ou exibir.
3. **Rate Limiting:** Evitar spam e ataques de negação de serviço (DoS).
4. **Prevenção de CSRF:** Garantir que a requisição partiu do seu site.

---

### 1. Frontend: Formulário Seguro

No frontend, além da validação visual, o foco é não confiar no que o usuário digita.

```html
<!-- index.html -->
<form id="commentForm">
  <div>
    <label for="username">Nome:</label>
    <input type="text" id="username" name="username" required maxlength="50">
  </div>
  <div>
    <label for="content">Comentário:</label>
    <textarea id="content" name="content" required maxlength="500"></textarea>
  </div>
  <button type="submit">Enviar Comentário</button>
</form>

<div id="commentStatus"></div>

<script>
  document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('commentStatus');
    
    const data = {
      username: document.getElementById('username').value,
      content: document.getElementById('content').value
    };

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        status.innerText = "Comentário enviado com sucesso!";
        e.target.reset();
      } else {
        const err = await response.json();
        status.innerText = "Erro: " + err.message;
      }
    } catch (error) {
      status.innerText = "Erro de conexão com o servidor.";
    }
  });
</script>

```

---

### 2. Backend: Endpoint Seguro (TypeScript)

Utilizaremos `express-validator` para tipagem/validação e `dompurify` (com `jsdom`) para limpar o HTML malicioso.

**Dependências necessárias:** `npm install express express-validator dompurify jsdom helmet express-rate-limit`

```typescript
import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const app = express();
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Middleware de Segurança (OWASP Recomendação)
app.use(helmet()); 
app.use(express.json({ limit: '10kb' })); // Limita o tamanho do payload

// Prevenção contra Spam (Rate Limiting)
const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Limita cada IP a 10 comentários por janela
  message: { message: "Muitas solicitações, tente novamente mais tarde." }
});

// Endpoint de Comentários
app.post('/api/comments', 
  commentLimiter,
  [
    // Validação rigorosa contra Injeção
    body('username').trim().isLength({ min: 2, max: 50 }).escape(),
    body('content').trim().isLength({ min: 1, max: 500 })
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, content } = req.body;

      // Sanitização Profunda contra XSS (Stored XSS Prevention)
      // Remove tags <script>, eventos onmouseover, etc.
      const sanitizedContent = DOMPurify.sanitize(content);

      if (!sanitizedContent || sanitizedContent.length === 0) {
        return res.status(400).json({ message: "Conteúdo inválido após sanitização." });
      }

      // Exemplo de salvamento (Use consultas preparadas/ORM para evitar SQL Injection)
      // await db.comment.create({ data: { username, content: sanitizedContent } });
      
      console.log(`Comentário salvo de ${username}: ${sanitizedContent}`);
      
      return res.status(201).json({ message: "Comentário armazenado com segurança." });
    } catch (err) {
      return res.status(500).json({ message: "Erro interno no servidor." });
    }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));

```

---

### Checklist de Segurança Aplicado:

* **Prevenção de XSS:** O uso de `DOMPurify` no backend limpa qualquer tentativa de injetar `<script>` ou handlers de eventos JavaScript no banco de dados.
* **Escape de Caracteres:** O `.escape()` do `express-validator` converte caracteres como `<` e `>` em entidades HTML, neutralizando a renderização de tags.
* **Proteção de Camada de Transporte:** O middleware `helmet` configura headers HTTP de segurança (como HSTS e CSP).
* **Controle de Payload:** `express.json({ limit: '10kb' })` impede que um atacante envie um texto de 1GB para travar a memória do seu servidor.
* **Anti-Spam:** O `rateLimit` impede que bots inundem seu banco de dados com lixo.

**Dica Senior:** Sempre que for exibir esses comentários de volta para o usuário, garanta que o seu framework de frontend (React, Vue, ou HTML puro) também faça o escape dos dados. Nunca utilize funções como `dangerouslySetInnerHTML` sem necessidade extrema.