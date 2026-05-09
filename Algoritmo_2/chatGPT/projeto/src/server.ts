import express from 'express'
import usersRoutes from './routes/users.routes'

const app = express()

app.use(express.json())

app.use(usersRoutes)

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000')
})