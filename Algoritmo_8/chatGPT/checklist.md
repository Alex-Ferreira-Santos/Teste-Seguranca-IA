# Checklist - projeto

Analise baseada em `projeto/server.js`, `projeto/data/users.js`, `projeto/middleware/auth.js`, `projeto/middleware/authorize.js` e `projeto/routes/posts.js`.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. O projeto usa dados mockados em `data/users.js`.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Nao ha fluxo de cadastro.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. O middleware confia nas permissoes embutidas no JWT, sem revalidar no servidor.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. Usuarios possuem `roles` e `permissions`.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. As rotas de posts usam `auth` e `authorize`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `authorize(permission)` e aplicado nas rotas.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. O JWT carrega permissoes e e aceito diretamente.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Existem middlewares separados.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Nao ha cadastro.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Nao ha endpoint de cadastro.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Criar, editar e excluir posts exigem permissoes especificas.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao ha mecanismo ou documentacao.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. Nao existe rota de alteracao de papel.
- [ ] **[ALTO]** Protecao contra IDOR. Edicao/exclusao de posts nao verifica dono do recurso.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. O sistema confia no JWT com permissoes.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [ ] **[ALTO]** Log de atribuicao/remocao de papel. Nao ha gestao de papeis nem auditoria.
- [ ] **[ALTO]** Log de tentativas de acesso negado. `authorize` retorna 403, mas nao registra log.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [ ] **[MEDIO]** Interface administrativa para gestao de papeis. Nao implementada.
- [ ] **[MEDIO]** Documentacao dos papeis/permissoes. Nao ha documentacao no projeto.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
