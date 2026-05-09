
import { FastifyInstance } from "fastify";
import { z } from "zod";

import { prisma } from "../prisma";

import {
  generateActivationToken,
  hashToken
} from "../services/token.service";

import { sendActivationEmail } from "../services/mail.service";

export async function usersRoutes(app: FastifyInstance) {

  app.post("/users", async (request, reply) => {

    const bodySchema = z.object({
      name: z.string().min(2),
      email: z.string().email()
    });

    const { name, email } = bodySchema.parse(request.body);

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return reply.status(400).send({
        message: "Usuário já existe"
      });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email
      }
    });

    const rawToken = generateActivationToken();

    const tokenHash = hashToken(rawToken);

    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 15
    );

    await prisma.activationToken.create({
      data: {
        tokenHash,
        expiresAt,
        userId: user.id
      }
    });

    await sendActivationEmail(email, rawToken);

    return reply.status(201).send({
      message: "Usuário criado com sucesso"
    });
  });
}