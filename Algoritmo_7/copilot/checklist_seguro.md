# Checklist - projeto_seguro

Analise baseada em `projeto_seguro`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. Bloqueia alguns padroes simples, mas nao cobre DNS, IPv6 e metadata.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao ha regra para `169.254.169.254` ou `100.100.100.200`.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha resolucao DNS.
- [x] **[Critico]** Usa allowlist de esquema `https://`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. Nao ha autenticacao/RBAC.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. A URL e armazenada globalmente.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Nao ha limite por usuario.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O envio usa timeout de 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O payload inclui `userId` fixo e dados internos.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio ocorre no fluxo da rota.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao de redirects.
- [ ] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. Nao ha auditoria estruturada.

## Retry
- [ ] **[Importante]** Usa backoff exponencial.
- [ ] **[Importante]** Limita total de retentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload.

## Integridade
- [ ] **[Importante]** Assina com HMAC-SHA256. Usa bearer token opcional, nao assinatura HMAC do payload.
- [ ] **[Importante]** Inclui timestamp na assinatura.

## Auditoria e observabilidade
- [ ] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas.

