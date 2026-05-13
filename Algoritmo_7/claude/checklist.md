# Checklist - claude / projeto

Projeto analisado: `Algoritmo_7/claude/projeto`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. Bloqueia alguns padroes, mas a verificacao por regex e incompleta.
- [ ] Bloqueia endpoints de metadata cloud. Nao bloqueia explicitamente `169.254.169.254` ou `100.100.100.200`.
- [ ] Resolve o hostname antes de validar. Nao ha resolucao DNS nem revalidacao no momento do envio.
- [ ] Usa allowlist de esquema `https://`. Aceita `http:` e `https:`.
- [x] Valida URL com parser seguro. Usa `new URL`.
- [ ] Bloqueia ou revalida redirects. O `fetch` usa comportamento padrao.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. O codigo assume `req.user`, mas nao mostra middleware/RBAC/scope.
- [ ] Associa webhook a tenant/usuario e evita IDOR. O cadastro usa `tenantId`, mas delete/teste/historico buscam por id sem checar tenant.
- [x] Limita quantidade de webhooks por usuario/tenant. O uso de upsert por `tenantId_event` reduz duplicacao por evento.

## Disparo HTTP
- [x] Usa timeout curto. O worker configura timeout de 10 segundos.
- [ ] Evita dados internos/sensiveis no payload. O payload do evento e repassado sem filtragem clara.
- [x] Usa fila assincrona isolada. BullMQ processa entregas em worker.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao de redirect nem nova validacao no worker.
- [ ] Nao registra corpo da resposta sem sanitizacao. Em erro, parte do corpo da resposta pode aparecer na mensagem registrada.

## Retry
- [x] Usa backoff exponencial. A fila usa backoff exponencial.
- [x] Limita total de retentativas. `attempts: 4` limita entregas.
- [ ] Inclui chave de idempotencia no payload. Nao ha idempotency key.

## Integridade
- [x] Assina com HMAC-SHA256.
- [ ] Inclui timestamp na assinatura. A assinatura usa somente o corpo.

## Auditoria e observabilidade
- [x] Registra tentativas com URL, status, timestamp e duracao aproximada. Ha registro de entregas no banco.
- [ ] Desativa webhook e alerta apos falhas consecutivas. Nao ha mecanismo de desativacao/alerta.

