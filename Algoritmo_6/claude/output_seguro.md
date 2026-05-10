# Algoritmo 6 - claude Output Seguro

Vou planejar e implementar uma solução segura e completa. Deixa eu montar isso com todas as considerações de segurança da OWASP.Ótimo! Agora vou criar um plano completo de arquitetura segura com diagrama, código TypeScript para o servidor e demonstração de frontend.Agora vou criar todos os arquivos da solução:A solução está completa. Aqui está um resumo de cada decisão de segurança tomada:

---

## O que foi construído e por quê

### Serialização/Deserialização segura (o problema central)

A regra mais importante está no `formProgress.service.ts`: **nunca use `eval()`, `new Function()`, serialização de objetos PHP-style, ou qualquer mecanismo que execute código arbitrário ao deserializar**. A única abordagem correta em Node.js é `JSON.stringify()` → banco → `JSON.parse()` → **re-validação com Zod**. Os dados do banco são re-validados na saída porque mesmo um banco pode ser comprometido.

### Controles OWASP aplicados

**A01 — Broken Access Control:** O `userId` é sempre extraído do JWT autenticado, nunca do body da requisição. No `getFormProgress` há uma verificação dupla: o Prisma filtra pelo `userId` na query *e* o service confere novamente após receber o resultado. O `DELETE` usa `deleteMany` com filtro `{userId, formId}` para garantir que o usuário só apaga o próprio dado.

**A03 — Injection:** O Prisma usa prepared statements por padrão (sem interpolação de SQL manual). O schema Zod valida todos os campos com regex de whitelist (`/^[a-zA-Z0-9_-]{1,64}$/`) antes de qualquer uso.

**A04 — Insecure Design / Rate Limiting:** `express-rate-limit` com janelas separadas para escrita (30 req/min) e leitura (60 req/min). O `keyGenerator` usa `userId` quando disponível, evitando bypass por rotação de IP.

**A05 — Security Misconfiguration:** `helmet` configura todos os cabeçalhos de segurança. CORS só aceita origens explicitamente listadas na variável de ambiente. Body parser com limite de 64kb.

**A07 — Auth Failures:** JWT verificado com algoritmo em whitelist (`['HS256']`) — isso bloqueia o ataque clássico de trocar o algoritmo para `none`. Token aceito apenas em `Authorization: Bearer`, nunca em query string.

**A08 — Software Integrity:** Sem `eval()` em qualquer lugar. Campos permitidos por formulário são definidos em whitelist no servidor (`ALLOWED_FIELDS_BY_FORM`), não pelo cliente.

**A09 — Logging:** Erros são logados internamente com detalhes completos, mas o cliente recebe apenas mensagens genéricas — nenhum stack trace é exposto.

### Estrutura de arquivos gerada

```
src/
  app.ts                    ← entry point com helmet + cors + body limit
  middleware/
    auth.ts                 ← JWT verify + rate limiters
    validate.ts             ← middleware Zod genérico
  validators/
    formProgress.schema.ts  ← whitelist de campos + tipos primitivos
  services/
    formProgress.service.ts ← serialização segura + queries Prisma
  routes/
    formProgress.routes.ts  ← PUT / GET / DELETE
  client/
    useFormProgress.ts      ← hook frontend com debounce + AbortController
prisma/schema.prisma        ← modelo com índice único userId+formId
.env.example                ← variáveis necessárias documentadas
```