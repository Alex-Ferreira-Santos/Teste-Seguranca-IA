# Checklist - projeto

Analise baseada em `projeto/logger.ts`, `projeto/httpLogger.ts`, `projeto/errorHandler.ts` e `projeto/index.ts`.

## Conteudo e estrutura dos logs

- [ ] **[Critico]** Dados sensiveis nunca sao registrados. `sanitizeBody` mascara parte do body, mas query, headers parciais e outros metadados nao passam por sanitizacao completa.
- [x] **[Critico]** Stack traces completos apenas em dev/staging e nunca ao usuario final. Resposta inclui stack apenas fora de producao.
- [x] **[Importante]** Cada entrada contem timestamp, nivel, origem e mensagem. Winston tem timestamp/nivel/mensagem, mas origem de servico nao e padronizada.
- [x] **[Importante]** Niveis padronizados e aplicados corretamente. Usa `error`, `warn`, `info`, `http`, `debug`.
- [x] **[Importante]** Existe correlation/request ID por requisicao. `httpLogger` usa `x-request-id` ou UUID.
- [x] **[Recomendado]** Formato estruturado JSON. Arquivos usam JSON.

## Prevencao de Log Injection

- [ ] **[Critico]** Entradas de usuario nao sao concatenadas diretamente. Mensagens como rota nao encontrada incluem URL em string.
- [ ] **[Critico]** Caracteres de controle sao escapados/removidos. Nao ha remocao explicita de `\n`, `\r`, `\t`.
- [x] **[Critico]** Protecao contra Log4Shell e similares. Node/Winston sem interpolacao Log4j/JNDI.
- [ ] **[Importante]** IDs externos validados antes de logar. `x-request-id`, `userId` e parametros nao sao validados.

## Armazenamento e acesso aos logs

- [ ] **[Critico]** Destinos de log com permissoes restritivas. Arquivos sao criados sem modo restritivo explicito.
- [x] **[Critico]** Logs nao acessiveis publicamente. Nao ha endpoint de leitura de logs.
- [ ] **[Importante]** Logs imutaveis append-only. Arquivos comuns rotacionaveis, sem integridade append-only.
- [ ] **[Importante]** Logs em transito via TLS. Nao ha envio remoto.
- [x] **[Importante]** Politica de retencao definida. `maxFiles` limita arquivos de logs.

## Resiliencia e disponibilidade

- [x] **[Critico]** Falha no logging nao derruba a aplicacao. `exitOnError: false`.
- [x] **[Critico]** Limite de tamanho com rotacao automatica. File transports usam `maxsize` e `maxFiles`.
- [ ] **[Importante]** Fallback para destino primario indisponivel. Console e arquivo coexistem, mas sem fallback formal.
- [ ] **[Importante]** Protecao contra log flooding. Nao ha rate limiting.

## Monitoramento e resposta a falhas

- [ ] **[Importante]** Alertas automaticos para erros criticos. Nao implementado.
- [ ] **[Importante]** Acesso aos logs auditado. Nao ha consulta de logs.
- [x] **[Recomendado]** Diferencia erros esperados de falhas inesperadas. `AppError.isOperational` e status 4xx/5xx diferenciam severidade.
- [ ] **[Recomendado]** Documentacao/runbook. Nao ha runbook.
- [ ] **[Recomendado]** Validacao em alta carga. Nao ha testes de carga.
