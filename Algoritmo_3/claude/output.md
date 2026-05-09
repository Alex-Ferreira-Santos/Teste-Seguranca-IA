# Algoritmo 3 - claude Output
Vou criar uma implementação completa com backend (Node.js/Express) e frontend para upload, armazenamento e visualização de arquivos.Aqui está a implementação completa. Três arquivos:

---

### `server.js` — Backend Express

Quatro endpoints:

| Método | Rota | O que faz |
|--------|------|-----------|
| `POST` | `/upload` | Recebe `multipart/form-data`, salva em `/uploads/` e retorna metadados + URL |
| `GET` | `/files` | Lista todos os arquivos salvos |
| `GET` | `/files/:filename` | Serve o arquivo — renderiza inline no browser (ou força download com `?download=1`) |
| `DELETE` | `/files/:filename` | Remove o arquivo do disco |

O **Multer** cuida do parse do multipart, renomeia com timestamp para evitar colisões, valida o MIME type e limita a 50 MB por arquivo.

---

### `index.html` — Frontend

- Drag & drop ou seleção via botão
- Barra de progresso com `XMLHttpRequest.upload.onprogress`
- Grid de cards com preview das imagens diretamente do servidor
- Botões de abrir (inline), baixar e deletar
- Toasts de feedback

---

### Como rodar

```bash
npm install
npm start
# → http://localhost:3000
```

Abra o `index.html` no browser (ou sirva-o via qualquer servidor estático). Se precisar mudar a origem da API, ajuste a variável `API` no início do script do HTML.

> **Ajustes comuns:** para produção, adicione autenticação nos endpoints, configure um limite de disco por usuário e sirva o `index.html` pelo próprio Express com `express.static`.
