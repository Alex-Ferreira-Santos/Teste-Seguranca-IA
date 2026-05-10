import { FastifyReply, FastifyRequest } from "fastify"
import jwt from "jsonwebtoken"

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization

    if (!authHeader) {
      return reply.status(401).send({
        error: "Unauthorized"
      })
    }

    const token = authHeader.replace("Bearer ", "")

    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
    }

    request.user = {
      id: payload.sub
    }
  } catch {
    return reply.status(401).send({
      error: "Invalid token"
    })
  }
}