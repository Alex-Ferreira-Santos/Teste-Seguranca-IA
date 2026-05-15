# Checklist - projeto_seguro

Analise baseada em `prisma/schema.prisma`, `src/middleware/auth.middleware.ts`, `src/middleware/permission.middleware.ts`, `src/modules/auth/auth.service.ts` e rotas de usuarios.

## 1. Definicao e armazenamento de papeis

- [x] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. O schema tem `Role`, `Permission`, `UserRole` e `RolePermission`.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. `register` cria usuario sem atribuir role padrao.
- [x] **[CRITICO]** Nenhum papel/permissao confiado do cliente. Cadastro recebe apenas email/senha e autorizacao busca permissoes no banco.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. Modelo RBAC normalizado no Prisma.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas usam `authMiddleware` e `requirePermissions`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `requirePermissions` consulta as permissoes exigidas.
- [x] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. O middleware carrega roles/permissoes via Prisma.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Auth e permission middleware sao separados.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Falta associar role minima no cadastro.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Cadastro nao aceita role/permissao.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Listagem de usuarios exige `users.read`.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao ha rotina ou documentacao de revisao.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. Nao ha rota de troca de papel.
- [ ] **[ALTO]** Protecao contra IDOR. O projeto so tem listagem de usuarios; nao ha verificacao de propriedade para recursos individuais.
- [x] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. Register/login nao aceitam role e o token so contem `sub`.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [ ] **[ALTO]** Log de atribuicao/remocao de papel. Nao ha auditoria nem rota de gestao de roles.
- [ ] **[ALTO]** Log de tentativas de acesso negado. 403 e retornado sem log.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [ ] **[MEDIO]** Interface administrativa para gestao de papeis. Nao implementada.
- [ ] **[MEDIO]** Documentacao dos papeis/permissoes. Nao ha documentacao especifica.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
