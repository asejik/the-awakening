import type { ApiRequest, ApiResponse } from './_lib/http.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pending: Promise<unknown>[] = []
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => void pending.push(p) }))

const registerAttendee = vi.fn()
const setEmailStatus = vi.fn()
const rateLimitHit = vi.fn()
vi.mock('./_lib/db.js', () => ({ registerAttendee, setEmailStatus, rateLimitHit }))

const sendMail = vi.fn()
vi.mock('./_lib/mailer.js', () => ({ sendMail }))

const { default: handler } = await import('./register.js')

function fakeRes() {
  const out = { statusCode: 0, body: undefined as unknown }
  const res = {
    status(code: number) { out.statusCode = code; return res },
    json(b: unknown) { out.body = b; return res },
  }
  return { out, res: res as unknown as ApiResponse }
}

async function call(body: unknown, method = 'POST') {
  const { out, res } = fakeRes()
  await handler({ method, body, headers: { 'x-real-ip': '203.0.113.7' } } as unknown as ApiRequest, res)
  await Promise.all(pending)
  return out
}

const valid = {
  full_name: 'Tolulope Adeyemi', gender: 'Female', institution: 'University of Ilorin',
  department: 'Law', phone: '+234 801 234 5678', email: 'Tolu@Example.com',
  needs_transport: 'No', consent: true, age_confirmed: true, website: '', elapsed_ms: 45_000,
}

beforeEach(() => {
  pending.length = 0
  vi.clearAllMocks()
  process.env.SUPABASE_URL = 'https://x.supabase.co'
  process.env.SUPABASE_SECRET_KEY = 'sb_secret_x'
  process.env.EVENT_SLUG = 'awakening-2026'
  process.env.EMAIL_MODE = 'log'
  setEmailStatus.mockResolvedValue(null)
  rateLimitHit.mockResolvedValue(true)
  sendMail.mockResolvedValue('sent')
})

describe('POST /api/register', () => {
  it('returns 503 and writes nothing when not configured (prod before M5)', async () => {
    delete process.env.SUPABASE_URL
    const res = await call(valid)
    expect(res.statusCode).toBe(503)
    expect(registerAttendee).not.toHaveBeenCalled()
  })

  it('refuses log mode in production instead of silently skipping emails', async () => {
    process.env.VERCEL_ENV = 'production'
    try {
      const res = await call(valid)
      expect(res.statusCode).toBe(503)
      expect(registerAttendee).not.toHaveBeenCalled()
    } finally {
      delete process.env.VERCEL_ENV
    }
  })

  it('refuses registrations outside the window (403) without touching the database', async () => {
    process.env.REGISTRATION_CLOSES_AT = '2020-01-01T00:00:00+01:00'
    try {
      const res = await call(valid)
      expect(res).toMatchObject({ statusCode: 403, body: { status: 'closed' } })
      process.env.REGISTRATION_CLOSES_AT = ''
      process.env.REGISTRATION_OPENS_AT = '2999-01-01T00:00:00+01:00'
      expect(await call(valid)).toMatchObject({ statusCode: 403, body: { status: 'not_open' } })
      expect(registerAttendee).not.toHaveBeenCalled()
    } finally {
      delete process.env.REGISTRATION_CLOSES_AT
      delete process.env.REGISTRATION_OPENS_AT
    }
  })

  it.each([
    ['a filled honeypot', { website: 'http://spam.example' }],
    ['a sub-3-second submit', { elapsed_ms: 900 }],
    ['a missing timing field', { elapsed_ms: undefined }],
  ])('treats %s as a bot: duplicate-shaped reply, nothing saved or emailed', async (_label, extra) => {
    const res = await call({ ...valid, ...extra })
    expect(res).toMatchObject({ statusCode: 200, body: { status: 'duplicate' } })
    expect(registerAttendee).not.toHaveBeenCalled()
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('returns 429 once the network is over its limit, without saving', async () => {
    rateLimitHit.mockResolvedValue(false)
    const res = await call(valid)
    expect(res).toMatchObject({ statusCode: 429, body: { status: 'rate_limited' } })
    expect(registerAttendee).not.toHaveBeenCalled()
  })

  it('keys the limit on a salted hash of the IP, never the raw IP', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    await call(valid)
    const [key, max, windowSeconds] = rateLimitHit.mock.calls[0]
    expect(key).toMatch(/^[0-9a-f]{64}$/)
    expect(key).not.toContain('203.0.113.7')
    expect([max, windowSeconds]).toEqual([20, 600])
  })

  it('fails open if the limiter itself errors', async () => {
    rateLimitHit.mockRejectedValue(new Error('rate_limit_hit: timeout'))
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    expect((await call(valid)).statusCode).toBe(201)
  })

  it('rejects invalid input with the failing fields', async () => {
    const res = await call({ ...valid, phone: '123', consent: false })
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({
      status: 'invalid',
      fields: { phone: 'Enter an 11-digit number, e.g. 08012345678', consent: 'You need to agree to register' },
    })
    expect(registerAttendee).not.toHaveBeenCalled()
  })

  it('normalises phone and email and sends booleans to the database', async () => {
    registerAttendee.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    await call({ ...valid, needs_transport: 'Yes', area: 'Tanke', address: 'Block C' })
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
