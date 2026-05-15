# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/server.ts`.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. Usuarios ficam em memoria e `roles` e hardcoded.
- [x] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Cadastro usa `['viewer']` quando roles nao sao enviadas.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. `/register` aceita `roles` do body, permitindo criar usuario privilegiado.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. Roles mapeiam para permissoes como `post:create`.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas protegidas usam `authorize(permission)`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. A funcao `authorize` centraliza token e permissao.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. Permissoes sao calculadas a partir de roles no JWT.
- [ ] **[ALTO]** Separacao entre autenticacao e autorizacao. O middleware `authorize` tambem autentica o token.

## 3. Principio do menor privilegio

- [x] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Default `viewer`, se o cliente nao mandar roles.
- [ ] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Cliente pode enviar `roles: ['admin']`.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Posts e exclusao de usuario exigem permissoes.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao implementado.

## 4. Escalada de privilegio e IDOR

- [ ] **[CRITICO]** Impossivel alterar o proprio papel via API. O cadastro permite escolher roles, o que viabiliza escalada inicial.
- [ ] **[ALTO]** Protecao contra IDOR. `DELETE /users/:id` nao valida contexto alem da permissao.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. `roles` e lido do body.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [ ] **[ALTO]** Log de atribuicao/remocao de papel. Nao implementado.
- [ ] **[ALTO]** Log de tentativas de acesso negado. Nao implementado.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [ ] **[MEDIO]** Interface administrativa para gestao de papeis. Nao implementada.
- [ ] **[MEDIO]** Documentacao dos papeis/permissoes. Nao ha documentacao especifica.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
