import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.accessSecret, {
    expiresIn: '15m'
  })
}

export function signRefreshToken(payload: object) {
  return jwt.sign(payload, env.refreshSecret, {
    expiresIn: '7d'
  })
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.accessSecret)
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.refreshSecret)
}