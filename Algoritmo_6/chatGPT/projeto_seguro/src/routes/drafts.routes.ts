import { FastifyInstance } from "fastify"
import { PrismaClient } from "@prisma/client"

import { formSchema } from "../schemas/form.schema"
import { sanitizeObject } from "../utils/sanitize"
import { authMiddleware } from "../plugins/auth"

const prisma = new PrismaClient()

export async function draftsRoutes(app: FastifyInstance) {

  app.addHook("preHandler", authMiddleware)

  app.post("/", async (request, reply) => {
    const sanitized = sanitizeObject(request.body)

    const parsed = formSchema.safeParse(sanitized)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid form payload",
        details: parsed.error.flatten()
      })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const draft = await prisma.formDraft.upsert({
      where: {
        userId: request.user.id
      },

      update: {
        data: parsed.data,
        formVersion: 1,
        expiresAt
      },

      create: {
        userId: request.user.id,
        data: parsed.data,
        formVersion: 1,
        expiresAt
      }
    })

    return reply.send({
      success: true,
      draft
    })
  })

  app.get("/", async (request, reply) => {
    const draft = await prisma.formDraft.findUnique({
      where: {
        userId: request.user.id
      }
    })

    if (!draft) {
      return reply.status(404).send({
        error: "Draft not found"
      })
    }

    return reply.send({
      success: true,
      draft
    })
  })

  app.delete("/", async (request, reply) => {
    await prisma.formDraft.deleteMany({
      where: {
        userId: request.user.id
      }
    })

    return reply.send({
      success: true
    })
  })
}