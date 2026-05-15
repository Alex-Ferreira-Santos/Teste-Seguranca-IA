# Checklist - projeto

Analise baseada em `projeto/server.js`.

## 1. Definicao e armazenamento de papeis

- [ ] **[CRITICO]** Papeis e permissoes em tabela dedicada no banco. Usuarios e roles ficam em array hardcoded.
- [ ] **[CRITICO]** Papel padrao de menor privilegio para novos usuarios. Nao ha cadastro.
- [ ] **[CRITICO]** Nenhum papel/permissao confiado do cliente. O role do JWT e usado diretamente.
- [ ] **[ALTO]** Separacao entre papeis e permissoes granulares. O controle e por role, sem permissoes.

## 2. Verificacao de autorizacao

- [x] **[CRITICO]** Verificacao no backend. Rotas usam `authenticate` e `authorize`.
- [x] **[CRITICO]** Middleware de autorizacao por rota/recurso. `authorize(roles)` e aplicado por rota.
- [ ] **[CRITICO]** Revalidacao do papel no banco a cada requisicao sensivel. Nao ha banco; o token e fonte de verdade.
- [x] **[ALTO]** Separacao entre autenticacao e autorizacao. Funcoes separadas.

## 3. Principio do menor privilegio

- [ ] **[CRITICO]** Usuario novo recebe acesso minimo por padrao. Nao ha cadastro.
- [x] **[CRITICO]** Papel alto privilegio nao acessivel via cadastro normal. Nao ha endpoint de cadastro.
- [x] **[ALTO]** Endpoints protegidos pelos papeis necessarios. `/admin`, `/editor` e `/user` possuem listas de roles.
- [ ] **[MEDIO]** Permissoes revisadas periodicamente. Nao implementado.

## 4. Escalada de privilegio e IDOR

- [x] **[CRITICO]** Impossivel alterar o proprio papel via API. Nao ha rota de troca de papel.
- [ ] **[ALTO]** Protecao contra IDOR. Nao ha recursos com ownership nem validacao de dono.
- [ ] **[ALTO]** Parametros de papel/permissao enviados pelo cliente ignorados. O role do JWT e aceito sem revalidacao.
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
