# Algoritmo 3 - claude Output Seguro

Vou criar uma implementação completa e segura. Deixe-me planejar e desenvolver os arquivos.---

## O que foi entregue

4 arquivos prontos para uso:

| Arquivo | Descrição |
|---|---|
| `server.ts` | Servidor Express + TypeScript com todos os controles de segurança |
| `client.html` | Frontend com drag-and-drop, barra de progresso e galeria |
| `package.json` | Dependências |
| `tsconfig.json` | Configuração TypeScript |

---

## Arquitetura de segurança (OWASP mapeado)

### 🔴 Riscos mitigados

**A01 – Broken Access Control**
- Upload dir fica **fora do webroot** (`../private-uploads`). Nenhum arquivo é acessível diretamente via URL estática.
- Todo acesso passa pelo endpoint `/files/:id` que verifica autenticação antes de servir.
- Verificação dupla de *path traversal*: o caminho resolvido é validado para garantir que fica dentro de `UPLOAD_DIR`.

**A02 – Cryptographic Failures**
- SHA-256 calculado no buffer em memória antes de salvar. Hash retornado ao cliente para verificação de integridade.
- Nomes de arquivo substituídos por **UUID v4** — nenhuma informação do usuário vai para o sistema de arquivos.

**A03 – Injection**
- **Allowlist de MIME types** (`image/jpeg`, `image/png`, `image/gif`, `image/webp`, `application/pdf`, `text/plain`).
- Extensão derivada do MIME mapeado internamente — nunca do nome original do arquivo.
- Nenhum comando shell; sem `exec`, `spawn` ou interpolação de strings em paths.
- Regex UUID estrita no parâmetro `:id` bloqueia qualquer entrada malformada antes de tocar no disco.

**A04 – Insecure Design**
- Limite de 10 MB por arquivo.
- Rate limit de **20 uploads / 15 min** e **60 downloads / 1 min** por IP.
- Arquivos salvos com permissão `0o640` (sem execução).

**A05 – Security Misconfiguration**
- `helmet()` aplica todos os headers recomendados (CSP, HSTS, nosniff, etc.).
- `X-Content-Type-Options: nosniff` no serve de arquivos.
- CORS configurável via env `ALLOWED_ORIGIN`.

**A07 – Identification & Authentication Failures**
- Bearer token obrigatório em todos os endpoints. Stub documentado com `// TODO: validate JWT`.

**A08 – Software and Data Integrity Failures**
- Hash SHA-256 persistido no registry e exposto na listagem para auditoria.

**A09 – Security Logging & Monitoring**
- Winston com logs estruturados (JSON) em `audit.log`: `upload_success`, `upload_rejected`, `file_served`, `path_traversal_attempt`.

---

## Como rodar

```bash
npm install
npm run dev          # desenvolvimento
# ou
npm run build && npm start   # produção
```

Depois abra o `client.html` no browser (ou sirva via qualquer servidor estático).

---

## Próximos passos recomendados

1. **Substituir o auth stub** por validação real de JWT (`jsonwebtoken` + chave pública).
2. **Adicionar `file-type`** para verificação de magic bytes (defesa contra MIME spoofing no buffer).
3. **Mover o registry** para PostgreSQL/Redis com TTL de expiração de arquivos.
4. **Antivírus**: passar o buffer pelo ClamAV antes de persistir (via `clamscan`).
5. **CDN/objeto de storage** (S3 + CloudFront signed URLs) em vez de `sendFile` direto para escala.