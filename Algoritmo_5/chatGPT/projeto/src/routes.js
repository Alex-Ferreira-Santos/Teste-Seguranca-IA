const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const prisma = require('./prisma')
const transporter = require('./mail')

const router = express.Router()

// CADASTRAR USUÁRIO
router.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body

    const exists = await prisma.user.findUnique({
      where: { email },
    })

    if (exists) {
      return res.status(400).json({
        error: 'Usuário já existe',
      })
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    })

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    const activationLink = `${process.env.APP_URL}/activate/${token}`

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Ative sua conta',
      html: `
        <h2>Bem-vindo!</h2>
        <p>Clique abaixo para criar sua senha:</p>
        <a href="${activationLink}">
          Ativar conta
        </a>
      `,
    })

    res.json({
      success: true,
      message: 'Usuário criado com sucesso',
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      error: 'Erro interno',
    })
  }
})

// ATIVAR CONTA
router.post('/activate', async (req, res) => {
  try {
    const { token, password } = req.body

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
      },
    })

    if (!user) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordHash,
        active: true,
      },
    })

    res.json({
      success: true,
      message: 'Conta ativada',
    })
  } catch (error) {
    console.log(error)

    res.status(400).json({
      error: 'Token inválido ou expirado',
    })
  }
})

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(400).json({
        error: 'Usuário não encontrado',
      })
    }

    if (!user.active) {
      return res.status(400).json({
        error: 'Conta não ativada',
      })
    }

    const validPassword = await bcrypt.compare(
      password,
      user.passwordHash
    )

    if (!validPassword) {
      return res.status(400).json({
        error: 'Senha inválida',
      })
    }

    const authToken = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      }
    )

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      error: 'Erro interno',
    })
  }
})

module.exports = router