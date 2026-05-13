# Checklist - chatGPT / projeto

Projeto analisado: `Algoritmo_7/chatGPT/projeto`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. O cadastro apenas exige prefixo `https://`.
- [ ] Bloqueia endpoints de metadata cloud. Nao ha regra para `169.254.169.254` ou `100.100.100.200`.
- [ ] Resolve o hostname antes de validar. Nao ha resolucao DNS nem protecao contra DNS rebinding.
- [x] Usa allowlist de esquema `https://`.
- [ ] Valida URL com parser seguro. A validacao e feita com `startsWith`, nao com `new URL`.
- [ ] Bloqueia ou revalida redirects. O `fetch` segue o comportamento padrao e nao revalida destino redirecionado.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. As rotas nao exigem autenticacao/RBAC/scope.
- [ ] Associa webhook a tenant/usuario e evita IDOR. Os webhooks ficam globais no `db.json`.
- [ ] Limita quantidade de webhooks por usuario/tenant. Nao ha limite.

## Disparo HTTP
- [x] Usa timeout curto. O `AbortController` cancela apos 5 segundos.
- [ ] Evita dados internos/sensiveis no payload. O payload expoe `order_id` e dados do evento diretamente.
- [ ] Usa fila assincrona isolada. O envio e fire-and-forget no mesmo processo.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao de redirects.
- [x] Nao registra corpo da resposta sem sanitizacao. Os logs guardam status/duracao e payload, mas nao o body da resposta.

## Retry
- [ ] Usa backoff exponencial. Ha intervalos crescentes fixos, nao backoff exponencial formal.
- [x] Limita total de retentativas. A lista de delays limita o numero de tentativas.
- [ ] Inclui chave de idempotencia no payload. Nao ha idempotency key.

## Integridade
- [x] Assina com HMAC-SHA256. O header `X-Signature` e gerado com HMAC.
- [ ] Inclui timestamp na assinatura. O payload tem `created_at`, mas a assinatura nao usa timestamp antirreplay dedicado.

## Auditoria e observabilidade
- [x] Registra tentativas com URL, status, timestamp e duracao. O `db.json` armazena logs de entrega.
- [ ] Desativa webhook e alerta apos falhas consecutivas. Nao ha controle de falhas acumuladas.

