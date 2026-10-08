import type { VercelRequest, VercelResponse } from '@vercel/node'
import { waitUntil } from '@vercel/functions'
import { normalizeNigerianPhone } from '../shared/phone.js'
import { registerAttendee, type RegisterPayload } from './_lib/db.js'
import { sendConfirmation } from './_lib/send-confirmation.js'

// M1: minimal validation. M2 replaces it with the shared zod schema.

const REQUIRED_ENV = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'EVENT_SLUG', 'EMAIL_MODE'] as const

function str(v: unknown, max: number): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

function validate(body: Record<string, unknown>): { payload?: RegisterPayload; errors: string[] } {
  const errors: string[] = []
  const full_name = str(body.full_name, 80)
  const email = str(body.email, 120).toLowerCase()
  const phone = normalizeNigerianPhone(str(body.phone, 30))
  const gender = str(body.gender, 10)

  if (full_name.length < 2) errors.push('full_name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('email')
  if (!phone) errors.push('phone')
  if (gender !== 'Male' && gender !== 'Female') errors.push('gender')
  if (body.consent !== true) errors.push('consent')
  if (body.age_confirmed !== true) errors.push('age_confirmed')
  if (errors.length) return { errors }

  const needsTransport = body.needs_transport === true
  return {
    errors,
    payload: {
      full_name,
      gender,
      institution: str(body.institution, 80),
      institution_other: str(body.institution_other, 80),
      department: str(body.department, 80),
      phone: phone!,
      email,
      needs_transport: needsTransport,
      area: needsTransport ? str(body.area, 60) : '',
      address: needsTransport ? str(body.address, 200) : '',
      followup_optin: body.followup_optin === true,
      age_confirmed: true,
      source: str(body.source, 40),
    },
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ status: 'method_not_allowed' })
  if (REQUIRED_ENV.some((k) => !process.env[k])) {
    return res.status(503).json({ status: 'unavailable' })
  }

  const body = (typeof req.body === 'object' && req.body) || {}
  const { payload, errors } = validate(body as Record<string, unknown>)
  if (!payload) return res.status(400).json({ status: 'invalid', fields: errors })

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
    console.error(JSON.stringify({ evt: 'register.error', ms: Date.now() - started, error: (err as Error).message }))
    return res.status(502).json({ status: 'error' })
  }
}
