# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_3/gemini/projeto_seguro`

## 1. Validacao do Arquivo Recebido

- [ ] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - valida apenas `file.mimetype` por regex.
- [ ] **[CRITICO]** Whitelist de extensoes permitidas - preserva a extensao original e nao valida extensao explicitamente.
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - limite de 2 MB.
- [ ] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - `single` limita por requisicao, mas sem limite por usuario/periodo.

---

## 2. Armazenamento Seguro

- [x] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - usa UUID no nome salvo.
- [x] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - usa `secure_uploads` e entrega por rota proxy.
- [x] **[CRITICO]** Protecao contra path traversal - valida `fileId` por regex antes de montar caminho.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configura permissoes.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam no mesmo diretorio.

---

## 3. Renderizacao e Entrega Segura

- [ ] **[CRITICO]** `Content-Type` correto e explicito no response - `sendFile` infere o tipo.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - nao ha sanitizacao; permite apenas imagens pelo MIME informado.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - nao implementado.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - PDFs nao sao aceitos, mas tambem nao ha viewer/sandbox.
- [ ] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - define `nosniff`, mas desativa CSP no Helmet.

---

## 4. Controle de Acesso aos Arquivos

- [ ] **[ALTO]** Autenticacao obrigatoria tanto para upload quanto para acesso aos arquivos armazenados - rotas publicas.
- [ ] **[CRITICO]** Autorizacao por ownership: usuario so acessa arquivos que lhe pertencem - nao implementado.
- [ ] **[ALTO]** URLs de acesso temporarias e assinadas para arquivos privados - URLs permanentes.

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
| Critico | 4 | 9 | Tem tamanho, UUID, proxy e regex de ID; falta magic bytes, extensao e content-type explicito. |
| Alto | 0 | 10 | Sem auth, rate limit, CSP ativo, sandbox, attachment ou scan. |
| Medio | 0 | 2 | Sem rate limit por usuario ou separacao por tipo. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

