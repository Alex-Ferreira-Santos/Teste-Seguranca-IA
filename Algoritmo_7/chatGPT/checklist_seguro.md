# Checklist - projeto_seguro

Analise baseada em `projeto_seguro`.

## Validacao de URL / SSRF
- [x] **[Critico]** Bloqueia IPs privados, loopback e internos. A validacao cobre IPv4 privados, loopback, link-local e faixas IPv6 locais.
- [x] **[Critico]** Bloqueia endpoints de metadata cloud. `169.254.0.0/16` e bloqueado, cobrindo o endpoint AWS; a validacao tambem bloqueia ranges internos relevantes.
- [x] **[Critico]** Resolve o hostname antes de validar e revalida no worker. O envio usa IP resolvido e header `Host`, reduzindo DNS rebinding.
- [x] **[Critico]** Usa allowlist de esquema `https://`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL` e schema com Zod.
- [x] **[Importante]** Bloqueia redirects. O dispatcher usa `maxRedirections: 0`.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. Nao ha middleware real de autenticacao/RBAC; o user id e fixo.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. A estrutura possui `userId`, mas o exemplo usa `user-123` hardcoded.
- [x] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Ha limite de 10 endpoints por usuario.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O envio usa timeouts de 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. Os dados do evento sao repassados conforme recebidos.
- [x] **[Importante]** Usa fila assincrona isolada. BullMQ/Redis processa entregas em worker.
- [x] **[Importante]** Limita redirects e revalida cada destino. Redirects sao desativados e a URL e revalidada antes do envio.
- [x] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. Os logs gravam metadados, nao o body.

## Retry
- [x] **[Importante]** Usa backoff exponencial. A fila configura backoff exponencial.
- [x] **[Importante]** Limita total de retentativas. `attempts` limita as tentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload. Ha header `x-webhook-id` aleatorio, mas nao idempotency key estavel.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura. O payload inclui timestamp, mas a assinatura e calculada apenas sobre o corpo serializado.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com status e identificadores. Os logs evitam dados sensiveis.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas. Nao ha rotina de desativacao/alerta.

