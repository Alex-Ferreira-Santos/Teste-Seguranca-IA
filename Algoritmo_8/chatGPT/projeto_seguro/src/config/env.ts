import 'dotenv/config'

export const env = {
  port: Number(process.env.PORT || 3000),
  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!
}