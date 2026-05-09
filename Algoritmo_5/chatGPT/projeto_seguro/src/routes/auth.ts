import { FastifyInstance } from "fastify";

import { z } from "zod";

import argon2 from "argon2";

import { prisma } from "../prisma";

import { hashToken } from "../services/token.service";

export async function authRoutes(app: FastifyInstance) {

  // =========================================================================
  // ATIVAÇÃO DE CONTA
  // =========================================================================

  app.post("/auth/activate", async (request, reply) => {

    const bodySchema = z.object({
      token: z.string().min(10),

      password: z
        .string()
        .min(12)
        .max(128)
    });

    const { token, password } =
      bodySchema.parse(request.body);

    const tokenHash = hashToken(token);

    const activationToken =
      await prisma.activationToken.findFirst({
        where: {
          tokenHash,
          used: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

    if (!activationToken) {
      return reply.status(400).send({
        message: "Token inválido"
      });
    }

    const passwordHash = await argon2.hash(
      password,
      {
        type: argon2.argon2id
      }
    );

    await prisma.user.update({
      where: {
        id: activationToken.user.id
      },
      data: {
        passwordHash,
        status: "ACTIVE"
      }
    });

    await prisma.activationToken.update({
      where: {
        id: activationToken.id
      },
      data: {
        used: true
      }
    });

    return reply.send({
      message: "Conta ativada com sucesso"
    });
  });

    // =========================================================================
  // LOGIN
  // =========================================================================

  app.post("/auth/login", async (request, reply) => {

    const bodySchema = z.object({
      email: z.string().email(),
      password: z.string()
    });

    const { email, password } =
      bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Anti enumeração
    if (!user || !user.passwordHash) {

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      return reply.status(401).send({
        message: "Email ou senha inválidos"
      });
    }

    const passwordMatches =
      await argon2.verify(
        user.passwordHash,
        password
      );

    if (!passwordMatches) {

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      return reply.status(401).send({
        message: "Email ou senha inválidos"
      });
    }

    const accessToken = await reply.jwtSign({
      sub: user.id
    });

    return reply.send({
      accessToken
    });
  });
}