# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_2/gemini/projeto_seguro`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `/users/search` fica publico.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa Prisma Client e transacao.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - schema Zod aceita apenas `name` e `role`; nao ha ordenacao dinamica recebida do cliente.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - operadores sao fixos no codigo (`contains` para nome e igualdade para `role`).
- [x] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - Zod valida `role`, `page` e `limit` com limites.

---

## 3. Exposicao de Dados e Resposta

- [x] **[CRITICO]** Campos sensiveis removidos do retorno - `select` omite `password_hash`.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `limit` tem maximo 50.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `metadata` e `results`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna somente metadados de paginacao calculados.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - o endpoint aceita apenas dois filtros opcionais.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - erros Zod retornam detalhes de validacao ao cliente.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - logger do Fastify existe, mas nao ha log estruturado de cada consulta com usuario/filtros/IP/timestamp.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 6 | Prisma, filtros fixos e `select` explicito; sem autenticacao/RBAC. |
| Alto | 3 | 6 | Valida entrada, pagina e limita complexidade; faltam token, rate limit e logging. |
| Medio | 2 | 6 | Envelope e paginacao ok; faltam timeout, erro vago, alerta e auditoria. |

