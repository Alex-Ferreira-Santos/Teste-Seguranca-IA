import { PrismaClient } from "@prisma/client";
import {
  comparePassword,
  hashPassword
} from "../../utils/password";
import {
  generateAccessToken,
  generateRefreshToken
} from "../../utils/jwt";

const prisma = new PrismaClient();

export class AuthService {
  async register(email: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error("Invalid credentials");
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash
      }
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const validPassword = await comparePassword(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      throw new Error("Invalid credentials");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const hashedRefresh = await hashPassword(refreshToken);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedRefresh
      }
    });

    return {
      accessToken,
      refreshToken
    };
  }
}