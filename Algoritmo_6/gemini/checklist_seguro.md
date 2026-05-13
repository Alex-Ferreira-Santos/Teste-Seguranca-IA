# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_6/gemini/projeto_seguro`

## Deserializacao segura

- [x] **[Critico]** O JSON e deserializado com `JSON.parse()` nativo - Express faz parse JSON nativo.
- [x] **[Critico]** O objeto deserializado passa por validacao de schema antes de ser utilizado - usa Zod `FormProgressSchema`.
- [x] **[Critico]** Propriedades inesperadas ou nao mapeadas no schema sao ignoradas ou rejeitadas - schema usa `.strict()`.
- [x] **[Critico]** O `JSON.parse()` esta envolto em `try/catch` - rota `POST /save` envolve parse/validacao em `try/catch`.
- [x] **[Critico]** Os tipos de cada campo sao verificados apos a deserializacao - valida UUID, number, object, boolean e datetime.

## Armazenamento do progresso

- [ ] **[Critico]** O progresso salvo no servidor e vinculado ao ID do usuario autenticado - aceita `userId` no body, controlado pelo cliente.
- [x] **[Critico]** Se armazenado no cliente, dados sensiveis sao evitados ou criptografados - armazenamento fica em memoria no servidor.
- [x] **[Importante]** O tamanho maximo do payload JSON e limitado no servidor - `express.json({ limit: '10kb' })`.
- [ ] **[Importante]** O numero de salvamentos por periodo e limitado por rate limiting - nao implementado.
- [ ] **[Recomendado]** O progresso salvo tem prazo de expiracao ou politica de retencao - nao implementado.

## Prevencao de injecao e XSS

- [x] **[Critico]** Valores do JSON nunca sao inseridos diretamente no DOM via `innerHTML` ou `document.write()` - nao ha DOM.
- [ ] **[Critico]** Strings recuperadas do JSON sao sanitizadas antes de renderizacao no HTML - `trim`/Zod valida formato, mas nao sanitiza para HTML.
- [x] **[Critico]** Valores do JSON nao sao usados em queries SQL, comandos shell ou outros contextos de execucao sem parametrizacao - armazenamento em `Map`.
- [x] **[Importante]** O Content-Type da resposta e `application/json` explicitamente - usa `res.json`.

## Controle de acesso

- [ ] **[Critico]** O endpoint de salvar/carregar progresso exige autenticacao valida - nao ha autenticação.
- [ ] **[Critico]** Um usuario nao consegue carregar ou sobrescrever o progresso de outro usuario - `GET /load/:userId` permite escolher qualquer UUID.
- [ ] **[Critico]** A comunicacao com o endpoint ocorre exclusivamente via HTTPS - nao implementado.
- [ ] **[Critico]** O endpoint possui protecao CSRF - nao implementado.

## Robustez e boas praticas

- [x] **[Importante]** O sistema lida graciosamente com JSON corrompido ou desatualizado - erros Zod retornam 400.
- [ ] **[Importante]** Ha versioning do schema JSON - nao ha campo `version`.
- [x] **[Importante]** Dados sensiveis do formulario nao sao incluidos no JSON salvo - schema limita a nome, e-mail e bio; nao inclui CPF/cartao.
- [ ] **[Recomendado]** Erros de validacao retornam mensagens genericas ao cliente - retorna `errors` com path e mensagens do Zod.
- [x] **[Recomendado]** O codigo foi revisado com foco em prototype pollution - `.strict()` rejeita chaves extras fora do schema.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 9 | 16 | Valida bem o JSON, mas userId controlado pelo cliente gera IDOR e falta auth/CSRF/HTTPS. |
| Importante | 4 | 6 | Limite, JSON response, tratamento e minimizacao existem; falta rate limit/versionamento. |
| Recomendado | 1 | 3 | `.strict()` ajuda contra prototype pollution; falta retencao e erro generico. |

