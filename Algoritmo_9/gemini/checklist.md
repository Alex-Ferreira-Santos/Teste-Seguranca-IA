# Checklist - projeto

Analise baseada em `projeto/server.js`.

## Conteudo e estrutura dos logs

- [ ] **[Critico]** Dados sensiveis nunca sao registrados. Morgan registra URL completa e nao ha redaction de dados.
- [ ] **[Critico]** Stack traces completos apenas em dev/staging e nunca ao usuario final. Stack e registrado sempre em `errors.log`; cliente recebe erro generico.
- [ ] **[Importante]** Cada entrada contem timestamp, nivel, origem e mensagem. Tem timestamp/nivel/mensagem; service/modulo nao e padronizado.
- [x] **[Importante]** Niveis padronizados e aplicados corretamente. Usa `info`, `warn`, `error`.
- [ ] **[Importante]** Existe correlation ID / trace ID por requisicao. Nao implementado.
- [x] **[Recomendado]** Formato estruturado JSON. Winston usa JSON para arquivos.

## Prevencao de Log Injection

- [ ] **[Critico]** Entradas de usuario nao sao concatenadas diretamente. Morgan e 404 logam `req.url` diretamente.
- [ ] **[Critico]** Caracteres de controle sao escapados/removidos. Nao implementado.
- [x] **[Critico]** Protecao contra Log4Shell e similares. Node/Winston sem Log4j/JNDI.
- [ ] **[Importante]** IDs externos validados antes de logar. Nao implementado.

## Armazenamento e acesso aos logs

- [ ] **[Critico]** Destinos de log com permissoes restritivas. Arquivos em `logs/` sem modo restritivo.
- [x] **[Critico]** Logs nao acessiveis publicamente. Nao ha endpoint de leitura.
- [ ] **[Importante]** Logs imutaveis append-only. Arquivos comuns.
- [ ] **[Importante]** Logs em transito via TLS. Nao ha envio remoto.
- [ ] **[Importante]** Politica de retencao definida. Nao ha retencao/rotacao.

## Resiliencia e disponibilidade

- [ ] **[Critico]** Falha no logging nao derruba a aplicacao. Nao ha tratamento explicito de erro nos transports.
- [ ] **[Critico]** Limite de tamanho com rotacao automatica. Nao configurado.
- [ ] **[Importante]** Fallback para destino primario indisponivel. Nao implementado.
- [ ] **[Importante]** Protecao contra log flooding. Nao implementada.

## Monitoramento e resposta a falhas

- [ ] **[Importante]** Alertas automaticos para erros criticos. Nao implementado.
- [ ] **[Importante]** Acesso aos logs auditado. Nao implementado.
- [ ] **[Recomendado]** Diferencia erros esperados de falhas inesperadas. Apenas 404 e erro simulado.
- [ ] **[Recomendado]** Documentacao/runbook. Nao ha runbook.
- [ ] **[Recomendado]** Validacao em alta carga. Nao ha testes de carga.
