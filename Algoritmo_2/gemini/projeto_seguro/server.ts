import Fastify from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

/**
 * SCHEMA DE VALIDAÇÃO (OWASP: Input Validation)
 * Garante que apenas campos permitidos e tipos corretos cheguem ao DB.
 */
const SearchQuerySchema = z.object({
  name: z.string().optional(),
  role: z.enum(['ADMIN', 'USER', 'GUEST']).optional(),
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('10'),
});

// Endpoint de Busca
fastify.get('/users/search', async (request, reply) => {
  try {
    // 1. Sanitização imediata do Input
    const query = SearchQuerySchema.parse(request.query);
    
    const { page, limit, name, role } = query;
    const skip = (page - 1) * limit;

    // 2. Construção segura do filtro (Allowlist)
    const whereClause: any = {};
    if (name) whereClause.name = { contains: name, mode: 'insensitive' };
    if (role) whereClause.role = role;

    // 3. Execução com Projeção de Dados (OWASP: Proteção contra Exposição de Dados)
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: { 
          id: true, 
          name: true, 
          email: true, 
          role: true 
          // password_hash omitido propositalmente
        },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return {
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      results: data,
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({ error: "Invalid Query Parameters", details: error.errors });
    }
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

// Inicialização
const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log("Server running at http://localhost:3000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();