import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { PrismaClient } from "@prisma/client";

import usersRouter from "./routes/users";

export const prisma = new PrismaClient();

const app = express();

app.use(express.json());

/**
 * Headers de segurança
 */
app.use(helmet());

/**
 * Rate limit contra abuso
 */
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300
  })
);

app.use("/users", usersRouter);

app.listen(3000, () => {
  console.log("Server running");
});