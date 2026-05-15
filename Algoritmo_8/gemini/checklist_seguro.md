# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/server.ts`.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. `ROLE_PERMISSIONS` e hardcoded.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Nao ha cadastro nem atribuicao default.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. `/login` aceita `role` no body e assina o token com esse valor.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. Roles mapeiam para `read:data`, `write:data`, `delete:data`.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas usam `authenticateToken` e `authorize`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. Cada rota exige uma permissao.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. Nao ha banco; o token contem o role.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Middlewares separados.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Nao ha cadastro.
- [ ] **[CRITICO]** Papel alto privilegio nao acessivel via fluxo normal de cadastro/login. Cliente pode pedir `ADMIN` no login simulado.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Leitura, escrita e exclusao usam permissoes distintas.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao implementado.

## 4. Escalada de privilegio e IDOR

- [ ] **[CRITICO]** Impossivel alterar o proprio papel via API. O login permite escolher o papel assinado no token.
- [ ] **[ALTO]** Protecao contra IDOR. Nao ha validacao de ownership.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. `role` vem do body.
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
