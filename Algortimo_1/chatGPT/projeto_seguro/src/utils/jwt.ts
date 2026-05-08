import jwt from "jsonwebtoken";
import { env } from "../config/env";

export function generateAccessToken(userId: string) {
  return jwt.sign(
    { userId },
    env.jwtAccessSecret,
    { expiresIn: "15m" }
  );
}

export function generateRefreshToken(userId: string) {
  return jwt.sign(
    { userId },
    env.jwtRefreshSecret,
    { expiresIn: "7d" }
  );
}