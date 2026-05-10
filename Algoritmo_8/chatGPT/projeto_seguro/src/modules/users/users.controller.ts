import { Request, Response } from 'express'

export class UsersController {
  async list(req: Request, res: Response) {
    return res.json({
      message: 'Users list allowed'
    })
  }
}