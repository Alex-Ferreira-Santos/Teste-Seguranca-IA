import { Router } from 'express'
import { z } from 'zod'
import { searchUsers } from '../services/users.service'

const router = Router()

router.get('/users', async (req, res) => {
  const querySchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    active: z
      .enum(['true', 'false'])
      .transform(v => v === 'true')
      .optional(),

    minAge: z.coerce.number().optional(),
    maxAge: z.coerce.number().optional(),

    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),

    orderBy: z
      .enum(['name', 'email', 'age', 'createdAt'])
      .optional(),

    orderDirection: z
      .enum(['asc', 'desc'])
      .optional()
  })

  const params = querySchema.parse(req.query)

  const result = await searchUsers(params)

  return res.json(result)
})

export default router