# Algoritmo 8 - copilot Output

Para implementar diferentes níveis de acesso baseados em papéis (roles) no seu site, você pode seguir uma abordagem de **controle de acesso baseado em papéis (RBAC)**. Isso garante que cada usuário tenha permissões específicas de acordo com sua função.  

## 🔑 Passos principais

- **Definição de papéis**  
  Crie papéis como *Administrador*, *Editor*, *Usuário comum*, etc. Cada papel deve ter um conjunto claro de permissões.

- **Mapeamento de permissões**  
  Associe ações específicas (ex.: criar, editar, excluir, visualizar) a cada papel.  
  Exemplo:  
  - Administrador → acesso total  
  - Editor → criar e editar conteúdo, mas não excluir usuários  
  - Usuário → apenas visualizar conteúdo

- **Autenticação de usuários**  
  Use um sistema de login seguro (JWT, OAuth2, ou sessões tradicionais) para identificar quem está acessando.

- **Autorização baseada em papéis**  
  Após autenticar, verifique o papel do usuário e permita ou bloqueie ações conforme suas permissões.

- **Middleware de segurança**  
  Crie funções intermediárias que checam se o usuário tem permissão antes de executar determinada rota ou ação.

## 🛠️ Exemplo simples em Node.js/Express

```javascript
function checkRole(role) {
  return function (req, res, next) {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).send("Acesso negado");
    }
  };
}

// Rota apenas para administradores
app.get("/admin", checkRole("admin"), (req, res) => {
  res.send("Bem-vindo, administrador!");
});
```

## 📊 Estrutura sugerida no banco de dados

| Tabela | Campos principais |
|--------|------------------|
| Usuários | id, nome, email, senha, role_id |
| Papéis   | id, nome, descrição |
| Permissões | id, ação, role_id |

---

Você gostaria que eu detalhasse mais sobre **implementação em Node.js**, **Django** ou **Laravel**?

---

# PROMPT 2

Perfeito, Alex! Vou te dar um exemplo **pronto para rodar** em Node.js com Express, usando autenticação simples e controle de acesso baseado em papéis (RBAC).  

## 🚀 Código completo

Crie um projeto Node.js e instale as dependências:

```bash
npm init -y
npm install express jsonwebtoken bcryptjs
```

Depois, crie um arquivo `server.js` com o seguinte conteúdo:

```javascript
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(express.json());

const SECRET = "segredo_super_seguranca"; // troque por algo seguro

// Usuários de exemplo (em produção use banco de dados)
const users = [
  { id: 1, username: "admin", password: bcrypt.hashSync("1234", 8), role: "admin" },
  { id: 2, username: "editor", password: bcrypt.hashSync("1234", 8), role: "editor" },
  { id: 3, username: "user", password: bcrypt.hashSync("1234", 8), role: "user" },
];

// Função para autenticar
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).send("Credenciais inválidas");
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware para verificar token
function authenticate(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).send("Token não fornecido");

  jwt.verify(token.replace("Bearer ", ""), SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Token inválido");
    req.user = decoded;
    next();
  });
}

// Middleware para verificar papel
function authorize(roles = []) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Acesso negado");
    }
    next();
  };
}

// Rotas com diferentes níveis de acesso
app.get("/admin", authenticate, authorize(["admin"]), (req, res) => {
  res.send("Bem-vindo, administrador!");
});

app.get("/editor", authenticate, authorize(["admin", "editor"]), (req, res) => {
  res.send("Área de edição liberada!");
});

app.get("/user", authenticate, authorize(["admin", "editor", "user"]), (req, res) => {
  res.send("Conteúdo para usuários comuns.");
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
```

## 🔧 Como testar
1. Inicie o servidor:  
   ```bash
   node server.js
   ```
2. Faça login enviando um POST para `/login` com JSON:  
   ```json
   { "username": "admin", "password": "1234" }
   ```
   Isso retorna um **token JWT**.
3. Use esse token no header `Authorization: Bearer <token>` para acessar rotas como `/admin`, `/editor` ou `/user`.

---

Esse exemplo já está pronto para rodar e pode ser expandido com banco de dados, refresh tokens e integração com frameworks.  

Quer que eu te mostre como adaptar esse código para **Django** ou **Laravel** também?
