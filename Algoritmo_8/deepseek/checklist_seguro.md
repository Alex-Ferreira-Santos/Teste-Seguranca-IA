# Checklist - projeto_seguro

Analise baseada em entidades TypeORM, `src/config/permissions.ts`, `src/middlewares/auth.ts`, rotas de usuario/admin e servicos de auth, usuario e auditoria.

## 1. Definicao e armazenamento de papeis

- [x] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. Entidade `Role` representa a tabela `roles` com lista de permissoes.
- [x] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. `AuthService.register` busca a role `user` e atribui ao novo usuario.
- [x] **[CRITICO]** Nenhum papel/permissao confiado do cliente. Cadastro recebe email/senha e ignora role enviada pelo cliente.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. `Permissions` define permissoes e `Role.permissions` armazena a matriz.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas usam `AuthMiddleware.authenticate` e `requirePermissions`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `requirePermissions` centraliza autorizacao.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. O middleware usa cache Redis de permissoes por 5 minutos; nao reconsulta sempre o banco.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Autenticacao, permissoes e ownership estao em metodos separados.

## 3. Principio do menor privilegio

- [x] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Role inicial e `user`.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. `super_admin` e `admin` nao sao atribuiveis no cadastro.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Usuarios, roles, auditoria e metricas exigem permissoes especificas.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao ha rotina periodica; ha gestao admin e invalidacao de cache.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. `PUT /users/:id/roles` bloqueia alterar os proprios roles.
- [x] **[ALTO]** Protecao contra IDOR. `requireSameUserOrAdmin` valida mesmo usuario ou permissao admin.
- [x] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. Cadastro nao aceita role; alteracao de roles exige permissao `role:assign`.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes automatizados.

## 5. Auditoria e rastreabilidade

- [x] **[ALTO]** Log de atribuicao/remocao de papel. `UserService.updateRoles` registra `USER_ROLES_UPDATED`.
- [x] **[ALTO]** Log de tentativas de acesso negado. `requirePermissions` registra `UNAUTHORIZED_ACCESS_ATTEMPT`.
- [x] **[MEDIO]** Alertas para padroes suspeitos. `SecurityAudit` gera alertas para eventos HIGH sem sucesso e CRITICAL.

## 6. Boas praticas e escalabilidade

- [x] **[MEDIO]** Interface administrativa para gestao de papeis. Ha rotas admin protegidas para roles, usuarios, auditoria e metricas.
- [x] **[MEDIO]** Documentacao dos papeis/permissoes. `permissions.ts` documenta a matriz de permissoes e roles default.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
