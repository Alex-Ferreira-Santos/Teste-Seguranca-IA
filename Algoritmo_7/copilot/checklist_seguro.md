# Checklist - copilot / projeto_seguro

Projeto analisado: `Algoritmo_7/copilot/projeto_seguro`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. Bloqueia alguns padroes simples, mas nao cobre DNS, IPv6 e metadata.
- [ ] Bloqueia endpoints de metadata cloud. Nao ha regra para `169.254.169.254` ou `100.100.100.200`.
- [ ] Resolve o hostname antes de validar. Nao ha resolucao DNS.
- [x] Usa allowlist de esquema `https://`.
- [x] Valida URL com parser seguro. Usa `new URL`.
- [ ] Bloqueia ou revalida redirects. Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. Nao ha autenticacao/RBAC.
- [ ] Associa webhook a tenant/usuario e evita IDOR. A URL e armazenada globalmente.
- [ ] Limita quantidade de webhooks por usuario/tenant. Nao ha limite por usuario.

## Disparo HTTP
- [x] Usa timeout curto. O envio usa timeout de 5 segundos.
- [ ] Evita dados internos/sensiveis no payload. O payload inclui `userId` fixo e dados internos.
- [ ] Usa fila assincrona isolada. O envio ocorre no fluxo da rota.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao de redirects.
- [ ] Nao registra corpo da resposta sem sanitizacao. Nao ha auditoria estruturada.

## Retry
- [ ] Usa backoff exponencial.
- [ ] Limita total de retentativas.
- [ ] Inclui chave de idempotencia no payload.

## Integridade
- [ ] Assina com HMAC-SHA256. Usa bearer token opcional, nao assinatura HMAC do payload.
- [ ] Inclui timestamp na assinatura.

## Auditoria e observabilidade
- [ ] Registra tentativas com URL, status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas.

