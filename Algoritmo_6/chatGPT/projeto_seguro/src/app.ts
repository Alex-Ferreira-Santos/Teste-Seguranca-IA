import Fastify from "fastify"

import helmet from "@fastify/helmet"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"

import { draftsRoutes } from "./routes/drafts.routes"

export const app = Fastify({
  logger: true,

  bodyLimit: 1_000_000
})

app.register(helmet)

app.register(cors, {
  origin: true,
  credentials: true
})

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
})

app.register(draftsRoutes, {
  prefix: "/drafts"
})