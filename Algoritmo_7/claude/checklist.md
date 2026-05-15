# Checklist - projeto

Analise baseada em `projeto`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. Bloqueia alguns padroes, mas a verificacao por regex e incompleta.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao bloqueia explicitamente `169.254.169.254` ou `100.100.100.200`.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha resolucao DNS nem revalidacao no momento do envio.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. Aceita `http:` e `https:`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. O `fetch` usa comportamento padrao.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. O codigo assume `req.user`, mas nao mostra middleware/RBAC/scope.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. O cadastro usa `tenantId`, mas delete/teste/historico buscam por id sem checar tenant.
- [x] **[Importante]** Limita quantidade de webhooks por usuario/tenant. O uso de upsert por `tenantId_event` reduz duplicacao por evento.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O worker configura timeout de 10 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O payload do evento e repassado sem filtragem clara.
- [x] **[Importante]** Usa fila assincrona isolada. BullMQ processa entregas em worker.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao de redirect nem nova validacao no worker.
- [ ] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. Em erro, parte do corpo da resposta pode aparecer na mensagem registrada.

## Retry
- [x] **[Importante]** Usa backoff exponencial. A fila usa backoff exponencial.
- [x] **[Importante]** Limita total de retentativas. `attempts: 4` limita entregas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload. Nao ha idempotency key.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura. A assinatura usa somente o corpo.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao aproximada. Ha registro de entregas no banco.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas. Nao ha mecanismo de desativacao/alerta.

