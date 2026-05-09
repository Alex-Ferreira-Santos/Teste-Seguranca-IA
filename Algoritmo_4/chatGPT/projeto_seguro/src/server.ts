import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

import commentsRouter from "./routes/comments";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
  origin: ["https://seudominio.com"],
  methods: ["GET", "POST"],
}));

app.use(express.json({
  limit: "10kb"
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Muitas requisições. Tente novamente mais tarde."
  }
});

app.use("/api/comments", limiter);

app.use("/api/comments", commentsRouter);

app.use(errorHandler);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});