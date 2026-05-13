# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_3/chatGPT/projeto_seguro`

## 1. Validacao do Arquivo Recebido

- [ ] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - valida `file.mimetype`, mas nao magic bytes.
- [x] **[CRITICO]** Whitelist de extensoes permitidas - aceita somente `.jpg`, `.jpeg`, `.png` e `.pdf`.
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - `fileSize` de 5 MB.
- [ ] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - limita `files: 1`, mas nao ha limite por usuario/periodo.

---

## 2. Armazenamento Seguro

- [x] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - salva com UUID.
- [x] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - usa `storage/uploads` e entrega por rota, sem `express.static`.
- [x] **[CRITICO]** Protecao contra path traversal - usa UUID no upload e `path.basename` no acesso.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configura permissoes.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam no mesmo diretorio.

---

## 3. Renderizacao e Entrega Segura

- [x] **[CRITICO]** `Content-Type` correto e explicito no response - usa `mime.lookup` e define `Content-Type`.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - nao ha sanitizacao; esses tipos nao estao na allowlist, mas spoofing ainda dependeria de magic bytes ausentes.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - define `inline` para todos.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - nao implementado.
- [x] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - usa `helmet()` e `nosniff`.

---

## 4. Controle de Acesso aos Arquivos

- [ ] **[ALTO]** Autenticacao obrigatoria tanto para upload quanto para acesso aos arquivos armazenados - rotas sao publicas.
- [ ] **[CRITICO]** Autorizacao por ownership: usuario so acessa arquivos que lhe pertencem - nao implementado.
- [ ] **[ALTO]** URLs de acesso temporarias e assinadas para arquivos privados - retorna URL fixa `/files/:filename`.

---

## 5. Deteccao de Ameacas

- [ ] **[ALTO]** Scan de antivirus/malware antes de processar ou disponibilizar o arquivo - nao implementado.
- [ ] **[ALTO]** Re-encode de imagens via biblioteca no servidor - nao implementado.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada upload com usuario, nome original, tipo MIME, tamanho, IP e timestamp - nao implementado.
- [x] **[MEDIO]** Rate limiting por usuario para uploads - ha `express-rate-limit`, mas e global por IP, nao por usuario autenticado.
- [ ] **[BONUS]** Testes automatizados com arquivos maliciosos - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 6 | 9 | Boa base de extensao, UUID e entrega controlada; falta magic bytes, sanitizacao e ownership. |
| Alto | 1 | 10 | Headers existem, mas faltam autenticacao, sandbox, attachment e analise de ameacas. |
| Medio | 1 | 2 | Rate limit existe por IP; sem separacao por tipo. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

