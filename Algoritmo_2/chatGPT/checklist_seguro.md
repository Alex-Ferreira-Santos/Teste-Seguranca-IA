# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_2/chatGPT/projeto_seguro`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `POST /users/search` nao exige autenticacao.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao ha RBAC ou escopo por usuario.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token a validar.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa Prisma Client em `routes/users.ts`.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - `allowedFields` e `allowedOrderFields` limitam campos aceitos.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - Zod limita operadores a `eq`, `contains`, `gt`, `gte`, `lt`, `lte` e `in`.
- [x] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - valida tipos por campo em `validateValueType` e limita strings a 255 caracteres.

---

## 3. Exposicao de Dados e Resposta

- [x] **[CRITICO]** Campos sensiveis removidos do retorno - usa `select` explicito para retornar somente `id`, `name`, `email`, `age`, `status` e `createdAt`.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `limit` tem `.min(1).max(100).default(20)`.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `{ data, pagination }`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna contadores calculados, sem detalhes internos do banco.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - ha `express-rate-limit`, mas global por IP e sem usuario autenticado.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - `filters` tem `.max(20)`.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao ha timeout de query configurado.
- [x] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - a rota responde `Invalid search request` em falhas de validacao.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado; apenas erros sao registrados.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 6 | Forte contra SQL injection e exposicao basica, mas sem autenticacao/RBAC. |
| Alto | 3 | 6 | Valida entrada, pagina e limita filtros; falta rate limit por usuario, token e logging. |
| Medio | 3 | 6 | Boa resposta generica e envelope; faltam timeout, alertas e auditoria. |

