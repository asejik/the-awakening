import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { fieldErrors, registrationSchema, toPayload } from '../shared/registration.js'
import { checkConfig, scrub } from './_lib/config.js'
import { registerAttendee } from './_lib/db.js'
import { sendConfirmation } from './_lib/send-confirmation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'method_not_allowed' })
  if (!checkConfig()) return res.status(503).json({ status: 'unavailable' })

  // Same schema as the page; never trust the browser's validation.
  const parsed = registrationSchema.safeParse(typeof req.body === 'object' && req.body ? req.body : {})
  if (!parsed.success) return res.status(400).json({ status: 'invalid', fields: fieldErrors(parsed.error) })
  const payload = toPayload(parsed.data)

  const started = Date.now()
  try {
    const result = await registerAttendee(process.env.EVENT_SLUG!, payload)
    const ms = Date.now() - started

    if (result.status === 'created') {
      console.log(JSON.stringify({ evt: 'register.created', id: result.id, ms }))
      waitUntil(sendConfirmation(result.id, payload.email, payload.full_name, result.code, false))
      return res.status(201).json({ status: 'created', code: result.code, full_name: payload.full_name })
    }

    // Duplicate: never return the existing code to the browser; re-send it to the email on file.
    console.log(JSON.stringify({ evt: 'register.duplicate', id: result.id, resend: result.resend, ms }))
    if (result.resend) {
      waitUntil(sendConfirmation(result.id, result.email, result.full_name, result.code, true))
    }
    return res.status(200).json({ status: 'duplicate' })
  } catch (err) {
    console.error(JSON.stringify({ evt: 'register.error', ms: Date.now() - started, error: scrub((err as Error).message) }))
    return res.status(502).json({ status: 'error' })
  }
}
