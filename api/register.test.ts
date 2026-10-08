import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pending: Promise<unknown>[] = []
vi.mock('@vercel/functions', () => ({ waitUntil: (p: Promise<unknown>) => void pending.push(p) }))

const gasRegister = vi.fn()
const gasSetEmailStatus = vi.fn()
vi.mock('./_lib/gas.js', () => ({ gasRegister, gasSetEmailStatus }))

const sendMail = vi.fn()
vi.mock('./_lib/mailer.js', () => ({ sendMail }))

const { default: handler } = await import('./register')

function call(body: unknown, method = 'POST') {
  const res = { statusCode: 0, body: undefined as unknown } as { statusCode: number; body: unknown }
  const resObj = {
    status(code: number) { res.statusCode = code; return resObj },
    json(b: unknown) { res.body = b; return resObj },
  }
  return handler({ method, body } as VercelRequest, resObj as unknown as VercelResponse)
    .then(async () => { await Promise.all(pending); return res })
}

const valid = {
  full_name: 'Tolulope Adeyemi', gender: 'Female', institution: 'University of Ilorin',
  department: 'Law', phone: '+234 801 234 5678', email: 'Tolu@Example.com',
  needs_transport: false, consent: true, age_confirmed: true,
}

beforeEach(() => {
  pending.length = 0
  vi.clearAllMocks()
  process.env.GAS_URL = 'https://script.example/exec'
  process.env.GAS_SECRET = 's'
  process.env.EMAIL_MODE = 'log'
  gasSetEmailStatus.mockResolvedValue({ status: 'ok' })
  sendMail.mockResolvedValue('sent')
})

describe('POST /api/register', () => {
  it('returns 503 and writes nothing when not configured (prod before M5)', async () => {
    delete process.env.GAS_URL
    const res = await call(valid)
    expect(res.statusCode).toBe(503)
    expect(gasRegister).not.toHaveBeenCalled()
  })

  it('rejects invalid input with the failing fields', async () => {
    const res = await call({ ...valid, phone: '123', consent: false })
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ status: 'invalid', fields: ['phone', 'consent'] })
  })

  it('normalises phone and email before storing', async () => {
    gasRegister.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    await call(valid)
    expect(gasRegister.mock.calls[0][0]).toMatchObject({ phone: '08012345678', email: 'tolu@example.com', area: '', address: '' })
  })

  it('returns the code, then emails and records SENT', async () => {
    gasRegister.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    const res = await call(valid)
    expect(res.statusCode).toBe(201)
    expect(res.body).toEqual({ status: 'created', code: 'K7QX', full_name: 'Tolulope Adeyemi' })
    expect(sendMail.mock.calls[0][0].to).toBe('tolu@example.com')
    expect(gasSetEmailStatus).toHaveBeenCalledWith('r1', 'SENT')
  })

  it('records LOGGED in log mode, never SENT', async () => {
    gasRegister.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    sendMail.mockResolvedValue('logged')
    await call(valid)
    expect(gasSetEmailStatus).toHaveBeenCalledWith('r1', 'LOGGED')
  })

  it('still returns the code when email fails, and records FAILED', async () => {
    gasRegister.mockResolvedValue({ status: 'created', id: 'r1', code: 'K7QX' })
    sendMail.mockRejectedValue(new Error('535 bad credentials'))
    const res = await call(valid)
    expect(res.statusCode).toBe(201)
    expect(gasSetEmailStatus).toHaveBeenCalledWith('r1', 'FAILED')
  })

  it('never returns the existing code for a duplicate; re-sends to the email on file', async () => {
    gasRegister.mockResolvedValue({ status: 'duplicate', id: 'r1', code: 'K7QX', email: 'onfile@example.com', full_name: 'T A', resend: true })
    const res = await call({ ...valid, email: 'someone-else@example.com' })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ status: 'duplicate' })
    expect(sendMail.mock.calls[0][0].to).toBe('onfile@example.com')
  })

  it('does not re-send while throttled', async () => {
    gasRegister.mockResolvedValue({ status: 'duplicate', id: 'r1', code: 'K7QX', email: 'onfile@example.com', full_name: 'T A', resend: false })
    await call(valid)
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('returns 502 without a code when Apps Script fails', async () => {
    gasRegister.mockRejectedValue(new Error('GAS register request failed: TimeoutError'))
    const res = await call(valid)
    expect(res.statusCode).toBe(502)
    expect(res.body).toEqual({ status: 'error' })
  })

  it('returns 503 busy when the Sheet lock is held too long', async () => {
    gasRegister.mockResolvedValue({ status: 'busy' })
    const res = await call(valid)
    expect(res.statusCode).toBe(503)
  })
})
