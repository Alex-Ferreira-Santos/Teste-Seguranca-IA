# Checklist - projeto_seguro

Analise baseada em `projeto_seguro`.

## Validacao de URL / SSRF
- [x] **[Critico]** Bloqueia IPs privados, loopback e internos. A validacao cobre ranges IPv4/IPv6 privados e link-local.
- [x] **[Critico]** Bloqueia endpoints de metadata cloud. Bloqueia `169.254.0.0/16` e `100.64.0.0/10`, incluindo metadata comuns.
- [x] **[Critico]** Resolve o hostname antes de validar e revalida no envio.
- [x] **[Critico]** Usa allowlist de esquema `https://`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL`.
- [x] **[Importante]** Bloqueia redirects. O dispatcher nao segue redirects.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. As rotas exigem `userId`, mas nao ha middleware real de autenticacao/RBAC/scope no app.
- [x] **[Critico]** Associa webhook a usuario e evita IDOR. Operacoes usam ownership por `userId`.
- [x] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Ha limite de 10 por usuario.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O timeout padrao e 10 segundos e limitado a 30 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O `data` do evento e repassado ao webhook.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio e separado em servico, mas retries usam `setTimeout` no processo, nao uma fila isolada.
- [x] **[Importante]** Limita redirects e revalida cada destino.
- [ ] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. O dispatcher armazena corpo de resposta limitado, mas ainda sem sanitizacao.

## Retry
- [x] **[Importante]** Usa backoff exponencial/escalonado. Os delays crescem por tentativa.
- [x] **[Importante]** Limita total de retentativas. `maxRetries` controla o total.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload. O payload tem id, mas nao uma chave de idempotencia explicita.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [x] **[Importante]** Inclui timestamp na assinatura. O utilitario assina `timestamp.payload`.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas. Nao foi identificado mecanismo de alerta/desativacao automatica.

