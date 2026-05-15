# Checklist - projeto_seguro

Analise baseada em `projeto_seguro`.

## Validacao de URL / SSRF
- [x] **[Critico]** Bloqueia IPs privados, loopback e internos. A validacao cobre varias faixas IPv4/IPv6 privadas e reservadas.
- [x] **[Critico]** Bloqueia endpoints de metadata cloud. Bloqueia `169.254.*` e nomes contendo `metadata`.
- [x] **[Critico]** Resolve o hostname antes de validar. Usa DNS antes do cadastro.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. Ainda permite `http:`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL` e Zod.
- [x] **[Importante]** Bloqueia redirects. Axios usa `maxRedirects: 0`.

## Autenticacao e autorizacao
- [x] **[Critico]** Valida permissao para criar webhooks. Exige `X-API-Key`.
- [x] **[Critico]** Associa webhook a usuario e evita IDOR. Usa `user_id` e confere ownership em consultas/delecao.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Ha rate limit de cadastro, mas nao limite persistente por usuario.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O timeout padrao e 5 segundos, configuravel e limitado pela validacao.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O payload inclui `webhookId` e repassa dados do evento.
- [x] **[Importante]** Usa fila assincrona isolada. BullMQ/Redis processa entregas em worker.
- [x] **[Importante]** Limita redirects. O dispatcher usa `maxRedirects: 0`; nao ha revalidacao DNS imediatamente antes do envio.
- [x] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. O log guarda hash/status/erro, nao body.

## Retry
- [x] **[Importante]** Usa backoff exponencial. BullMQ configura backoff exponencial.
- [x] **[Importante]** Limita total de retentativas. `MAX_RETRIES` limita tentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload. Ha `deliveryId` em header, mas nao idempotency key assinada no payload.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [x] **[Importante]** Inclui timestamp na assinatura. A assinatura concatena timestamp e payload, embora o timestamp nao seja enviado em header separado.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas. Nao ha logica automatica de desativacao/alerta.

