# Checklist - projeto

Analise baseada em `projeto/server.js`.

## Conteudo e estrutura dos logs

- [ ] **[Critico]** Dados sensiveis nunca sao registrados. URL e mensagens sao logadas sem mascara de dados sensiveis.
- [x] **[Critico]** Stack traces completos apenas em dev/staging e nunca ao usuario final. O exemplo nao registra stack nem a expoe ao usuario.
- [ ] **[Importante]** Cada entrada contem timestamp, nivel, origem e mensagem. Tem timestamp/nivel/mensagem, mas nao service/modulo.
- [x] **[Importante]** Niveis padronizados e aplicados corretamente. Usa `debug`, `info`, `error`.
- [ ] **[Importante]** Existe correlation ID / trace ID por requisicao. Nao implementado.
- [ ] **[Recomendado]** Formato estruturado JSON. Usa string formatada.

## Prevencao de Log Injection

- [ ] **[Critico]** Entradas de usuario nao sao concatenadas diretamente. `req.url` e `error.message` sao concatenados na mensagem.
- [ ] **[Critico]** Caracteres de controle sao escapados/removidos. Nao implementado.
- [x] **[Critico]** Protecao contra Log4Shell e similares. Node/Winston sem Log4j/JNDI.
- [ ] **[Importante]** IDs externos validados antes de logar. Nao implementado.

## Armazenamento e acesso aos logs

- [ ] **[Critico]** Destinos de log com permissoes restritivas. `api.log` sem modo restritivo.
- [x] **[Critico]** Logs nao acessiveis publicamente. Nao ha endpoint de leitura.
- [ ] **[Importante]** Logs imutaveis append-only. Arquivo comum.
- [ ] **[Importante]** Logs em transito via TLS. Nao ha envio remoto.
- [ ] **[Importante]** Politica de retencao definida. Nao ha rotacao/retencao.

## Resiliencia e disponibilidade

- [ ] **[Critico]** Falha no logging nao derruba a aplicacao. Nao ha tratamento explicito de falhas no transporte.
- [ ] **[Critico]** Limite de tamanho com rotacao automatica. Nao configurado.
- [ ] **[Importante]** Fallback para destino primario indisponivel. Nao implementado.
- [ ] **[Importante]** Protecao contra log flooding. Nao implementada.

## Monitoramento e resposta a falhas

- [ ] **[Importante]** Alertas automaticos para erros criticos. Nao implementado.
- [ ] **[Importante]** Acesso aos logs auditado. Nao implementado.
- [ ] **[Recomendado]** Diferencia erros esperados de falhas inesperadas. Apenas erro simulado.
- [ ] **[Recomendado]** Documentacao/runbook. Nao ha runbook.
- [ ] **[Recomendado]** Validacao em alta carga. Nao ha testes de carga.
