import { PrismaClient } from '@prisma/client'
import argon2 from 'argon2'
import crypto from 'crypto'

import {
  signAccessToken,
  signRefreshToken
} from '../../utils/jwt'

const prisma = new PrismaClient()

export class AuthService {
  async register(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const passwordHash = await argon2.hash(password)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    })

    return user
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const validPassword = await argon2.verify(
      user.passwordHash,
      password
    )

    if (!validPassword) {
      throw new Error('Invalid credentials')
    }

    const accessToken = signAccessToken({
      sub: user.id
    })

    const refreshToken = signRefreshToken({
      sub: user.id
    })

    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex')

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })

    return {
      accessToken,
      refreshToken
    }
  }
}