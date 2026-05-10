import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthService } from './auth.service'

const authService = new AuthService()

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8)
      })

      const data = schema.parse(req.body)

      const user = await authService.register(
        data.email,
        data.password
      )

      return res.status(201).json(user)
    } catch (error: any) {
      return res.status(400).json({
        message: error.message
      })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8)
      })

      const data = schema.parse(req.body)

      const tokens = await authService.login(
        data.email,
        data.password
      )

      return res.json(tokens)
    } catch (error: any) {
      return res.status(401).json({
        message: error.message
      })
    }
  }
}