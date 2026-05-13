# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_2/copilot/projeto_seguro`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `POST /search` fica publico.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - valores usam placeholders no `pg`.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - `allowedFilters` limita filtros e a ordenacao e fixa por `created_at`.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - aceita apenas igualdade para filtros.
- [x] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - Zod valida `filters`, `limit` e `offset`, com limites numericos.

---

## 3. Exposicao de Dados e Resposta

- [x] **[CRITICO]** Campos sensiveis removidos do retorno - seleciona explicitamente `id`, `name`, `email`, `status`, `created_at`.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `limit` tem maximo 100 e `offset` minimo 0.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `{ data }`.
- [ ] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - nao retorna total, pagina atual ou proximo item.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [ ] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - nao limita a quantidade de chaves em `filters`.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [x] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - falhas retornam `Requisicao invalida`.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado; apenas erros sao logados.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## 6. Boas Praticas Extras

- [ ] **[BONUS]** Documentacao dos filtros permitidos na especificacao da API (OpenAPI/Swagger) - nao implementado.
- [ ] **[BONUS]** Testes automatizados de SQL injection nos parametros de busca - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 6 | Bom uso de parametros, allowlist e select explicito; sem autenticacao/RBAC. |
| Alto | 2 | 6 | Valida entrada e limita pagina, mas faltam token, rate limit e complexidade. |
| Medio | 2 | 6 | Resposta generica e envelope simples; sem metadados completos, timeout ou auditoria. |
| Bonus | 0 | 2 | Sem documentacao formal ou testes. |

