# Checklist - projeto_seguro

Analise baseada em `projeto_seguro/logger.ts` e `projeto_seguro/server.ts`.

## Conteudo e estrutura dos logs

- [ ] **[Critico]** Dados sensiveis nunca sao registrados. `sanitize` cobre padroes simples na mensagem, mas nao sanitiza `context`.
- [x] **[Critico]** Stack traces completos apenas em dev/staging e nunca ao usuario final. Nao registra stack e retorna erro generico.
- [ ] **[Importante]** Cada entrada contem timestamp, nivel, origem e mensagem. Tem timestamp/nivel/mensagem, mas nao service/modulo.
- [x] **[Importante]** Niveis padronizados e aplicados corretamente. Enum `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL`.
- [ ] **[Importante]** Existe correlation ID / trace ID por requisicao. Nao implementado.
- [x] **[Recomendado]** Formato estruturado JSON. Entrada e JSON antes de criptografar.

## Prevencao de Log Injection

- [ ] **[Critico]** Entradas de usuario nao sao concatenadas diretamente. Endpoint `/log` permite message/context enviados pelo usuario.
- [ ] **[Critico]** Caracteres de controle sao escapados/removidos. Nao implementado.
- [x] **[Critico]** Protecao contra Log4Shell e similares. Node sem Log4j/JNDI.
- [ ] **[Importante]** IDs externos validados antes de logar. Nao ha validacao de `level`, mensagem ou contexto alem de campos obrigatorios.

## Armazenamento e acesso aos logs

- [x] **[Critico]** Destinos de log com permissoes restritivas. Pasta `logs` criada com `0700` e arquivo com `0600`.
- [x] **[Critico]** Logs nao acessiveis publicamente. Nao ha endpoint para leitura de logs.
- [ ] **[Importante]** Logs imutaveis append-only. Usa append, mas sem garantia de imutabilidade.
- [ ] **[Importante]** Logs em transito via TLS. Nao ha transporte remoto.
- [ ] **[Importante]** Politica de retencao definida. Nao ha retencao/rotacao.

## Resiliencia e disponibilidade

- [ ] **[Critico]** Falha no logging nao derruba a aplicacao. Usa `appendFileSync`; falha pode bloquear/lancar no fluxo.
- [ ] **[Critico]** Limite de tamanho com rotacao automatica. Nao implementado.
- [ ] **[Importante]** Fallback para destino primario indisponivel. Nao implementado.
- [ ] **[Importante]** Protecao contra log flooding. Endpoint `/log` pode gerar volume arbitrario.

## Monitoramento e resposta a falhas

- [ ] **[Importante]** Alertas automaticos para erros criticos. Nao implementado.
- [ ] **[Importante]** Acesso aos logs auditado. Nao ha consulta.
- [ ] **[Recomendado]** Diferencia erros esperados de falhas inesperadas. Apenas WARN para entrada invalida e ERROR para falha.
- [ ] **[Recomendado]** Documentacao/runbook. Nao ha runbook.
- [ ] **[Recomendado]** Validacao em alta carga. Nao ha testes de carga.
