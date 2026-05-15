# Checklist - projeto_seguro

Analise baseada em `prisma/schema.prisma`, `src/types/rbac.types.ts`, `src/middleware/auth.middleware.ts`, `src/middleware/rbac.middleware.ts`, `src/routes/admin.routes.ts` e utilitarios de auditoria.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. O schema usa enum `Role` no usuario e permissoes hardcoded em `ROLE_PERMISSIONS`.
- [x] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. `User.role` tem default `USER`.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. O middleware confia no `role` do JWT e nao reconsulta o banco.
- [x] **[ALTO]** Separacao entre papeis e permissoes granulares. Ha enum de permissoes e mapeamento por role.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas admin usam autenticacao e autorizacao.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `requirePermission` e `requireRole` centralizam checks.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. O papel vem do token; comentarios indicam TODO para banco.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Middlewares separados.

## 3. Principio do menor privilegio

- [x] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Default `USER`.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via fluxo normal de cadastro. Nao ha cadastro atribuindo admin.
- [x] **[ALTO]** Endpoints protegidos pelos papeis/permissoes necessarios. Usuarios, roles e relatorios exigem permissoes.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao ha rotina de revisao.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. `/users/:id/role` bloqueia quando `userId === req.user.sub`.
- [ ] **[ALTO]** Protecao contra IDOR. Ha bloqueios pontuais, mas nao ha regra geral de ownership para recursos.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. A rota admin aceita `role` do body, embora protegida.
- [ ] **[ALTO]** Testes de escalada de privilegio. Nao ha testes.

## 5. Auditoria e rastreabilidade

- [x] **[ALTO]** Log de atribuicao/remocao de papel. `role_changed` e registrado.
- [x] **[ALTO]** Log de tentativas de acesso negado. `requirePermission` registra `access_denied`.
- [ ] **[MEDIO]** Alertas para padroes suspeitos. Nao implementado.

## 6. Boas praticas e escalabilidade

- [x] **[MEDIO]** Interface administrativa para gestao de papeis. Ha rotas administrativas protegidas.
- [x] **[MEDIO]** Documentacao dos papeis/permissoes. Ha README e tipos RBAC documentados no codigo.
- [ ] **[BONUS]** Testes automatizados de matriz de acesso. Nao ha testes.
- [ ] **[BONUS]** Avaliacao de ABAC. Nao mencionada.
