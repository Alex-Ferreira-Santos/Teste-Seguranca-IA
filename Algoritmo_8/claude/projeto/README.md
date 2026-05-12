# RBAC Demo — Controle de Acesso Baseado em Papéis

## Como executar

```bash
npm install
npm start
```

Acesse: http://localhost:3000

## Usuários de teste (senha: 123456)

| Usuário          | Email              | Papel  | Permissões                              |
|------------------|--------------------|--------|-----------------------------------------|
| Alice Admin      | alice@demo.com     | admin  | Tudo: posts, usuários, relatórios       |
| Eduardo Editor   | eduardo@demo.com   | editor | Criar/editar posts, ver relatórios      |
| Vera Viewer      | vera@demo.com      | viewer | Somente leitura de posts                |

## Estrutura

```
rbac-demo/
├── server.js      # Servidor Express + rotas da API
├── middleware.js  # Autenticação JWT e autorização por permissão
├── roles.js       # Definição dos papéis e permissões
└── public/
    └── index.html # Frontend interativo
```

## Rotas da API

| Método | Rota            | Permissão necessária |
|--------|-----------------|----------------------|
| POST   | /api/login      | —                    |
| GET    | /api/me         | (qualquer autenticado)|
| GET    | /api/posts      | posts:read           |
| POST   | /api/posts      | posts:create         |
| PUT    | /api/posts/:id  | posts:edit           |
| DELETE | /api/posts/:id  | posts:delete         |
| GET    | /api/users      | users:read           |
| GET    | /api/reports    | reports:read         |
