# Checklist - projeto

Analise baseada em `projeto`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. Ha bloqueios por substring/regex, mas incompletos e sem resolucao DNS.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao bloqueia explicitamente metadata cloud.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha DNS lookup.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. Aceita `http:` e `https:`.
- [x] **[Importante]** Valida URL com parser seguro. Usa `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [x] **[Critico]** Valida permissao para criar webhooks. Usa token bearer para rotas protegidas.
- [x] **[Critico]** Associa webhook a usuario e evita IDOR. Operacoes e historico filtram por usuario autenticado.
- [x] **[Importante]** Limita quantidade de webhooks por usuario/tenant. O modelo permite um webhook por usuario.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. Axios usa timeout de 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O payload inclui `userId`, `userName` e dados do evento.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio ocorre no fluxo da rota.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao.
- [ ] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. O historico armazena `response.data` e erros.

## Retry
- [ ] **[Importante]** Usa backoff exponencial.
- [ ] **[Importante]** Limita total de retentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura. A assinatura usa o payload, mas nao timestamp antirreplay dedicado.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com status e timestamp no historico.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas.

