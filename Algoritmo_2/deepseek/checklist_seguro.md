# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_2/deepseek/projeto_seguro`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `/api/search/:tableName` nao exige autenticacao.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - valores sao enviados como parametros ao driver.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - `ALLOWED_FIELDS` e `allowedTables` limitam campos e tabelas.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - `FilterOperator` enumera operadores aceitos.
- [x] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - valida pagina, limite, campo, operador, tamanho de arrays e tipos conhecidos.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - usa `SELECT *`.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `MAX_LIMIT = 100` e `MAX_PAGE = 1000`.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna objeto com `data`, `total`, `page`, `limit`, `totalPages`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna apenas contadores funcionais.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - rate limiting e por IP em memoria, nao por usuario autenticado.
- [ ] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - nao limita diretamente o numero total de filtros.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [x] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - usa mensagens genericas como `Invalid table name` e `Internal server error`.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - registra tabela, IP e quantidade de filtros, mas nao usuario/timestamp e nao ha autenticacao.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 6 | Boa allowlist/parametrizacao, mas sem acesso e com `SELECT *`. |
| Alto | 2 | 6 | Valida tipos e pagina; faltam token, rate limit por usuario, complexidade e logging completo. |
| Medio | 3 | 6 | Envelope, paginacao e erros genericos existem; sem timeout, alerta ou auditoria. |

