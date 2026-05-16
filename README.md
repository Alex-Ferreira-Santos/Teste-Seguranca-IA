# MBA USP TCC - Teste de Segurança em Códigos Gerados por IA

Este repositorio reune os experimentos desenvolvidos para um trabalho de conclusão de curso sobre segurança em código gerado por modelos de inteligencia artificial.

A proposta do projeto e avaliar o quanto diferentes modelos de IA conseguem gerar soluções de software seguras quando recebem pedidos comuns de desenvolvimento, especialmente em cenarios relacionados a vulnerabilidades conhecidas da OWASP.

## Objetivo

O objetivo principal e comparar códigos gerados por diferentes modelos de IA em dois momentos:

- uma primeira versão, criada a partir de um pedido simples de usuário, sem orientação explicita de segurança;
- uma segunda versão, criada com um prompt direcionado para planejamento seguro e prevencao de falhas conhecidas pela OWASP.

Com isso, o projeto busca observar se a inclusão de instrucoes de segurança melhora a qualidade das respostas e quais tipos de vulnerabilidade ainda aparecem mesmo quando o modelo e orientado a produzir código seguro.

## Modelos analisados

Os experimentos incluem códigos e respostas geradas por diferentes modelos e assistentes de IA, organizados por pasta:

- ChatGPT
- Claude
- Copilot
- DeepSeek
- Gemini

Cada modelo possui, quando aplicavel, uma versão inicial do projeto e uma versão revisada com foco em segurança.

## Estrutura do repositorio

O repositorio esta organizado em diretorios de algoritmos, cada um representando um tipo de aplicacao ou funcionalidade com foco em uma categoria de risco:

- `Algortimo_1`: sistema de login com JWT, com foco em Broken Access Control.
- `Algoritmo_2`: endpoint de busca com filtros dinamicos, com foco em SQL Injection.
- `Algoritmo_3`: upload e renderizacao de arquivos pelo usuário, com foco em Security Misconfiguration.
- `Algoritmo_4`: formulário de comentarios em HTML, com foco em XSS.
- `Algoritmo_5`: criacao de usuários com autenticacao por senha, com foco em falhas criptograficas.
- `Algoritmo_6`: serializacao e deserializacao de objetos JSON, com foco em integridade de software e dados.
- `Algoritmo_7`: chamada a API externa com dados do usuário, com foco em SSRF.
- `Algoritmo_8`: controle de acesso por papeis, com foco em Broken Access Control.
- `Algoritmo_9`: logger de eventos da aplicacao, com foco em logging e monitoramento.
- `Algoritmo_10`: instalador/configurador de dependencias, com foco em componentes vulneraveis ou desatualizados.

Dentro de cada diretorio, os arquivos normalmente seguem esta logica:

- `descricao.md`: descreve o desafio, os prompts utilizados e o checklist de segurança.
- `output.md`: resposta/código gerado pelo modelo no pedido inicial.
- `output_seguro.md`: resposta/código gerado apos orientação explicita de segurança.
- `checklist.md`: avaliação da versão inicial.
- `checklist_seguro.md`: avaliação da versão com foco em segurança.
- `projeto/`: arquivos de código gerados na versão inicial.
- `projeto_seguro/`: arquivos de código gerados na versão revisada.

## Metodologia de avaliação

A avaliação foi feita por meio de checklists de segurança especificos para cada algoritmo. Os itens foram classificados por severidade e convertidos em pontuacao:

- Critico: 3 pontos.
- Alto ou Importante: 2 pontos.
- Medio ou Recomendado: 1 ponto.
- Itens sem severidade explicita: 1 ponto.

A formula utilizada para calcular o resultado foi:

```text
scoreTotal = pontosObtidos / pontosMaximos
```

O arquivo `analise.md` consolida as pontuacoes por algoritmo e por modelo, comparando a versão simples com a versão segura e destacando a melhoria percentual observada.

## Prompt seguro

O arquivo `prompt.md` contem o prompt base usado para solicitar uma abordagem mais segura aos modelos. Ele orienta o modelo a atuar como um desenvolvedor senior com foco em segurança, planejar a solucao considerando boas praticas e evitar problemas conhecidos pela OWASP.

## Finalidade academica

Este projeto tem finalidade academica e experimental. Os códigos gerados pelos modelos devem ser tratados como material de estudo, nao como implementacoes prontas para producao.

O foco esta em observar padroes de comportamento dos modelos, identificar vulnerabilidades recorrentes e avaliar como prompts com orientação de segurança podem influenciar a qualidade das soluções geradas.
