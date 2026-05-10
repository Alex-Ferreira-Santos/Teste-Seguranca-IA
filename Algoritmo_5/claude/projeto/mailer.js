// mailer.js — Configuração e envio de e-mails
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para porta 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendInviteEmail({ to, name, inviteLink }) {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `${process.env.SMTP_FROM_NAME} — Seu acesso chegou!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#f5f5f0;font-family:'Georgia',serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e0ddd5;">
                <tr>
                  <td style="background:#1a1a1a;padding:32px 40px;">
                    <p style="margin:0;color:#f5f5f0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">
                      ${process.env.SMTP_FROM_NAME}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:48px 40px 32px;">
                    <p style="margin:0 0 16px;font-size:15px;color:#888;letter-spacing:1px;text-transform:uppercase;">
                      Convite de acesso
                    </p>
                    <h1 style="margin:0 0 24px;font-size:28px;color:#1a1a1a;font-weight:normal;line-height:1.3;">
                      Olá, ${name}.
                    </h1>
                    <p style="margin:0 0 32px;font-size:16px;color:#444;line-height:1.7;">
                      Você foi cadastrado no sistema. Clique no botão abaixo 
                      para definir sua senha e ativar seu acesso.
                    </p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#1a1a1a;">
                          <a href="${inviteLink}" 
                             style="display:block;padding:16px 40px;color:#f5f5f0;text-decoration:none;font-size:14px;letter-spacing:2px;text-transform:uppercase;">
                            Definir minha senha →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 40px 40px;border-top:1px solid #f0ede5;">
                    <p style="margin:0;font-size:13px;color:#aaa;line-height:1.6;">
                      Este link expira em <strong>48 horas</strong>. Se você não esperava este e-mail, ignore-o.<br>
                      Ou cole este link no navegador: <span style="color:#666;">${inviteLink}</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  });
}

async function sendPasswordChangedEmail({ to, name }) {
  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `${process.env.SMTP_FROM_NAME} — Senha definida com sucesso`,
    html: `
      <body style="font-family:'Georgia',serif;background:#f5f5f0;padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e0ddd5;margin:0 auto;">
          <tr><td style="background:#1a1a1a;padding:32px 40px;">
            <p style="margin:0;color:#f5f5f0;font-size:22px;letter-spacing:2px;text-transform:uppercase;">
              ${process.env.SMTP_FROM_NAME}
            </p>
          </td></tr>
          <tr><td style="padding:40px;">
            <h2 style="margin:0 0 16px;font-weight:normal;color:#1a1a1a;">Tudo certo, ${name}!</h2>
            <p style="color:#444;line-height:1.7;">
              Sua senha foi definida com sucesso. Você já pode fazer login no sistema.
            </p>
            <p style="color:#aaa;font-size:13px;margin-top:32px;">
              Se não foi você quem fez isso, entre em contato imediatamente.
            </p>
          </td></tr>
        </table>
      </body>
    `,
  });
}

module.exports = { sendInviteEmail, sendPasswordChangedEmail };
