import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pending: Promise<unknown>[] = []
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => void pending.push(p) }))

const registerAttendee = vi.fn()
const setEmailStatus = vi.fn()
vi.mock('./_lib/db.js', () => ({ registerAttendee, setEmailStatus }))

const sendMail = vi.fn()
vi.mock('./_lib/mailer.js', () => ({ sendMail }))

const { default: handler } = await import('./register')

function fakeRes() {
  const out = { statusCode: 0, body: undefined as unknown }
  const res = {
    status(code: number) { out.statusCode = code; return res },
    json(b: unknown) { out.body = b; return res },
  }
  return { out, res: res as unknown as VercelResponse }
}

async function call(body: unknown, method = 'POST') {
  const { out, res } = fakeRes()
  await handler({ method, body } as VercelRequest, res)
  await Promise.all(pending)
  return out
}

const valid = {
  full_name: 'Tolulope Adeyemi', gender: 'Female', institution: 'University of Ilorin',
  department: 'Law', phone: '+234 801 234 5678', email: 'Tolu@Example.com',
  needs_transport: false, consent: true, age_confirmed: true,
}

beforeEach(() => {
  pending.length = 0
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://x.supabase.co'
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_x'
  process.env.EVENT_SLUG = 'awakening-2026'
  process.env.EMAIL_MODE = 'log'
  setEmailStatus.mockResolvedValue(null)
  sendMail.mockResolvedValue('sent')
})

describe('POST /api/register', () => {
  it('returns 503 and writes nothing when not configured (prod before M5)', async () => {
    delete process.env.SUPABASE_URL
    const res = await call(valid)
    expect(res.statusCode).toBe(503)
    expect(registerAttendee).not.toHaveBeenCalled()
  })

  it('rejects invalid input with the failing fields', async () => {
    const res = await call({ ...valid, phone: '123', consent: false })
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ status: 'invalid', fields: ['phone', 'consent'] })
  })

  it('normalises phone and email and sends booleans to the database', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    await call({ ...valid, needs_transport: true, area: 'Tanke', address: 'Block C' })
    expect(registerAttendee).toHaveBeenCalledWith('awakening-2026', expect.objectContaining({
      phone: '08012345678', email: 'tolu@example.com', needs_transport: true, area: 'Tanke', age_confirmed: true,
    }))
  })

  it('drops area and address when no transport is needed', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    await call({ ...valid, area: 'Tanke', address: 'Block C' })
    expect(registerAttendee.mock.calls[0][1]).toMatchObject({ needs_transport: false, area: '', address: '' })
  })

  it('returns the code, then emails and records SENT', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    const res = await call(valid)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ status: 'created', code: 'K7QX', full_name: 'Tolulope Adeyemi' })
    expect(sendMail.mock.calls[0][0].to).toBe('tolu@example.com')
    expect(setEmailStatus).toHaveBeenCalledWith('r1', 'SENT')
  })

  it('records LOGGED in log mode, never SENT', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    sendMail.mockResolvedValue('logged')
    await call(valid)
    expect(setEmailStatus).toHaveBeenCalledWith('r1', 'LOGGED')
  })

  it('still returns the code when email fails, and records FAILED', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    sendMail.mockRejectedValue(new Error('535 bad credentials'))
    const res = await call(valid)
    expect(res.statusCode).toBe(201)
    expect(setEmailStatus).toHaveBeenCalledWith('r1', 'FAILED')
  })

  it('never returns the existing code for a duplicate; re-sends to the email on file', async () => {
    registerAttendee.mockResolvedValue({ status: 'duplicate', id: 'r1', code: 'K7QX', email: 'onfile@example.com', full_name: 'T A', resend: true })
    const res = await call({ ...valid, email: 'someone-else@example.com' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'duplicate' })
    expect(sendMail.mock.calls[0][0].to).toBe('onfile@example.com')
  })

  it('does not re-send while throttled', async () => {
    registerAttendee.mockResolvedValue({ status: 'duplicate', id: 'r1', code: 'K7QX', email: 'onfile@example.com', full_name: 'T A', resend: false })
    await call(valid)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('a failed re-send does not downgrade the row', async () => {
    registerAttendee.mockResolvedValue({ status: 'duplicate', id: 'r1', code: 'K7QX', email: 'onfile@example.com', full_name: 'T A', resend: true })
    sendMail.mockRejectedValue(new Error('421 try later'))
    await call(valid)
    expect(setEmailStatus).not.toHaveBeenCalled()
  })

  it('returns 502 without a code when the database fails', async () => {
    registerAttendee.mockRejectedValue(new Error('register_attendee: timeout'))
    const res = await call(valid)
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ status: 'error' })
  })
})
