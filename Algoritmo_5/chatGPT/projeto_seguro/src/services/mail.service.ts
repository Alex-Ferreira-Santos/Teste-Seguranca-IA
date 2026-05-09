import nodemailer from "nodemailer";
import { env } from "../env";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS
  }
});

export async function sendActivationEmail(
  email: string,
  token: string
) {
  const activationLink =
    `${env.APP_URL}/activate?token=${token}`;

  await transporter.sendMail({
    from: "noreply@app.com",
    to: email,
    subject: "Ative sua conta",
    html: `
      <h1>Bem-vindo</h1>

      <p>Clique abaixo para criar sua senha:</p>

      <a href="${activationLink}">
        Ativar conta
      </a>

      <p>Esse link expira em 15 minutos.</p>
    `
  });
}