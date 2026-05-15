# Checklist - projeto

Analise baseada em `projeto`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. A URL fixa de exemplo usa `localhost`.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao ha bloqueio.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha validacao de URL.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. O exemplo usa `http://localhost`.
- [ ] **[Importante]** Valida URL com parser seguro. Nao ha parser/validacao.
- [ ] **[Importante]** Bloqueia ou revalida redirects. Axios usa comportamento padrao.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. Nao ha cadastro autenticado.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. A configuracao e global.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Nao ha limite.

## Disparo HTTP
- [x] **[Critico]** Usa timeout curto. Axios usa timeout de 5 segundos.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. Envia `projetoId` e dados internos do evento.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio ocorre diretamente na rota.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao.
- [x] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. O servidor registra apenas mensagens de sucesso/erro.

## Retry
- [ ] **[Importante]** Usa backoff exponencial.
- [ ] **[Importante]** Limita total de retentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload.

## Integridade
- [x] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura. O payload tem timestamp, mas a assinatura nao usa um envelope antirreplay dedicado.

## Auditoria e observabilidade
- [ ] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas.

