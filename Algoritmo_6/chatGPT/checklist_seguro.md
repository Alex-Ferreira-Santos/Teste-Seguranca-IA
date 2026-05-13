# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_6/chatGPT/projeto_seguro`

## Deserializacao segura

- [x] **[Critico]** O JSON e deserializado com `JSON.parse()` nativo - Fastify faz parse nativo do body JSON.
- [x] **[Critico]** O objeto deserializado passa por validacao de schema antes de ser utilizado - `formSchema.safeParse`.
- [x] **[Critico]** Propriedades inesperadas ou nao mapeadas no schema sao ignoradas ou rejeitadas - schema usa `.strict()`.
- [x] **[Critico]** O `JSON.parse()` esta envolto em `try/catch` - parse do body e tratado pelo framework; validacao falha retorna 400.
- [x] **[Critico]** Os tipos de cada campo sao verificados apos a deserializacao - Zod valida strings e boolean.

## Armazenamento do progresso

- [x] **[Critico]** O progresso salvo no servidor e vinculado ao ID do usuario autenticado - usa `request.user.id` extraido do JWT.
- [x] **[Critico]** Se armazenado no cliente, dados sensiveis sao evitados ou criptografados - progresso e salvo no servidor; nao usa localStorage.
- [x] **[Importante]** O tamanho maximo do payload JSON e limitado no servidor - `bodyLimit: 1_000_000`.
- [x] **[Importante]** O numero de salvamentos por periodo e limitado por rate limiting - `@fastify/rate-limit` com 100/min.
- [x] **[Recomendado]** O progresso salvo tem prazo de expiracao ou politica de retencao - define `expiresAt` para 30 dias.

## Prevencao de injecao e XSS

- [x] **[Critico]** Valores do JSON nunca sao inseridos diretamente no DOM via `innerHTML` ou `document.write()` - nao ha renderizacao de DOM no servidor.
- [ ] **[Critico]** Strings recuperadas do JSON sao sanitizadas antes de renderizacao no HTML - remove chaves perigosas, mas nao sanitiza strings para HTML.
- [x] **[Critico]** Valores do JSON nao sao usados em queries SQL, comandos shell ou outros contextos de execucao sem parametrizacao - usa Prisma/upsert sem SQL manual.
- [x] **[Importante]** O Content-Type da resposta e `application/json` explicitamente - Fastify responde JSON via `reply.send`.

## Controle de acesso

- [x] **[Critico]** O endpoint de salvar/carregar progresso exige autenticacao valida - `authMiddleware` em `preHandler`.
- [x] **[Critico]** Um usuario nao consegue carregar ou sobrescrever o progresso de outro usuario - queries usam `userId: request.user.id`.
- [ ] **[Critico]** A comunicacao com o endpoint ocorre exclusivamente via HTTPS - Helmet existe, mas nao ha enforcement/redirecionamento HTTPS.
- [ ] **[Critico]** O endpoint possui protecao CSRF - usa Bearer JWT, mas nao valida CSRF/Origin.

## Robustez e boas praticas

- [x] **[Importante]** O sistema lida graciosamente com JSON corrompido ou desatualizado - payload invalido retorna 400.
- [x] **[Importante]** Ha versioning do schema JSON - salva `formVersion: 1`.
- [x] **[Importante]** Dados sensiveis do formulario nao sao incluidos no JSON salvo - schema limita a nome, endereco e newsletter; nao inclui CPF/cartao.
- [ ] **[Recomendado]** Erros de validacao retornam mensagens genericas ao cliente - retorna `parsed.error.flatten()` com detalhes do schema.
- [x] **[Recomendado]** O codigo foi revisado com foco em prototype pollution - `sanitizeObject` remove `__proto__`, `constructor` e `prototype`.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 12 | 16 | Forte em schema/auth/IDOR; faltam HTTPS, CSRF e sanitizacao HTML das strings. |
| Importante | 6 | 6 | Limite, rate limit, versionamento, retenção e tratamento de erro existem. |
| Recomendado | 2 | 3 | Bloqueia prototype pollution e expira dados, mas expõe detalhes de validação. |

