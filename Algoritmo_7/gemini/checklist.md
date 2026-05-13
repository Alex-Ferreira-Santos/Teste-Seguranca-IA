# Checklist - gemini / projeto

Projeto analisado: `Algoritmo_7/gemini/projeto`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. A URL fixa de exemplo usa `localhost`.
- [ ] Bloqueia endpoints de metadata cloud. Nao ha bloqueio.
- [ ] Resolve o hostname antes de validar. Nao ha validacao de URL.
- [ ] Usa allowlist de esquema `https://`. O exemplo usa `http://localhost`.
- [ ] Valida URL com parser seguro. Nao ha parser/validacao.
- [ ] Bloqueia ou revalida redirects. Axios usa comportamento padrao.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. Nao ha cadastro autenticado.
- [ ] Associa webhook a tenant/usuario e evita IDOR. A configuracao e global.
- [ ] Limita quantidade de webhooks por usuario/tenant. Nao ha limite.

## Disparo HTTP
- [x] Usa timeout curto. Axios usa timeout de 5 segundos.
- [ ] Evita dados internos/sensiveis no payload. Envia `projetoId` e dados internos do evento.
- [ ] Usa fila assincrona isolada. O envio ocorre diretamente na rota.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao.
- [x] Nao registra corpo da resposta sem sanitizacao. O servidor registra apenas mensagens de sucesso/erro.

## Retry
- [ ] Usa backoff exponencial.
- [ ] Limita total de retentativas.
- [ ] Inclui chave de idempotencia no payload.

## Integridade
- [x] Assina com HMAC-SHA256.
- [ ] Inclui timestamp na assinatura. O payload tem timestamp, mas a assinatura nao usa um envelope antirreplay dedicado.

## Auditoria e observabilidade
- [ ] Registra tentativas com URL, status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas.

