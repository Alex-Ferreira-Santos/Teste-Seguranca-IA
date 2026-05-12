# Algoritmo 8 - claude Output

Ótima pergunta! Implementar controle de acesso baseado em papéis (RBAC — Role-Based Access Control) é um padrão fundamental em sistemas web. Vou te mostrar a arquitetura geral e um exemplo prático em JavaScript/Node.js.

Primeiro, um diagrama da estrutura:Agora, a implementação prática. A abordagem mais comum é definir os papéis com suas permissões, e depois criar um middleware que verifica antes de acessar cada rota.

**1. Defina os papéis e permissões**

```js
// roles.js
const ROLES = {
  admin:  ['posts:create', 'posts:edit', 'posts:delete', 'posts:read', 'users:manage'],
  editor: ['posts:create', 'posts:edit', 'posts:read'],
  viewer: ['posts:read'],
};

function hasPermission(role, permission) {
  return ROLES[role]?.includes(permission) ?? false;
}

module.exports = { ROLES, hasPermission };
```

**2. Crie o middleware de autorização**

```js
// middleware/authorize.js
const { hasPermission } = require('../roles');

function authorize(permission) {
  return (req, res, next) => {
    const user = req.user; // preenchido pelo middleware de autenticação (JWT)

    if (!user || !hasPermission(user.role, permission)) {
      return res.status(403).json({ error: 'Acesso proibido' });
    }

    next();
  };
}

module.exports = authorize;
```

**3. Use nas rotas**

```js
// routes/posts.js
const authorize = require('../middleware/authorize');

router.get('/posts',        authorize('posts:read'),   listPosts);
router.post('/posts',       authorize('posts:create'), createPost);
router.put('/posts/:id',    authorize('posts:edit'),   updatePost);
router.delete('/posts/:id', authorize('posts:delete'), deletePost);
```

**4. Inclua o papel no JWT ao fazer login**

```js
const token = jwt.sign(
  { userId: user.id, role: user.role }, // 'admin' | 'editor' | 'viewer'
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
```

---

Alguns pontos importantes para produção:

- **Armazene o papel no banco**, não apenas no token — o token pode ficar desatualizado se o papel mudar.
- **Sempre valide no backend** — nunca confie apenas em restrições do frontend.
- **Para casos mais complexos** (ex: um editor só pode editar seus próprios posts), adicione verificação de propriedade dentro do handler da rota, além da permissão genérica.
- **Bibliotecas prontas**: se quiser uma solução mais robusta, veja [CASL](https://casl.js.org) (JavaScript) ou [Casbin](https://casbin.org) (multi-linguagem).

Está usando algum framework específico (Express, Fastify, Next.js)? Posso adaptar o exemplo.

---

# PROMPT 2

Vou gerar um projeto completo e funcional para você!Tudo funcionando. Agora vou empacotar para você baixar:Projeto completo pronto. Para rodar:

```bash
tar -xzf rbac-demo.tar.gz
cd rbac-demo
npm install
npm start
# Acesse http://localhost:3000
```

**3 usuários de teste** (senha `123456`):

| Usuário | Email | Papel | O que pode fazer |
|---|---|---|---|
| Alice Admin | alice@demo.com | admin | Tudo |
| Eduardo Editor | eduardo@demo.com | editor | Criar/editar posts, ver relatórios |
| Vera Viewer | vera@demo.com | viewer | Somente leitura |

O frontend mostra visualmente o que cada papel pode ou não fazer — botões bloqueados, seções com erro 403, e a lista de permissões do usuário logado.