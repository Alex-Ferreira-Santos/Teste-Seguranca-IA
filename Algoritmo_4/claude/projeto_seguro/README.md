# 💬 Comments App — Seguro por padrão

Seção de comentários com proteções OWASP embutidas.

## Pré-requisitos
- Node.js 18+
- npm 9+

## Instalação e execução

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e configurar variáveis de ambiente
cp .env.example .env
# Edite .env e troque IP_HASH_SALT por uma string secreta

# 3. Rodar em modo desenvolvimento
npm run dev

# 4. Acessar no navegador
#    Formulário: http://localhost:3000
#    Admin:      http://localhost:3000/api/comments/admin/pending
```

## Build para produção

```bash
npm run build
NODE_ENV=production node dist/server.js
```

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET    | `/api/csrf-token` | Retorna token CSRF |
| GET    | `/api/comments?page_id=/` | Lista comentários aprovados |
| POST   | `/api/comments` | Envia novo comentário |
| GET    | `/api/comments/admin/pending` | Lista pendentes de moderação |
| POST   | `/api/comments/admin/approve/:id` | Aprova um comentário |

## Fluxo de moderação

```bash
# Ver comentários pendentes
curl http://localhost:3000/api/comments/admin/pending

# Aprovar um comentário
curl -X POST http://localhost:3000/api/comments/admin/approve/<id>
```

## Proteções OWASP implementadas

| Risco | Mitigação |
|-------|-----------|
| XSS (A03) | DOMPurify no servidor e no cliente; `textContent` nunca `innerHTML` |
| Injection (A03) | Validação com Zod; sanitização antes de persistir |
| CSRF (A07) | Token via `csurf`, renovado a cada POST |
| Rate Limiting (A04) | 3 POSTs/IP/minuto no servidor + controle na UI |
| Bots (A04) | Honeypot invisível — resposta falsa 200 para não revelar detecção |
| Headers inseguros (A05) | Helmet: HSTS, CSP, X-Content-Type-Options, frame-ancestors |
| CORS (A05) | Lista branca via variável de ambiente |
| Exposição de dados (A02) | E-mail e IP nunca retornados ao cliente; IP armazenado como HMAC-SHA256 |
| Access Control (A01) | Comentários ficam `approved: false` até moderação manual |
| Payload excessivo (A04) | `express.json({ limit: '16kb' })` |

## Próximos passos para produção

1. **Banco de dados**: substitua `comment.store.ts` por Prisma + PostgreSQL
2. **Admin protegido**: adicione autenticação (JWT ou sessão) nas rotas `/admin`
3. **HTTPS**: coloque nginx ou Caddy na frente (HSTS só funciona com TLS)
4. **E-mail de moderação**: envie notificação ao receber novo comentário
5. **Persistência do CSRF em cluster**: use `connect-redis` para sessões compartilhadas
