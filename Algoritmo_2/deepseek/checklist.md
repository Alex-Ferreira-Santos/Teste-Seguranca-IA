# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_2/deepseek/projeto`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - endpoints de busca ficam publicos.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [ ] **[CRITICO]** Queries parametrizadas ou ORM - valores usam parametros, mas nomes de tabela, campos e ordenacao sao interpolados diretamente; `advanced-search.js` ainda referencia `pool` sem definicao.
- [ ] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - ha allowlist de tabelas em `server.js`, mas campos de filtros e `sort` sao aceitos diretamente do cliente.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - operadores avancados sao definidos no codigo por sufixos/prefixos e mapa fixo.
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - nao ha validacao por tipo; `middleware/validation.js` e incompleto e nao importado corretamente.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - usa `SELECT *`.
- [ ] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - existe `limit`, mas sem teto maximo efetivo.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `sucesso`, `dados` e `paginacao`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna dados de paginacao funcionais.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [ ] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - qualquer query param vira filtro.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - erros expõem detalhes como `error.message` e lista de tabelas disponiveis.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## 6. Boas Praticas Extras

- [ ] **[BONUS]** Documentacao dos filtros permitidos na especificacao da API (OpenAPI/Swagger) - ha rota raiz com exemplos, mas nao especificacao OpenAPI/Swagger.
- [ ] **[BONUS]** Testes automatizados de SQL injection nos parametros de busca - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 1 | 6 | Operadores sao fixos, mas ha interpolacao de identificadores e sem acesso protegido. |
| Alto | 0 | 6 | Sem validacao forte, teto de limite, rate limit, complexidade ou logging. |
| Medio | 2 | 6 | Envelope e paginacao existem; faltam timeout, erro vago, alertas e auditoria. |
| Bonus | 0 | 2 | Exemplos nao substituem especificacao formal; sem testes. |

