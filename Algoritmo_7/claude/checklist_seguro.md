# Checklist - claude / projeto_seguro

Projeto analisado: `Algoritmo_7/claude/projeto_seguro`

## Validacao de URL / SSRF
- [x] Bloqueia IPs privados, loopback e internos. A validacao cobre ranges IPv4/IPv6 privados e link-local.
- [x] Bloqueia endpoints de metadata cloud. Bloqueia `169.254.0.0/16` e `100.64.0.0/10`, incluindo metadata comuns.
- [x] Resolve o hostname antes de validar e revalida no envio.
- [x] Usa allowlist de esquema `https://`.
- [x] Valida URL com parser seguro. Usa `new URL`.
- [x] Bloqueia redirects. O dispatcher nao segue redirects.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. As rotas exigem `userId`, mas nao ha middleware real de autenticacao/RBAC/scope no app.
- [x] Associa webhook a usuario e evita IDOR. Operacoes usam ownership por `userId`.
- [x] Limita quantidade de webhooks por usuario/tenant. Ha limite de 10 por usuario.

## Disparo HTTP
- [x] Usa timeout curto. O timeout padrao e 10 segundos e limitado a 30 segundos.
- [ ] Evita dados internos/sensiveis no payload. O `data` do evento e repassado ao webhook.
- [ ] Usa fila assincrona isolada. O envio e separado em servico, mas retries usam `setTimeout` no processo, nao uma fila isolada.
- [x] Limita redirects e revalida cada destino.
- [ ] Nao registra corpo da resposta sem sanitizacao. O dispatcher armazena corpo de resposta limitado, mas ainda sem sanitizacao.

## Retry
- [x] Usa backoff exponencial/escalonado. Os delays crescem por tentativa.
- [x] Limita total de retentativas. `maxRetries` controla o total.
- [ ] Inclui chave de idempotencia no payload. O payload tem id, mas nao uma chave de idempotencia explicita.

## Integridade
- [x] Assina com HMAC-SHA256.
- [x] Inclui timestamp na assinatura. O utilitario assina `timestamp.payload`.

## Auditoria e observabilidade
- [x] Registra tentativas com status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas. Nao foi identificado mecanismo de alerta/desativacao automatica.

