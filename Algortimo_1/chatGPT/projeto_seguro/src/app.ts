import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes";
import { errorMiddleware } from "./middlewares/error.middleware";
import { authRateLimit } from "./middlewares/rate-limit.middleware";

import { env } from "./config/env";

const app = express();

app.use(helmet());

app.use(express.json({
  limit: "10kb"
}));

app.use(cookieParser());

app.use(cors({
  origin: env.clientUrl,
  credentials: true
}));

app.use("/auth", authRateLimit, authRoutes);

app.use(errorMiddleware);

export default app;