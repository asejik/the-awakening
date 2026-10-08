import { setEmailStatus, type EmailStatus } from './db.js'
import { confirmationEmail } from './email.js'
import { sendMail } from './mailer.js'

/** Sends the confirmation (or re-send) and records the outcome. Never throws. */
export async function sendConfirmation(id: string, to: string, fullName: string, code: string, resend: boolean) {
  const started = Date.now()
  let outcome: EmailStatus
  try {
    // Log mode records LOGGED so test rows never claim an email went out.
    outcome = (await sendMail(confirmationEmail(to, fullName, code, resend))) === 'sent' ? 'SENT' : 'LOGGED'
  } catch (err) {
    outcome = 'FAILED'
    console.error(JSON.stringify({ evt: 'email.failed', id, error: (err as Error).message }))
  }
  // A resend only ever upgrades the row; a failed or logged resend leaves it as it was.
  if (!(resend && outcome !== 'SENT')) {
    try {
      await setEmailStatus(id, outcome)
    } catch (err) {
      console.error(JSON.stringify({ evt: 'email.status_failed', id, error: (err as Error).message }))
    }
  }
  console.log(JSON.stringify({ evt: 'email.done', id, outcome, resend, ms: Date.now() - started }))
  return outcome
}
