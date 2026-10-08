import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { fieldErrors, registrationSchema, toPayload } from '../shared/registration.js'
import { registrationWindow } from '../shared/window.js'
import { checkConfig, scrub } from './_lib/config.js'
import { registerAttendee } from './_lib/db.js'
import { sendConfirmation } from './_lib/send-confirmation.js'

const MIN_FILL_MS = 3_000

function looksLikeBot(body: Record<string, unknown>): boolean {
  const honeypot = typeof body.website === 'string' && body.website.trim() !== ''
  const elapsed = body.elapsed_ms
  return honeypot || typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'method_not_allowed' })
  if (!checkConfig()) return res.status(503).json({ status: 'unavailable' })

  // Server-enforced window: a stale page can't register after closing.
  const window = registrationWindow(new Date(), process.env.REGISTRATION_OPENS_AT, process.env.REGISTRATION_CLOSES_AT)
  if (window !== 'open') return res.status(403).json({ status: window })

  // Bots: a filled honeypot or a sub-3s submit gets the same reply as a human duplicate,
  // so nothing is saved or emailed and the bot learns nothing.
  const raw = (typeof req.body === 'object' && req.body) || {}
  if (looksLikeBot(raw)) {
    console.log(JSON.stringify({ evt: 'register.bot' }))
    return res.status(200).json({ status: 'duplicate' })
  }

  // Same schema as the page; never trust the browser's validation.
  const parsed = registrationSchema.safeParse(raw)
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
