import { Router } from "express";
import path from "path";
import fs from "fs";
import mime from "mime-types";

import { upload } from "../middleware/upload";

const router = Router();

router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "No file uploaded",
    });
  }

  return res.status(201).json({
    fileId: req.file.filename,
    url: `/files/${req.file.filename}`,
  });
});

router.get("/:fileId", (req, res) => {
  const fileId = path.basename(req.params.fileId);

  const fullPath = path.resolve(
    __dirname,
    "../storage/uploads",
    fileId
  );

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({
      error: "File not found",
    });
  }

  const mimeType = mime.lookup(fullPath) || "application/octet-stream";

  res.setHeader("X-Content-Type-Options", "nosniff");

  // evita execução inline de conteúdo perigoso
  res.setHeader(
    "Content-Disposition",
    "inline; filename=\"file\""
  );

  res.setHeader("Content-Type", mimeType);

  return res.sendFile(fullPath);
});

export default router;