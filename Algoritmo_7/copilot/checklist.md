# Checklist - projeto

Analise baseada em `projeto`.

## Validacao de URL / SSRF
- [ ] **[Critico]** Bloqueia IPs privados, loopback e internos. Nao ha bloqueio de enderecos internos.
- [ ] **[Critico]** Bloqueia endpoints de metadata cloud. Nao ha bloqueio.
- [ ] **[Critico]** Resolve o hostname antes de validar. Nao ha DNS lookup.
- [ ] **[Critico]** Usa allowlist de esquema `https://`. Aceita qualquer string iniciada por `http`.
- [ ] **[Importante]** Valida URL com parser seguro. Nao usa `new URL`.
- [ ] **[Importante]** Bloqueia ou revalida redirects. O Axios segue redirects por padrao.

## Autenticacao e autorizacao
- [ ] **[Critico]** Valida permissao para criar webhooks. Nao ha autenticacao.
- [ ] **[Critico]** Associa webhook a tenant/usuario e evita IDOR. Ha uma URL global em memoria.
- [ ] **[Importante]** Limita quantidade de webhooks por usuario/tenant. Nao ha controle por usuario.

## Disparo HTTP
- [ ] **[Critico]** Usa timeout curto. O `axios.post` nao define timeout.
- [ ] **[Importante]** Evita dados internos/sensiveis no payload. Repassa o corpo recebido como payload.
- [ ] **[Importante]** Usa fila assincrona isolada. O envio ocorre diretamente na requisicao.
- [ ] **[Importante]** Limita redirects e revalida cada destino. Nao ha configuracao.
- [ ] **[Recomendado]** Nao registra corpo da resposta sem sanitizacao. O codigo nao implementa auditoria; tambem nao controla logs de erro.

## Retry
- [ ] **[Importante]** Usa backoff exponencial.
- [ ] **[Importante]** Limita total de retentativas.
- [ ] **[Recomendado]** Inclui chave de idempotencia no payload.

## Integridade
- [ ] **[Importante]** Assina com HMAC-SHA256.
- [ ] **[Importante]** Inclui timestamp na assinatura.

## Auditoria e observabilidade
- [ ] **[Recomendado]** Registra tentativas com URL, status, timestamp e duracao.
- [ ] **[Recomendado]** Desativa webhook e alerta apos falhas consecutivas.

