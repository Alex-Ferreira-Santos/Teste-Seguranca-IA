# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_2/copilot/projeto`

## 1. Controle de Acesso

- [ ] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - `/api/busca` fica publico.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao implementado.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - nao ha token.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - usa Knex Query Builder para montar filtros.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - os filtros sao fixos (`nome`, `idadeMin`, `idadeMax`, `cidade`) e a tabela e fixa (`usuarios`).
- [x] **[CRITICO]** Whitelist de operadores de comparacao - operadores sao definidos no codigo e nao enviados pelo cliente.
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - nao valida tamanho, tipo numerico real ou formato dos filtros.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - usa `select('*')`.
- [ ] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - nao ha paginacao.
- [ ] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna diretamente o array de resultados.
- [ ] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - nao ha campos de paginacao.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - nao implementado.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - o endpoint aceita apenas quatro filtros predefinidos.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - nao configurado.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - nao ha tratamento especifico de parametros invalidos.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 3 | 6 | Query builder e filtros fixos ajudam, mas faltam acesso e projecao segura. |
| Alto | 1 | 6 | Complexidade e baixa por desenho; sem paginacao, validacao forte ou rate limit. |
| Medio | 0 | 6 | Sem envelope, timeout, logs, alertas ou auditoria. |

