import { prisma } from '../prisma'
import { Prisma } from '@prisma/client'

interface SearchUsersParams {
  name?: string
  email?: string
  active?: boolean
  minAge?: number
  maxAge?: number
  page?: number
  limit?: number
  orderBy?: 'name' | 'email' | 'age' | 'createdAt'
  orderDirection?: 'asc' | 'desc'
}

export async function searchUsers(params: SearchUsersParams) {
  const {
    name,
    email,
    active,
    minAge,
    maxAge,
    page = 1,
    limit = 10,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = params

  const where: Prisma.UserWhereInput = {}

  if (name) {
    where.name = {
      contains: name,
      mode: 'insensitive'
    }
  }

  if (email) {
    where.email = {
      contains: email,
      mode: 'insensitive'
    }
  }

  if (typeof active === 'boolean') {
    where.active = active
  }

  if (minAge || maxAge) {
    where.age = {}

    if (minAge) {
      where.age.gte = minAge
    }

    if (maxAge) {
      where.age.lte = maxAge
    }
  }

  const skip = (page - 1) * limit

  const [data, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [orderBy]: orderDirection
      }
    }),

    prisma.user.count({ where })
  ])

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}