# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_3/copilot/projeto_seguro`

## 1. Validacao do Arquivo Recebido

- [ ] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - valida extensao, mas nao MIME real/magic bytes.
- [x] **[CRITICO]** Whitelist de extensoes permitidas - permite `.png`, `.jpg`, `.jpeg` e `.pdf`.
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - limite de 5 MB.
- [ ] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - `single` limita por requisicao, mas sem limite por usuario/periodo.

---

## 2. Armazenamento Seguro

- [x] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - usa `crypto.randomBytes(16)`.
- [x] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - entrega via rota `/files/:id`, sem `express.static`.
- [ ] **[CRITICO]** Protecao contra path traversal - usa `path.join(UPLOAD_DIR, req.params.id)` e checa `startsWith`, mas sem `path.resolve`; prefixos semelhantes podem burlar a intencao.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configura permissoes.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam no mesmo diretorio.

---

## 3. Renderizacao e Entrega Segura

- [ ] **[CRITICO]** `Content-Type` correto e explicito no response - `sendFile` infere o tipo.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - nao ha sanitizacao; esses tipos nao estao na extensao permitida.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - nao implementado.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - nao implementado.
- [x] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - usa `helmet()` e define `nosniff` na entrega.

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
| Critico | 4 | 9 | Tem extensao, tamanho e nome aleatorio; falta magic bytes, content-type explicito e acesso. |
| Alto | 1 | 10 | Headers existem; sem auth, rate limit, sandbox, attachment ou scan. |
| Medio | 0 | 2 | Sem rate limit por usuario ou separacao por tipo. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

