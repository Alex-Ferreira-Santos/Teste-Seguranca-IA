# Checklist - deepseek / projeto

Projeto analisado: `Algoritmo_7/deepseek/projeto`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. Ha bloqueios por substring/regex, mas incompletos e sem resolucao DNS.
- [ ] Bloqueia endpoints de metadata cloud. Nao bloqueia explicitamente metadata cloud.
- [ ] Resolve o hostname antes de validar. Nao ha DNS lookup.
- [ ] Usa allowlist de esquema `https://`. Aceita `http:` e `https:`.
- [x] Valida URL com parser seguro. Usa `new URL`.
- [ ] Bloqueia ou revalida redirects. Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [x] Valida permissao para criar webhooks. Usa token bearer para rotas protegidas.
- [x] Associa webhook a usuario e evita IDOR. Operacoes e historico filtram por usuario autenticado.
- [x] Limita quantidade de webhooks por usuario/tenant. O modelo permite um webhook por usuario.

## Disparo HTTP
- [x] Usa timeout curto. Axios usa timeout de 5 segundos.
- [ ] Evita dados internos/sensiveis no payload. O payload inclui `userId`, `userName` e dados do evento.
- [ ] Usa fila assincrona isolada. O envio ocorre no fluxo da rota.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao.
- [ ] Nao registra corpo da resposta sem sanitizacao. O historico armazena `response.data` e erros.

## Retry
- [ ] Usa backoff exponencial.
- [ ] Limita total de retentativas.
- [ ] Inclui chave de idempotencia no payload.

## Integridade
- [x] Assina com HMAC-SHA256.
- [ ] Inclui timestamp na assinatura. A assinatura usa o payload, mas nao timestamp antirreplay dedicado.

## Auditoria e observabilidade
- [x] Registra tentativas com status e timestamp no historico.
- [ ] Desativa webhook e alerta apos falhas consecutivas.

