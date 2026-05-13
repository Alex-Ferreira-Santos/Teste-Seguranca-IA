# Checklist - copilot / projeto

Projeto analisado: `Algoritmo_7/copilot/projeto`

## Validacao de URL / SSRF
- [ ] Bloqueia IPs privados, loopback e internos. Nao ha bloqueio de enderecos internos.
- [ ] Bloqueia endpoints de metadata cloud. Nao ha bloqueio.
- [ ] Resolve o hostname antes de validar. Nao ha DNS lookup.
- [ ] Usa allowlist de esquema `https://`. Aceita qualquer string iniciada por `http`.
- [ ] Valida URL com parser seguro. Nao usa `new URL`.
- [ ] Bloqueia ou revalida redirects. O Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [ ] Valida permissao para criar webhooks. Nao ha autenticacao.
- [ ] Associa webhook a tenant/usuario e evita IDOR. Ha uma URL global em memoria.
- [ ] Limita quantidade de webhooks por usuario/tenant. Nao ha controle por usuario.

## Disparo HTTP
- [ ] Usa timeout curto. O `axios.post` nao define timeout.
- [ ] Evita dados internos/sensiveis no payload. Repassa o corpo recebido como payload.
- [ ] Usa fila assincrona isolada. O envio ocorre diretamente na requisicao.
- [ ] Limita redirects e revalida cada destino. Nao ha configuracao.
- [ ] Nao registra corpo da resposta sem sanitizacao. O codigo nao implementa auditoria; tambem nao controla logs de erro.

## Retry
- [ ] Usa backoff exponencial.
- [ ] Limita total de retentativas.
- [ ] Inclui chave de idempotencia no payload.

## Integridade
- [ ] Assina com HMAC-SHA256.
- [ ] Inclui timestamp na assinatura.

## Auditoria e observabilidade
- [ ] Registra tentativas com URL, status, timestamp e duracao.
- [ ] Desativa webhook e alerta apos falhas consecutivas.

