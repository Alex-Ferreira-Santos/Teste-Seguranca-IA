# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_2/claude/projeto`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `/api/search` fica publico.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - valores dos filtros usam placeholders `$N` no `pg`.
- [ ] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - tabela tem allowlist, mas `fields`, filtros e `sort` aceitam qualquer nome que passe em regex.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - operadores sao derivados de prefixos fixos em `parseOperator`.
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - ha regex para identificadores, mas nao validacao por tipo de coluna.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - `fields=*` e campos escolhidos pelo cliente podem expor dados sensiveis.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `limit` e limitado a 100.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `data` e `pagination`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna totais e paginas calculadas.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [ ] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - qualquer parametro nao reservado vira filtro.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - erro de tabela informa o nome rejeitado e que a tabela nao e permitida.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## 6. Boas Praticas Extras

- [ ] **[BONUS]** Documentacao dos filtros permitidos na especificacao da API (OpenAPI/Swagger) - comentarios documentam parametros, mas nao ha especificacao OpenAPI/Swagger.
- [ ] **[BONUS]** Testes automatizados de SQL injection nos parametros de busca - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 2 | 6 | Parametriza valores, mas permite colunas/campos dinamicos e nao tem acesso protegido. |
| Alto | 1 | 6 | O limite de paginacao existe; faltam validacao forte e controles de abuso. |
| Medio | 2 | 6 | Envelope e paginacao ok; sem timeout, alertas, auditoria ou erro vago. |
| Bonus | 0 | 2 | Sem especificacao formal ou testes de injecao. |

