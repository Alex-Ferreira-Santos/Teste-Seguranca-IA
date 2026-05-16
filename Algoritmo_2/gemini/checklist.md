# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_2/gemini/projeto`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `/produtos` fica publico.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa Sequelize e operadores `Op`.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - os filtros sao fixos (`nome`, `categoria`, `preco_min`, `preco_max`) e nao ha ordenacao dinamica.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - operadores sao definidos no codigo (`like`, igualdade, `gte`, `lte`).
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - `parseFloat` pode gerar `NaN` e nao ha validacao de tamanho/formato.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - `findAll` retorna todos os campos do modelo.
- [ ] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - nao ha paginacao.
- [ ] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna diretamente o array de produtos.
- [ ] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - nao ha paginacao.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - o endpoint aceita apenas quatro filtros predefinidos.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - erros retornam `error.message`.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 6 | ORM e filtros fixos reduzem injecao, mas sem acesso e sem projecao explicita. |
| Alto | 1 | 6 | Complexidade e limitada pelo endpoint simples; faltam validacao, paginacao e rate limit. |
| Medio | 0 | 6 | Sem envelope, timeout, logging, alerta ou auditoria. |

