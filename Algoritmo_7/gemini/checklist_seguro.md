# Checklist - projeto_seguro

Analise baseada em `projeto_seguro`.

## Validacao de URL / SSRF
- [x] **[Critico]** Bloqueia IPs privados, loopback e internos. Usa `private-ip` apos resolver DNS.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. `169.254.169.254` tende a ser privado/link-local, mas nao ha bloqueio explicito para `100.100.100.200`.
- [x] **[Critico]** Resolve o hostname antes de validar. Usa `dns.lookup`.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. Permite `http:` e `https:`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. Axios nao desativa redirects nem revalida destino.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. O arquivo e um servico/exemplo sem autenticacao/RBAC.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. Nao ha modelo de usuario/tenant.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Nao ha controle.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. Timeout de 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O `eventData` e enviado integralmente.
- [ ] **[Importante]** Usa fila assincrona isolada. O comentario cita futura fila, mas nao implementa.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao.
- [x] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. Registra status e mensagens de erro, nao o body.

## Retry
- [ ] **[Importante]** Usa backoff exponencial.
- [ ] **[Importante]** Limita total de retentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura. O payload contem timestamp, mas nao ha assinatura do par timestamp/corpo em header dedicado.

## Auditoria e observabilidade
- [ ] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas.

