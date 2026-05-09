Vou criar uma implementação completa e segura em TypeScript. Deixa eu planejar e codificar isso.Agora vou implementar a solução completa com foco em segurança OWASP.Agora o diagrama de arquitetura de segurança:Aqui está a solução completa. Cada decisão foi tomada com uma ameaça OWASP específica em mente — clique nos nós do diagrama para explorar cada camada.

---

## O que foi implementado

A solução tem 5 arquivos e cobre as seguintes ameaças OWASP Top 10:

**`search.route.ts`** — o coração da solução, com:

**A03 — SQL Injection (prioridade máxima)**
Três linhas de defesa independentes. Primeiro, tabelas, colunas e operadores vêm de allowlists tipadas — o TypeScript nem compila se alguém tentar passar `password_hash` como coluna. Segundo, o Zod rejeita qualquer valor que não passe no schema antes de tocar qualquer lógica. Terceiro, a query usa apenas placeholders `$1, $2…` — o valor do usuário nunca é concatenado na string SQL, mesmo que os dois primeiros controles falhassem. Metacaracteres do `LIKE` (`%`, `_`, `\`) são escapados automaticamente.

**A01 — Broken Access Control**
O middleware `authenticate` bloqueia toda requisição sem `Bearer` token. O stub está documentado para ser substituído por `jsonwebtoken.verify` com o seu IdP real (Auth0, Cognito, Keycloak etc.).

**A04 — Insecure Design / Resource Exhaustion**
Rate limiting de 60 req/min por IP via `express-rate-limit`. Máximo de 10 filtros e 100 itens por página validados pelo Zod. Body limitado a 16 kb pelo Express.

**A05 — Security Misconfiguration**
`helmet()` configura automaticamente `Content-Security-Policy`, `X-Frame-Options`, `HSTS` e outros headers HTTP defensivos em todas as rotas.

**A02 — Credenciais expostas**
Nenhuma string de conexão hardcoded. O pool exige variáveis de ambiente e lança erro explícito se alguma estiver ausente.

**A09 — Logging inadequado**
O handler global captura e loga o erro real internamente, mas retorna ao cliente apenas `"Erro interno ao processar a busca"` — sem stack trace, sem detalhes de tabela/query.

**`search.test.ts`** — testes unitários isolados que verificam exatamente os vetores de ataque: tentativa de SQL injection via valor do usuário, coluna fora da allowlist, operador inválido e wildcard injection via `LIKE`.

---

## Como usar

```bash
# Instalar dependências
npm install

# Rodar localmente (com .env preenchido)
DB_HOST=localhost DB_PORT=5432 DB_NAME=mydb DB_USER=app DB_PASSWORD=secret npm run dev

# Testes
npm test
```

**Exemplo de requisição:**
```
GET /api/search/users?filters=[{"column":"status","operator":"eq","value":"active"},{"column":"name","operator":"ilike","value":"joão"}]&sort_by=created_at&sort_dir=desc&page=1&page_size=20
Authorization: Bearer <token>
```