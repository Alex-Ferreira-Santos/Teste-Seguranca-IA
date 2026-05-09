import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import fs from "fs";

import filesRouter from "./routes/files";

const app = express();

app.use(helmet());

app.use(express.json());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

const uploadDir = path.resolve(__dirname, "storage/uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use("/files", filesRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});