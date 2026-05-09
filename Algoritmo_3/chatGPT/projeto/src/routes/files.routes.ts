import { Router } from "express";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

router.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Arquivo não enviado"
      });
    }

    return res.status(201).json({
      message: "Upload realizado com sucesso",
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: `/files/${req.file.filename}`
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: "Erro interno"
    });
  }
});

router.get("/files/:filename", (req, res) => {
  try {
    const filename = path.basename(req.params.filename);

    const filePath = path.resolve("uploads", filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: "Arquivo não encontrado"
      });
    }

    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    res.setHeader("Content-Type", mimeType);

    // Segurança contra XSS em arquivos
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({
      error: "Erro ao renderizar arquivo"
    });
  }
});

export default router;