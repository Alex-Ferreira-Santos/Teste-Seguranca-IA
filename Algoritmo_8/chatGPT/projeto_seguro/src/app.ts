import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'

import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'

const app = express()

app.use(helmet())

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())
app.use(morgan('combined'))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100
}))

app.use('/auth', authRoutes)
app.use('/users', usersRoutes)

export default app