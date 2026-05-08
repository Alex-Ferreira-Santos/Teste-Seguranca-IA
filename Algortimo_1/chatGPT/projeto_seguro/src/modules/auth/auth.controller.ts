import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import {
  loginSchema,
  registerSchema
} from "./auth.validation";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const data = registerSchema.parse(req.body);

    await authService.register(
      data.email,
      data.password
    );

    return res.status(201).json({
      message: "User created"
    });
  }

  async login(req: Request, res: Response) {
    const data = loginSchema.parse(req.body);

    const tokens = await authService.login(
      data.email,
      data.password
    );

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
      accessToken: tokens.accessToken
    });
  }

  async logout(req: Request, res: Response) {
    res.clearCookie("refreshToken");

    return res.json({
      message: "Logged out"
    });
  }
}