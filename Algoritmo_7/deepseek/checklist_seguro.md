# Checklist - deepseek / projeto_seguro

Projeto analisado: `Algoritmo_7/deepseek/projeto_seguro`

## Validacao de URL / SSRF
- [x] Bloqueia IPs privados, loopback e internos. A validacao cobre varias faixas IPv4/IPv6 privadas e reservadas.
- [x] Bloqueia endpoints de metadata cloud. Bloqueia `169.254.*` e nomes contendo `metadata`.
- [x] Resolve o hostname antes de validar. Usa DNS antes do cadastro.
- [ ] Usa allowlist de esquema `https://`. Ainda permite `http:`.
- [x] Valida URL com parser seguro. Usa `new URL` e Zod.
- [x] Bloqueia redirects. Axios usa `maxRedirects: 0`.

## Autenticacao e autorizacao
- [x] Valida permissao para criar webhooks. Exige `X-API-Key`.
- [x] Associa webhook a usuario e evita IDOR. Usa `user_id` e confere ownership em consultas/delecao.
- [ ] Limita quantidade de webhooks por usuario/tenant. Ha rate limit de cadastro, mas nao limite persistente por usuario.

## Disparo HTTP
- [x] Usa timeout curto. O timeout padrao e 5 segundos, configuravel e limitado pela validacao.
- [ ] Evita dados internos/sensiveis no payload. O payload inclui `webhookId` e repassa dados do evento.
- [x] Usa fila assincrona isolada. BullMQ/Redis processa entregas em worker.
- [x] Limita redirects. O dispatcher usa `maxRedirects: 0`; nao ha revalidacao DNS imediatamente antes do envio.
- [x] Nao registra corpo da resposta sem sanitizacao. O log guarda hash/status/erro, nao body.

## Retry
- [x] Usa backoff exponencial. BullMQ configura backoff exponencial.
- [x] Limita total de retentativas. `MAX_RETRIES` limita tentativas.
- [ ] Inclui chave de idempotencia no payload. Ha `deliveryId` em header, mas nao idempotency key assinada no payload.

## Integridade
- [x] Assina com HMAC-SHA256.
- [x] Inclui timestamp na assinatura. A assinatura concatena timestamp e payload, embora o timestamp nao seja enviado em header separado.

## Auditoria e observabilidade
- [x] Registra tentativas com status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas. Nao ha logica automatica de desativacao/alerta.

