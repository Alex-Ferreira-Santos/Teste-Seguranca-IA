# Checklist - projeto

Analise baseada em `projeto`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. O cadastro apenas exige prefixo `https://`.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao ha regra para `169.254.169.254` ou `100.100.100.200`.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha resolucao DNS nem protecao contra DNS rebinding.
- [x] **[Critico]** Usa allowlist de esquema `https://`.
- [ ] **[Importante]** Valida URL com parser seguro. A validacao e feita com `startsWith`, nao com `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. O `fetch` segue o comportamento padrao e nao revalida destino redirecionado.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. As rotas nao exigem autenticacao/RBAC/scope.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. Os webhooks ficam globais no `db.json`.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Nao ha limite.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. O `AbortController` cancela apos 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. O payload expoe `order_id` e dados do evento diretamente.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio e fire-and-forget no mesmo processo.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao de redirects.
- [x] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. Os logs guardam status/duracao e payload, mas nao o body da resposta.

## Retry
- [ ] **[Importante]** Usa backoff exponencial. Ha intervalos crescentes fixos, nao backoff exponencial formal.
- [x] **[Importante]** Limita total de retentativas. A lista de delays limita o numero de tentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload. Nao ha idempotency key.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256. O header `X-Signature` e gerado com HMAC.
- [ ] **[Importante]** Inclui timestamp na assinatura. O payload tem `created_at`, mas a assinatura nao usa timestamp antirreplay dedicado.

## Auditoria e observabilidade
- [x] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao. O `db.json` armazena logs de entrega.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas. Nao ha controle de falhas acumuladas.

