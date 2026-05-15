# Checklist - projeto

Analise baseada em `projeto/app/logger.js`, `projeto/app/server.js` e `projeto/docker-compose.yml`.

## Conteudo e estrutura dos logs

- [ ] **[Critico]** Dados sensiveis nunca sao registrados. Nao ha redaction de senha, token, cookie ou headers.
- [ ] **[Critico]** Stack traces completos apenas em dev/staging e nunca ao usuario final. A rota `/erro` registra stack sempre e retorna `err.message` ao cliente.
- [x] **[Importante]** Cada entrada contem timestamp, nivel e mensagem. Winston adiciona timestamp e JSON; o servico/modulo nao aparece de forma padronizada.
- [x] **[Importante]** Niveis padronizados e aplicados corretamente. Usa `info` e `error`.
- [x] **[Importante]** Existe correlation/request ID por requisicao. Middleware gera `requestId`.
- [x] **[Recomendado]** Formato estruturado JSON. Logger usa `winston.format.json()`.

## Prevencao de Log Injection

- [ ] **[Critico]** Entradas de usuario nao sao concatenadas diretamente. URL e mensagens sao logadas sem sanitizacao explicita.
- [ ] **[Critico]** Caracteres de controle sao escapados/removidos. Nao ha tratamento de `\n`, `\r`, `\t`.
- [x] **[Critico]** Protecao contra Log4Shell e similares. Aplicacao Node/Winston nao usa interpolacao Log4j/JNDI.
- [ ] **[Importante]** IDs externos validados antes de logar. Nao ha validacao.

## Armazenamento e acesso aos logs

- [ ] **[Critico]** Destinos de log com permissoes restritivas. Volume `./logs:/logs` sem permissao definida.
- [ ] **[Critico]** Logs nao acessiveis publicamente. Grafana e Loki sao publicados em portas sem autenticacao forte; Grafana usa `admin/admin`.
- [ ] **[Importante]** Logs imutaveis append-only. Arquivo comum, sem protecao de integridade.
- [ ] **[Importante]** Logs em transito via TLS. Promtail/Loki local sem TLS.
- [ ] **[Importante]** Politica de retencao definida. Nao ha retencao/rotacao no logger.

## Resiliencia e disponibilidade

- [ ] **[Critico]** Falha no logging nao derruba a aplicacao. Nao ha handler/fallback explicito para erro no transporte.
- [ ] **[Critico]** Limite de tamanho com rotacao automatica. Nao configurado.
- [ ] **[Importante]** Fallback para destino primario indisponivel. Nao implementado.
- [ ] **[Importante]** Protecao contra log flooding. Nao implementada.

## Monitoramento e resposta a falhas

- [ ] **[Importante]** Alertas automaticos para erros criticos. Loki/Grafana existe, mas sem alertas configurados.
- [ ] **[Importante]** Acesso aos logs auditado. Nao implementado.
- [ ] **[Recomendado]** Diferencia erros esperados de falhas inesperadas. Apenas exemplo de erro 500.
- [ ] **[Recomendado]** Documentacao/runbook. Nao ha runbook.
- [ ] **[Recomendado]** Validacao em alta carga. Nao ha testes de carga.
