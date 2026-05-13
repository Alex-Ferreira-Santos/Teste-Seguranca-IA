# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_2/chatGPT/projeto`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - a rota `GET /users` nao possui middleware de autenticacao.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao ha usuario autenticado nem regra de autorizacao.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token a validar.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa Prisma Client em `users.service.ts`, sem concatenacao manual de SQL.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - o schema Zod aceita apenas filtros previstos e `orderBy` enumera `name`, `email`, `age`, `createdAt`.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - os operadores nao sao recebidos do cliente; o codigo aplica apenas `contains`, igualdade e faixa numerica predefinidos.
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - ha coercoes com Zod, mas sem limites de tamanho, inteiros positivos ou faixa para `page`, `limit`, `minAge` e `maxAge`.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - `findMany` nao usa `select`, entao retorna todos os campos do modelo.
- [ ] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - existe paginacao, mas `limit` vem do cliente sem teto maximo.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `{ data, pagination }`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna apenas totais e paginas calculadas.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - os filtros possiveis sao fixos no schema da rota.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao ha timeout configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - erros de validacao do Zod nao sao tratados de forma padronizada/generica na rota.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado.
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
| Critico | 3 | 6 | Usa Prisma e allowlists, mas nao tem controle de acesso nem projecao segura. |
| Alto | 1 | 6 | Apenas a complexidade e limitada pelo formato fixo dos filtros. |
| Medio | 2 | 6 | Envelope e paginacao estao presentes; faltam timeout, logging, alerta e protecao de erro. |
| Bonus | 0 | 2 | Sem documentacao formal ou testes de injecao. |

