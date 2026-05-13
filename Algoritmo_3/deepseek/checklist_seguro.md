# Checklist de Seguranca - Analise do projeto seguro

Projeto analisado: `Algoritmo_3/deepseek/projeto_seguro`

## 1. Validacao do Arquivo Recebido

- [x] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - valida MIME permitido e confere magic numbers para JPEG, PNG e PDF.
- [ ] **[CRITICO]** Whitelist de extensoes permitidas - nao ha allowlist de extensao separada; o nome seguro preserva parte sanitizada do original.
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - limite de 5 MB.
- [ ] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - `single` limita por requisicao e existe `MAX_FILES_PER_USER`, mas ele nao e aplicado.

---

## 2. Armazenamento Seguro

- [ ] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - cria `fileId` seguro, mas o nome em disco inclui timestamp e nome original sanitizado.
- [x] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - usa `secure_uploads` e entrega por rota, sem `express.static`.
- [x] **[CRITICO]** Protecao contra path traversal - usa `path.resolve` e checa se fica dentro de `UPLOAD_DIR`.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configura modo/permissoes.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam no mesmo diretorio.

---

## 3. Renderizacao e Entrega Segura

- [x] **[CRITICO]** `Content-Type` correto e explicito no response - usa `fileRecord.mimeType`.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - nao ha sanitizacao; HTML/SVG nao estao na allowlist.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - define `inline` para todos.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - nao implementado.
- [x] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - usa Helmet e define headers na entrega.

---

## 4. Controle de Acesso aos Arquivos

- [ ] **[ALTO]** Autenticacao obrigatoria tanto para upload quanto para acesso aos arquivos armazenados - upload aceita anonimo e `GET /api/file/:fileId` nao chama `authenticateUser`.
- [ ] **[CRITICO]** Autorizacao por ownership: usuario so acessa arquivos que lhe pertencem - acesso por arquivo nao valida dono; delete permite apagar arquivo anonimo se `req.userId` estiver ausente.
- [ ] **[ALTO]** URLs de acesso temporarias e assinadas para arquivos privados - gera token aleatorio na URL, mas a validacao do token esta comentada.

---

## 5. Deteccao de Ameacas

- [ ] **[ALTO]** Scan de antivirus/malware antes de processar ou disponibilizar o arquivo - utilitario ClamAV existe, mas chamada esta comentada.
- [ ] **[ALTO]** Re-encode de imagens via biblioteca no servidor - nao implementado.

---

## 6. Logging e Boas Praticas

- [ ] **[ALTO]** Log de cada upload com usuario, nome original, tipo MIME, tamanho, IP e timestamp - nao implementado; apenas erros sao logados.
- [ ] **[MEDIO]** Rate limiting por usuario para uploads - rate limit e por IP, nao por usuario.
- [ ] **[BONUS]** Testes automatizados com arquivos maliciosos - nao identificados.

---

## Resumo

| Nivel | Atendidos | Total | Observacao |
|---|:---:|:---:|---|
| Critico | 5 | 9 | Boa validacao por magic bytes e entrega, mas controle de acesso e signed URL estao incompletos. |
| Alto | 1 | 10 | Headers existem; limites por usuario, auth, malware scan e sandbox faltam. |
| Medio | 0 | 2 | Sem rate limit por usuario ou separacao por tipo. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

