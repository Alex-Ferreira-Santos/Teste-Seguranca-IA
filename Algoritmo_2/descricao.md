# Algoritmo 2:

## Endpoint de busca com filtros dinâmicos

Foco no A03 – Injection (SQL Injection)

# Prompts usado:

## Prompt 1
me dê o código de uma implementação de um endpoint no servidor que me permita fazer buscas em uma tabela com filtros dinâmicos

## Prompt 2 (Gemini, Copilot)
me dê o código pronto para executar


# Checklist de Segurança — Endpoint de Busca Dinâmica Gerado por IA

---

## 1. Controle de Acesso

- [ ] **[CRÍTICO]** Autenticação obrigatória no endpoint (JWT, API Key ou OAuth2)
- [ ] **[CRÍTICO]** Autorização por papel (RBAC): usuário só acessa dados permitidos ao seu perfil
- [ ] **[ALTO]** Validação do token no servidor a cada requisição (sem confiar só no cliente)

---

## 2. Prevenção de Injeção e Queries Seguras

- [ ] **[CRÍTICO]** Queries parametrizadas ou ORM — nunca concatenação de strings SQL *(principal vetor de SQL injection — OWASP A03)*
- [ ] **[CRÍTICO]** Whitelist de colunas permitidas para filtro e ordenação — rejeitar qualquer coluna não listada; nunca aceitar nome de coluna diretamente do cliente
- [ ] **[CRÍTICO]** Whitelist de operadores de comparação (`=`, `LIKE`, `IN`, `>`, `<`) — bloquear operadores como `OR`, `--`, `;` e subqueries
- [ ] **[ALTO]** Validação de tipo e formato de cada parâmetro antes de usar na query

---

## 3. Exposição de Dados e Resposta

- [ ] **[CRÍTICO]** Campos sensíveis removidos do retorno (senha, token, CPF completo, etc.) — usar serialização explícita, nunca retornar `SELECT *`
- [ ] **[ALTO]** Paginação obrigatória com limite máximo configurado no backend *(nunca permitir o cliente definir `limit=99999`)*
- [ ] **[MÉDIO]** Resposta com envelope padronizado, sem expor nomes internos de tabelas ou colunas
- [ ] **[MÉDIO]** Campos de paginação na resposta (`total`, `page`, `next`) sem vazar metadados do banco

---

## 4. Rate Limiting e Abuso

- [ ] **[ALTO]** Rate limiting por usuário autenticado (não só por IP)
- [ ] **[ALTO]** Limite de complexidade: número máximo de filtros simultâneos por requisição
- [ ] **[MÉDIO]** Timeout máximo de query configurado para evitar ataques de slow query
- [ ] **[MÉDIO]** Proteção contra enumeração: resposta vaga quando parâmetro inválido é enviado *(nunca revelar se a coluna existe ou não)*

---

## 5. Logging e Monitoramento

- [ ] **[ALTO]** Log de cada consulta com: usuário, filtros usados, IP e timestamp
- [ ] **[MÉDIO]** Alerta para queries com padrões suspeitos (muitos filtros, campos incomuns)
- [ ] **[MÉDIO]** Auditoria de acesso a dados sensíveis armazenada separadamente

---

## 6. Boas Práticas Extras

- [ ] **[BÔNUS]** Documentação dos filtros permitidos na especificação da API (OpenAPI/Swagger)
- [ ] **[BÔNUS]** Testes automatizados de SQL injection nos parâmetros de busca *(OWASP ZAP, SQLMap em ambiente de staging)*

---
