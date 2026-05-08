import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL!,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  nodeEnv: process.env.NODE_ENV!,
  clientUrl: process.env.CLIENT_URL!
};