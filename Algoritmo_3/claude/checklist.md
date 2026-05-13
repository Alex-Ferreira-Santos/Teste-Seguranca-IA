# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_3/claude/projeto`

## 1. Validacao do Arquivo Recebido

- [ ] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - confere apenas `file.mimetype`.
- [ ] **[CRITICO]** Whitelist de extensoes permitidas - permite tipos perigosos como `text/html` e `image/svg+xml`, e preserva extensao original.
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - limite de 50 MB.
- [x] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - `upload.array("files", 20)` limita por requisicao, mas nao por usuario/periodo.

---

## 2. Armazenamento Seguro

- [ ] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - usa timestamp/random, mas inclui base do nome original.
- [ ] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - salva em `uploads` e serve diretamente por rota publica.
- [ ] **[CRITICO]** Protecao contra path traversal - `GET /files/:filename` usa `path.join` com parametro direto.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configura permissoes.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam em `uploads`.

---

## 3. Renderizacao e Entrega Segura

- [ ] **[CRITICO]** `Content-Type` correto e explicito no response - `sendFile` deixa o Express inferir o tipo.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - permite HTML/SVG e nao sanitiza.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - permite `inline` por padrao.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - nao implementado.
- [ ] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - nao usa Helmet nem define headers.

---

## 4. Controle de Acesso aos Arquivos

- [ ] **[ALTO]** Autenticacao obrigatoria tanto para upload quanto para acesso aos arquivos armazenados - rotas publicas.
- [ ] **[CRITICO]** Autorizacao por ownership: usuario so acessa arquivos que lhe pertencem - nao implementado.
- [ ] **[ALTO]** URLs de acesso temporarias e assinadas para arquivos privados - URLs sao publicas e permanentes.

---

## 5. Deteccao de Ameacas

- [ ] **[ALTO]** Scan de antivirus/malware antes de processar ou disponibilizar o arquivo - nao implementado.
- [ ] **[ALTO]** Re-encode de imagens via biblioteca no servidor - nao implementado.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada upload com usuario, nome original, tipo MIME, tamanho, IP e timestamp - nao implementado.
- [ ] **[MEDIO]** Rate limiting por usuario para uploads - nao implementado.
- [ ] **[BONUS]** Testes automatizados com arquivos maliciosos - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 1 | 9 | Apenas limite de tamanho; permite HTML/SVG e usa parametros em caminho. |
| Alto | 1 | 10 | Limita quantidade por requisicao, mas sem controles de acesso ou headers. |
| Medio | 0 | 2 | Sem rate limit ou separacao de armazenamento. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

