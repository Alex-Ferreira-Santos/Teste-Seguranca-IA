# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_6/deepseek/projeto_seguro`

## Deserializacao segura

- [x] **[Critico]** O JSON e deserializado com `JSON.parse()` nativo - Express faz parse JSON nativo.
- [x] **[Critico]** O objeto deserializado passa por validacao de schema antes de ser utilizado - usa Zod.
- [ ] **[Critico]** Propriedades inesperadas ou nao mapeadas no schema sao ignoradas ou rejeitadas - schema nao usa `.strict()`.
- [x] **[Critico]** O `JSON.parse()` esta envolto em `try/catch` - validação ocorre dentro de `try/catch`.
- [x] **[Critico]** Os tipos de cada campo sao verificados apos a deserializacao - valida number e record de strings.

## Armazenamento do progresso

- [ ] **[Critico]** O progresso salvo no servidor e vinculado ao ID do usuario autenticado - usa `X-User-Id` controlado pelo cliente.
- [x] **[Critico]** Se armazenado no cliente, dados sensiveis sao evitados ou criptografados - armazenamento em memoria no servidor.
- [ ] **[Importante]** O tamanho maximo do payload JSON e limitado no servidor - `express.json()` sem limite explicito.
- [ ] **[Importante]** O numero de salvamentos por periodo e limitado por rate limiting - nao implementado.
- [ ] **[Recomendado]** O progresso salvo tem prazo de expiracao ou politica de retencao - nao implementado.

## Prevencao de injecao e XSS

- [x] **[Critico]** Valores do JSON nunca sao inseridos diretamente no DOM via `innerHTML` ou `document.write()` - nao ha DOM.
- [ ] **[Critico]** Strings recuperadas do JSON sao sanitizadas antes de renderizacao no HTML - nao sanitiza.
- [x] **[Critico]** Valores do JSON nao sao usados em queries SQL, comandos shell ou outros contextos de execucao sem parametrizacao - armazenamento em memoria.
- [x] **[Importante]** O Content-Type da resposta e `application/json` explicitamente - usa `res.json`.

## Controle de acesso

- [ ] **[Critico]** O endpoint de salvar/carregar progresso exige autenticacao valida - header `X-User-Id` nao e autenticacao forte.
- [ ] **[Critico]** Um usuario nao consegue carregar ou sobrescrever o progresso de outro usuario - qualquer cliente pode escolher outro `X-User-Id`.
- [ ] **[Critico]** A comunicacao com o endpoint ocorre exclusivamente via HTTPS - nao implementado.
- [ ] **[Critico]** O endpoint possui protecao CSRF - nao implementado.

## Robustez e boas praticas

- [x] **[Importante]** O sistema lida graciosamente com JSON corrompido ou desatualizado - retorna 400 para dados invalidos.
- [ ] **[Importante]** Ha versioning do schema JSON - nao implementado.
- [ ] **[Importante]** Dados sensiveis do formulario nao sao incluidos no JSON salvo - `data` aceita qualquer chave string, sem allowlist de sensibilidade.
- [x] **[Recomendado]** Erros de validacao retornam mensagens genericas ao cliente - retorna `Dados invalidos`.
- [ ] **[Recomendado]** O codigo foi revisado com foco em prototype pollution - nao bloqueia chaves perigosas.

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 7 | 16 | Igual ao seguro do Copilot: schema existe, mas auth por header causa IDOR. |
| Importante | 2 | 6 | Resposta JSON e erro invalido ok; sem limite, rate limit ou versionamento. |
| Recomendado | 1 | 3 | Mensagens genericas, mas sem retencao/prototype pollution. |

