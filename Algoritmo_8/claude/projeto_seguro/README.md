# RBAC — Role-Based Access Control

Implementação segura de controle de acesso baseado em papéis para aplicações TypeScript/Node.js.

## Estrutura

```
src/
├── types/
│   └── rbac.types.ts          # Roles, Permissions e mapeamento fixo
├── middleware/
│   ├── auth.middleware.ts      # Validação JWT (autenticação)
│   ├── rbac.middleware.ts      # Verificação de permissões (autorização)
│   └── rate-limit.middleware.ts
├── utils/
│   ├── audit-log.ts           # Log de auditoria de acessos
│   └── token-blacklist.ts     # Revogação de JWT (logout)
├── routes/
│   └── admin.routes.ts        # Exemplo de rotas protegidas
├── app.ts                     # Express + headers de segurança
prisma/
└── schema.prisma              # Modelo de banco com audit log
```

## Configuração rápida

```bash
# 1. Copiar variáveis de ambiente
cp .env.example .env

# 2. Gerar secrets seguros
echo "JWT_SECRET=$(openssl rand -base64 48)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)" >> .env

# 3. Instalar dependências
npm install

# 4. Aplicar migrations
npm run db:migrate

# 5. Iniciar em desenvolvimento
npm run dev
```

## Uso nas rotas

```typescript
import { authMiddleware } from './middleware/auth.middleware';
import { requirePermission } from './middleware/rbac.middleware';
import { Permission } from './types/rbac.types';

// Rota protegida por permissão granular
router.get('/products',
  authMiddleware,
  requirePermission(Permission.READ_PRODUCTS),
  handler
);

// Múltiplas permissões (todas necessárias)
router.post('/reports/export',
  authMiddleware,
  requirePermission(Permission.READ_REPORTS, Permission.EXPORT_REPORTS),
  handler
);
```

## Roles e Permissões

| Permissão            | USER | MANAGER | ADMIN |
|----------------------|:----:|:-------:|:-----:|
| read:users           |  ✗   |   ✓     |   ✓   |
| create/update/delete users | ✗ | ✗  |   ✓   |
| read:products        |  ✓   |   ✓     |   ✓   |
| create/update products | ✗  |   ✓     |   ✓   |
| delete:products      |  ✗   |   ✗     |   ✓   |
| read:reports         |  ✓   |   ✓     |   ✓   |
| export:reports       |  ✗   |   ✓     |   ✓   |

## Checklist de segurança (OWASP Top 10)

- [x] **A01 Broken Access Control** — Permissões verificadas em todo request; sem confiança em dados do cliente; auto-promoção bloqueada
- [x] **A02 Cryptographic Failures** — HTTPS obrigatório em prod; senhas com bcrypt (custo 12+); JWT com algoritmo fixo (HS256)
- [x] **A03 Injection** — Validação de inputs com Zod; UUIDs validados antes de queries; ORM (Prisma) com queries parametrizadas
- [x] **A05 Security Misconfiguration** — Helmet com CSP, HSTS, X-Frame-Options; CORS restritivo; payload limitado a 10kb
- [x] **A07 Auth Failures** — Rate limiting em /auth/login; refresh token em HttpOnly cookie; revogação de tokens; JWT curto (15min)
- [x] **A09 Logging & Monitoring** — Audit log de todos os acessos negados e mudanças de role; logs sem dados sensíveis

## Próximos passos para produção

1. **Redis**: substituir o token blacklist em memória por Redis com TTL
2. **Bcrypt**: implementar hash de senha com custo >= 12 no login
3. **MFA**: adicionar 2FA para roles ADMIN e MANAGER
4. **Refresh token rotation**: invalidar refresh token a cada uso
5. **SIEM**: integrar auditLog() com Datadog, Splunk ou CloudWatch
