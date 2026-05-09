
import Fastify from "fastify";

import jwt from "@fastify/jwt";
import rateLimit from "@fastify/rate-limit";

import { env } from "./env";

import { usersRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";

const app = Fastify({
  logger: true
});

app.register(rateLimit, {
  max: 5,
  timeWindow: "1 minute"
});

app.register(jwt, {
  secret: env.JWT_SECRET
});


app.register(usersRoutes);
app.register(authRoutes);

// ============================================================================
// HEALTHCHECK
// ============================================================================

app.get("/health", async () => {
  return {
    status: "ok"
  };
});



// ============================================================================
// START
// ============================================================================

app.listen({
  port: env.PORT,
  host: "0.0.0.0"
})
.then(() => {
  console.log("HTTP Server Running");
});