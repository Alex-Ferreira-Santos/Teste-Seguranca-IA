# Checklist de Seguranca - Analise do projeto

Projeto analisado: `Algoritmo_3/deepseek/projeto`

## 1. Validacao do Arquivo Recebido

- [ ] **[CRITICO]** Whitelist de tipos MIME permitidos validada no servidor, lendo magic bytes - regex valida `file.mimetype`, sem magic bytes.
- [x] **[CRITICO]** Whitelist de extensoes permitidas - permite apenas extensoes no regex (`jpeg`, `jpg`, `png`, `gif`, `pdf`, `txt`, `mp4`, `mp3`).
- [x] **[CRITICO]** Limite maximo de tamanho de arquivo configurado no backend - limite de 10 MB.
- [ ] **[ALTO]** Validacao do numero maximo de arquivos por requisicao e por usuario/periodo - `single` limita por requisicao, mas nao por usuario/periodo.

---

## 2. Armazenamento Seguro

- [ ] **[CRITICO]** Nome do arquivo gerado pelo servidor (UUID ou hash) - usa timestamp/random com extensao original, previsivel.
- [ ] **[CRITICO]** Armazenamento fora do webroot ou em bucket isolado sem acesso publico direto - `uploads` e exposto por `express.static`.
- [ ] **[CRITICO]** Protecao contra path traversal - delete usa `path.join('./uploads', filename)` diretamente.
- [ ] **[ALTO]** Permissoes minimas no diretorio de upload, sem permissao de execucao - nao configurado.
- [ ] **[MEDIO]** Arquivos de tipos diferentes armazenados em buckets ou diretorios separados - todos ficam em `uploads`.

---

## 3. Renderizacao e Entrega Segura

- [ ] **[CRITICO]** `Content-Type` correto e explicito no response - `express.static` infere o tipo.
- [ ] **[CRITICO]** Sanitizacao de HTML e SVG antes de renderizar - nao ha sanitizacao; SVG/HTML nao estao permitidos pelo regex, mas a validacao confia no MIME.
- [ ] **[ALTO]** Header `Content-Disposition: attachment` para tipos que nao devem ser renderizados inline - nao implementado.
- [ ] **[ALTO]** PDFs renderizados em sandbox (`<iframe sandbox>` ou viewer isolado) - nao implementado.
- [ ] **[ALTO]** Headers de seguranca no response: `X-Content-Type-Options: nosniff` e `Content-Security-Policy` - nao configurado.

---

## 4. Controle de Acesso aos Arquivos

- [ ] **[ALTO]** Autenticacao obrigatoria tanto para upload quanto para acesso aos arquivos armazenados - rotas publicas.
- [ ] **[CRITICO]** Autorizacao por ownership: usuario so acessa arquivos que lhe pertencem - nao implementado.
- [ ] **[ALTO]** URLs de acesso temporarias e assinadas para arquivos privados - URLs publicas e permanentes.

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
| Critico | 2 | 9 | Tem extensao e tamanho, mas arquivos ficam publicos e sem magic bytes. |
| Alto | 0 | 10 | Sem acesso, headers, rate limit, sandbox ou deteccao. |
| Medio | 0 | 2 | Sem rate limit ou separacao por tipo. |
| Bonus | 0 | 1 | Sem testes maliciosos. |

