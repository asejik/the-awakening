import nodemailer, { type Transporter } from 'nodemailer'

export type Mail = { to: string; subject: string; text: string; html: string }

let transporter: Transporter | undefined

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return transporter
}

/** Sends via the church Gmail. With EMAIL_MODE=log nothing is sent (dev, preview, load tests). */
export async function sendMail(mail: Mail): Promise<'sent' | 'logged'> {
  if (process.env.EMAIL_MODE !== 'smtp') {
    console.log(JSON.stringify({ evt: 'email.log_mode', subject: mail.subject }))
    return 'logged'
  }
  await getTransporter().sendMail({
    from: { name: 'Citizens of Light Church', address: process.env.SMTP_USER ?? '' },
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  })
  return 'sent'
}
