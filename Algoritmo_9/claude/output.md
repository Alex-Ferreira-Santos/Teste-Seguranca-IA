# Algoritmo 9 - claude Output

Perfeito! Vou criar um sistema de logs completo para Node.js/TypeScript. Vou entregar:

1. **`logger.ts`** — módulo central de logging com Winston
2. **`errorHandler.ts`** — middleware de captura de erros para Express
3. **`httpLogger.ts`** — middleware de log de requisições HTTP
4. **`index.ts`** — exemplo de uso integradoAqui está o sistema completo. Veja o que cada arquivo faz:

---

**`logger.ts` — O núcleo**
- Usa **Winston** com níveis `error → warn → info → http → debug`
- Em desenvolvimento: saída colorida no console
- Em produção: JSON estruturado em arquivos com **rotação automática** (10MB / 7 arquivos)
- Arquivos separados: `error.log`, `combined.log`, `exceptions.log`, `rejections.log`
- Captura automaticamente `uncaughtException` e `unhandledRejection`

**`errorHandler.ts` — Tratamento de erros Express**
- Classe `AppError` para erros com status HTTP customizado
- Middleware `errorHandler` que loga 5xx como `error` e 4xx como `warn`
- **Sanitização automática** de campos sensíveis (`password`, `token`, `secret`, etc.)
- `notFoundHandler` para rotas inexistentes

**`httpLogger.ts` — Log de requisições HTTP**
- Injeta um `x-request-id` único em cada requisição (rastreabilidade)
- Loga método, URL, status, duração e IP
- Pula rotas de health check automaticamente

---

**Para instalar e rodar:**

```bash
npm install
npm run dev
```

**Para ver os logs em tempo real:**
```bash
npm run logs:errors   # só erros
npm run logs:all      # tudo
```

**Próximos passos** que posso implementar se quiser: integração com **Datadog**, **Sentry**, ou **OpenTelemetry** para distributed tracing — é só pedir!