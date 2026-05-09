import { Router } from "express";
import { z } from "zod";
import { prisma } from "../server";
import { buildUserSearchQuery } from "../services/dynamic-search";

const router = Router();

/**
 * Schema de validação
 */
const searchSchema = z.object({
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "eq",
        "contains",
        "gt",
        "gte",
        "lt",
        "lte",
        "in"
      ]),
      value: z.any()
    })
  ).max(20),

  page: z.number().min(1).default(1),

  limit: z.number()
    .min(1)
    .max(100)
    .default(20),

  orderBy: z.string().optional(),

  orderDirection: z.enum(["asc", "desc"]).optional()
});

router.post("/search", async (req, res) => {
  try {
    const parsed = searchSchema.parse(req.body);

    const {
      filters,
      page,
      limit,
      orderBy,
      orderDirection
    } = parsed;

    const where = buildUserSearchQuery(filters);

    /**
     * Whitelist de ordenação
     */
    const allowedOrderFields = [
      "name",
      "email",
      "createdAt",
      "age",
      "status"
    ];

    const safeOrderBy = allowedOrderFields.includes(orderBy || "")
      ? orderBy
      : "createdAt";

    const users = await prisma.user.findMany({
      where,

      skip: (page - 1) * limit,

      take: limit,

      orderBy: {
        [safeOrderBy]: orderDirection || "desc"
      },

      /**
       * Evita exposição de dados sensíveis
       */
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        status: true,
        createdAt: true
      }
    });

    const total = await prisma.user.count({ where });

    return res.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error(error);

    return res.status(400).json({
      error: "Invalid search request"
    });
  }
});

export default router;