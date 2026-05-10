# Algoritmo 8 - gemini Output

Implementar um sistema de **Controle de Acesso Baseado em Papéis (RBAC - Role-Based Access Control)** é uma das formas mais sólidas de gerenciar permissões. Em vez de atribuir permissões diretamente a cada usuário, você as agrupa em "papéis" (Admin, Editor, Viewer) e atribui esses papéis aos usuários.

Aqui está um guia prático de como estruturar essa funcionalidade:

---

### 1. Modelagem de Dados

A base de tudo é como você organiza as tabelas no seu banco de dados. Para um sistema flexível, o ideal é ter três entidades principais:

* **Usuários:** Quem acessa o sistema.
* **Papéis (Roles):** O cargo ou nível (ex: `admin`, `user`).
* **Permissões (Permissions):** A ação específica (ex: `delete_post`, `edit_settings`).

### 2. Fluxo de Verificação (Lógica de Backend)

O processo geralmente segue estes passos:

1. O usuário faz login.
2. O servidor gera um token (como **JWT**) contendo os papéis do usuário.
3. A cada requisição a uma rota protegida, o sistema verifica se o papel do usuário permite aquela ação.

#### Exemplo de lógica em Node.js/Express:

```javascript
const checkRole = (roleRequired) => {
  return (req, res, next) => {
    const userRole = req.user.role; // Extraído do JWT no middleware de auth
    if (userRole === roleRequired || userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ message: "Acesso negado." });
    }
  };
};

// Aplicando na rota
app.delete('/post/:id', checkRole('editor'), (req, res) => {
  // Apenas admins ou editores chegam aqui
});

```

---

### 3. Interface do Usuário (Frontend)

No frontend, o RBAC serve para **esconder elementos da interface**, melhorando a experiência do usuário (embora a segurança real deva estar sempre no backend).

* **Condicionais de Renderização:** Se `user.role !== 'admin'`, não mostre o botão "Excluir".
* **Proteção de Rotas:** Use bibliotecas como *React Router* ou o middleware do *Next.js* para redirecionar usuários que tentarem acessar `/admin` sem a permissão correta.

---

### 4. Boas Práticas

* **Princípio do Menor Privilégio:** Todo usuário novo deve começar com o nível de acesso mais baixo possível.
* **Hierarquia de Papéis:** Facilite a gestão criando uma hierarquia onde o `admin` herda automaticamente todas as permissões de `editor` e `viewer`.
* **Não armazene permissões sensíveis no LocalStorage:** No frontend, use apenas para controle de UI. Sempre valide o papel no servidor através de tokens assinados.

Você já tem uma stack tecnológica (linguagem ou framework) definida para esse projeto, ou está começando do zero?

---

# PROMPT 2

Para fornecer um código que você possa executar agora, vou utilizar **Node.js** com o framework **Express**. Este exemplo simula um sistema completo com autenticação simples e verificação de papéis (RBAC).

### Pré-requisitos

Você precisará ter o [Node.js](https://nodejs.org/) instalado. Crie uma pasta para o projeto e execute:

```bash
npm init -y
npm install express jsonwebtoken

```

---

### O Código (`server.js`)

Crie um arquivo chamado `server.js` e cole o conteúdo abaixo:

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

const SECRET_KEY = "sua_chave_secreta_super_segura";

// 1. Simulação de Banco de Dados de Usuários
const users = [
  { id: 1, username: 'admin_user', password: '123', role: 'ADMIN' },
  { id: 2, username: 'editor_user', password: '123', role: 'EDITOR' },
  { id: 3, username: 'viewer_user', password: '123', role: 'VIEWER' }
];

// 2. Middleware de Autenticação (Verifica se o token é válido)
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: "Token não fornecido." });

  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token inválido." });
    req.user = decoded;
    next();
  });
};

// 3. Middleware de Autorização (Verifica o papel/role)
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: `Acesso proibido para o nível ${req.user.role}` });
    }
  };
};

// --- ROTAS ---

// Rota de Login (Gera o Token)
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token });
  }
  res.status(401).json({ message: "Credenciais inválidas" });
});

// Rota Pública
app.get('/public', (req, res) => res.json({ msg: "Qualquer um vê isso." }));

// Rota para Viewer ou superior
app.get('/dashboard', authenticate, authorize(['ADMIN', 'EDITOR', 'VIEWER']), (req, res) => {
  res.json({ msg: `Bem-vindo ao Dashboard! Seu papel é: ${req.user.role}` });
});

// Rota exclusiva para Admin
app.delete('/delete-user', authenticate, authorize(['ADMIN']), (req, res) => {
  res.json({ msg: "Usuário deletado com sucesso pelo Administrador!" });
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));

```

---

### Como testar (Passo a passo)

Para testar, use uma ferramenta como **Postman**, **Insomnia** ou o próprio `curl` no terminal:

1. **Inicie o servidor:** `node server.js`
2. **Faça Login como Editor:**
* **POST** `http://localhost:3000/login`
* **Body (JSON):** `{"username": "editor_user", "password": "123"}`
* *Copie o token gerado.*


3. **Acesse o Dashboard (Autorizado):**
* **GET** `http://localhost:3000/dashboard`
* **Header:** `Authorization: Bearer [SEU_TOKEN]`


4. **Tente deletar um usuário (Proibido para Editor):**
* **DELETE** `http://localhost:3000/delete-user`
* **Header:** `Authorization: Bearer [SEU_TOKEN]`
* *O sistema retornará erro 403 (Forbidden).*



### O que acontece por trás das cenas

Este modelo é escalável: se você precisar de uma nova função (ex: `MODERATOR`), basta adicioná-la ao array de `authorize` nas rotas desejadas.