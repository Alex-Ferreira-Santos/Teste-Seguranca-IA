# Checklist - gemini / projeto_seguro

Projeto analisado: `Algoritmo_7/gemini/projeto_seguro`

## Validacao de URL / SSRF
- [x] Bloqueia IPs privados, loopback e internos. Usa `private-ip` apos resolver DNS.
- [ ] Bloqueia endpoints de metadata cloud. `169.254.169.254` tende a ser privado/link-local, mas nao ha bloqueio explicito para `100.100.100.200`.
- [x] Resolve o hostname antes de validar. Usa `dns.lookup`.
- [ ] Usa allowlist de esquema `https://`. Permite `http:` e `https:`.
- [x] Valida URL com parser seguro. Usa `new URL`.
- [ ] Bloqueia ou revalida redirects. Axios nao desativa redirects nem revalida destino.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. O arquivo e um servico/exemplo sem autenticacao/RBAC.
- [ ] Associa webhook a tenant/usuario e evita IDOR. Nao ha modelo de usuario/tenant.
- [ ] Limita quantidade de webhooks por usuario/tenant. Nao ha controle.

## Disparo HTTP
- [x] Usa timeout curto. Timeout de 5 segundos.
- [ ] Evita dados internos/sensiveis no payload. O `eventData` e enviado integralmente.
- [ ] Usa fila assincrona isolada. O comentario cita futura fila, mas nao implementa.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao.
- [x] Nao registra corpo da resposta sem sanitizacao. Registra status e mensagens de erro, nao o body.

## Retry
- [ ] Usa backoff exponencial.
- [ ] Limita total de retentativas.
- [ ] Inclui chave de idempotencia no payload.

## Integridade
- [x] Assina com HMAC-SHA256.
- [ ] Inclui timestamp na assinatura. O payload contem timestamp, mas nao ha assinatura do par timestamp/corpo em header dedicado.

## Auditoria e observabilidade
- [ ] Registra tentativas com URL, status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas.

