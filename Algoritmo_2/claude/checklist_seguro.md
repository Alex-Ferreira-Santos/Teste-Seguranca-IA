# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_2/claude/projeto_seguro`

## 1. Controle de Acesso

- [x] **[CRITICO]** Autenticacao obrigatoria no endpoint (JWT, API Key ou OAuth2) - a rota exige header `Authorization: Bearer`.
- [ ] **[CRITICO]** Autorizacao por papel (RBAC): usuario so acessa dados permitidos ao seu perfil - nao ha papel, escopo ou filtro por usuario.
- [ ] **[ALTO]** Validacao do token no servidor a cada requisicao - o middleware apenas checa formato/tamanho e possui TODO para verificar assinatura JWT.

---

## 2. Prevencao de Injecao e Queries Seguras

- [x] **[CRITICO]** Queries parametrizadas ou ORM - valores usam placeholders `$N` e `pg`.
- [x] **[CRITICO]** Whitelist de colunas permitidas para filtro e ordenacao - Zod limita colunas a `ALLOWED_COLUMNS`.
- [x] **[CRITICO]** Whitelist de operadores de comparacao - Zod limita operadores a `eq`, `neq`, `lt`, `lte`, `gt`, `gte`, `like`, `ilike`.
- [ ] **[ALTO]** Validacao de tipo e formato de cada parametro antes de usar na query - valida string e tamanho, mas nao valida tipo conforme coluna.

---

## 3. Exposicao de Dados e Resposta

- [ ] **[CRITICO]** Campos sensiveis removidos do retorno - a query usa `SELECT *`.
- [x] **[ALTO]** Paginacao obrigatoria com limite maximo configurado no backend - `page_size` tem maximo 100.
- [x] **[MEDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas - retorna `data` e `pagination`.
- [x] **[MEDIO]** Campos de paginacao na resposta (`total`, `page`, `next`) sem vazar metadados do banco - retorna apenas metadados funcionais de paginacao.

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuario autenticado - usa `express-rate-limit` por IP, nao por usuario.
- [x] **[ALTO]** Limite de complexidade: numero maximo de filtros simultaneos por requisicao - `filters` tem maximo 10.
- [ ] **[MEDIO]** Timeout maximo de query configurado para evitar ataques de slow query - ha timeouts de conexao/idle no pool, mas nao timeout maximo da query.
- [ ] **[MEDIO]** Protecao contra enumeracao: resposta vaga quando parametro invalido e enviado - respostas de validacao expõem tabela permitida e detalhes de campos invalidos.

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuario, filtros usados, IP e timestamp - nao implementado; apenas erros sao logados.
- [ ] **[MEDIO]** Alerta para queries com padroes suspeitos - nao implementado.
- [ ] **[MEDIO]** Auditoria de acesso a dados sensiveis armazenada separadamente - nao implementado.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 4 | 6 | Boa protecao contra injecao; faltam RBAC e projecao segura. |
| Alto | 2 | 6 | Pagina e limita filtros, mas token e rate limit ainda sao fracos. |
| Medio | 2 | 6 | Envelope ok; faltam timeout, erro vago, auditoria e alertas. |

