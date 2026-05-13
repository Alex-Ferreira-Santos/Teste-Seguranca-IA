# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_6/claude/projeto_seguro`

## Deserializacao segura

- [x] **[Critico]** O JSON e deserializado com `JSON.parse()` nativo - Express faz parse JSON nativo e o service usa `JSON.parse` para dados do banco.
- [x] **[Critico]** O objeto deserializado passa por validacao de schema antes de ser utilizado - usa Zod em body/params.
- [x] **[Critico]** Propriedades inesperadas ou nao mapeadas no schema sao ignoradas ou rejeitadas - valida `formId`, allowed fields e limite de campos.
- [x] **[Critico]** O `JSON.parse()` esta envolto em `try/catch` - `deserializeFields` captura parse invalido.
- [x] **[Critico]** Os tipos de cada campo sao verificados apos a deserializacao - Zod permite apenas string/number/boolean/null e valida timestamps.

## Armazenamento do progresso

- [x] **[Critico]** O progresso salvo no servidor e vinculado ao ID do usuario autenticado - usa `userId` do JWT, nao do cliente.
- [x] **[Critico]** Se armazenado no cliente, dados sensiveis sao evitados ou criptografados - hook filtra primitivos e servidor armazena por usuario; nao usa localStorage.
- [x] **[Importante]** O tamanho maximo do payload JSON e limitado no servidor - `express.json({ limit: '64kb' })`.
- [x] **[Importante]** O numero de salvamentos por periodo e limitado por rate limiting - `progressRateLimiter`.
- [ ] **[Recomendado]** O progresso salvo tem prazo de expiracao ou politica de retencao - schema Prisma nao tem expiração/retencao.

## Prevencao de injecao e XSS

- [x] **[Critico]** Valores do JSON nunca sao inseridos diretamente no DOM via `innerHTML` ou `document.write()` - hook nao renderiza DOM.
- [ ] **[Critico]** Strings recuperadas do JSON sao sanitizadas antes de renderizacao no HTML - valida/limita strings, mas nao sanitiza para HTML.
- [x] **[Critico]** Valores do JSON nao sao usados em queries SQL, comandos shell ou outros contextos de execucao sem parametrizacao - usa Prisma.
- [x] **[Importante]** O Content-Type da resposta e `application/json` explicitamente - Express `res.json`.

## Controle de acesso

- [x] **[Critico]** O endpoint de salvar/carregar progresso exige autenticacao valida - `requireAuth`.
- [x] **[Critico]** Um usuario nao consegue carregar ou sobrescrever o progresso de outro usuario - indice composto `userId_formId` e filtros por `userId`.
- [ ] **[Critico]** A comunicacao com o endpoint ocorre exclusivamente via HTTPS - HSTS/upgrade-insecure-requests existem, mas nao ha redirecionamento HTTP para HTTPS.
- [ ] **[Critico]** O endpoint possui protecao CSRF - usa Authorization Bearer; nao ha token CSRF/Origin check especifico.

## Robustez e boas praticas

- [x] **[Importante]** O sistema lida graciosamente com JSON corrompido ou desatualizado - retorna erro generico no service.
- [ ] **[Importante]** Ha versioning do schema JSON - nao ha campo `version` no payload validado.
- [x] **[Importante]** Dados sensiveis do formulario nao sao incluidos no JSON salvo - allowlist por formulario evita campos fora do esperado.
- [ ] **[Recomendado]** Erros de validacao retornam mensagens genericas ao cliente - retorna `details` com mensagens Zod.
- [ ] **[Recomendado]** O codigo foi revisado com foco em prototype pollution - restringe chaves por regex/allowlist, mas nao bloqueia explicitamente `__proto__` se couber no record antes da allowlist; a lógica de `superRefine` parece depender de contexto interno frágil.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 13 | 16 | Excelente schema, auth e IDOR; faltam HTTPS/CSRF e sanitizacao HTML de strings. |
| Importante | 5 | 6 | Limite/rate limit/tratamento existem; falta versionamento do payload. |
| Recomendado | 0 | 3 | Sem retencao, mensagens genericas completas ou bloqueio explicito de prototype pollution. |

