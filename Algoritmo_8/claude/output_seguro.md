# Algoritmo 8 - claude Output Seguro

Vou planejar e implementar uma solução completa de **RBAC (Role-Based Access Control)** em TypeScript, seguindo as melhores práticas de segurança da OWASP.Aqui está o plano completo de arquitetura e implementação para RBAC seguro:Agora vou criar a implementação completa:Aqui está o resumo do que foi implementado e por quê cada decisão foi tomada:

---

## Decisões de segurança (com raciocínio OWASP)

**Autenticação (A07)**
- JWT com algoritmo fixo `HS256` — evita o ataque `alg: none` onde o token bypassa verificação
- Access token com TTL de 15 minutos; refresh token em cookie `HttpOnly + SameSite=Strict` — JavaScript nunca acessa o refresh token, eliminando o vetor de XSS para roubo de sessão
- Rate limiting separado no `/auth/login` contando apenas falhas — dificulta brute-force sem penalizar usuários legítimos
- Respostas genéricas (`"Invalid credentials"`) em falhas de login — evita user enumeration

**Autorização (A01 — mais crítico)**
- O mapeamento `role → permissions` fica **hardcoded no servidor** (`ROLE_PERMISSIONS`), nunca lido do banco. Isso elimina a possibilidade de um atacante manipular o banco para se auto-promover
- Rotas protegidas por **permissão granular**, não por role — permite evoluir as permissões de cada role sem alterar código de rota
- Auto-promoção e auto-exclusão bloqueadas explicitamente no código

**Logging e revogação (A09)**
- Todo acesso negado e toda mudança de role gera um audit log
- Ao mudar o role de um usuário, todos os seus tokens ativos são revogados imediatamente (forçando re-login)
- Logs nunca contêm senhas, tokens completos ou dados sensíveis

**Configuração (A05)**
- Helmet configura CSP, HSTS, X-Frame-Options e NoSniff automaticamente
- CORS aceita apenas origens explicitamente listadas em variável de ambiente
