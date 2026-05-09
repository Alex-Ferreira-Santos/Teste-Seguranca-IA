const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.seuprovedor.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({
    from: `"Seu Sistema" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
}

module.exports = sendEmail;