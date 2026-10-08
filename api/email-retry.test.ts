import type { VercelRequest, VercelResponse } from '@vercel/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const emailRetryBatch = vi.fn()
const setEmailStatus = vi.fn()
vi.mock('./_lib/db.js', () => ({ emailRetryBatch, setEmailStatus }))

const sendMail = vi.fn()
vi.mock('./_lib/mailer.js', () => ({ sendMail }))

const { default: handler } = await import('./email-retry')

async function call(authorization?: string, method = 'POST') {
  const out = { statusCode: 0, body: undefined as unknown }
  const res = {
    status(code: number) { out.statusCode = code; return res },
    json(b: unknown) { out.body = b; return res },
  }
  await handler({ method, headers: { authorization } } as unknown as VercelRequest, res as unknown as VercelResponse)
  return out
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.RETRY_SECRET = 'retry-secret-value'
  process.env.EVENT_SLUG = 'awakening-2026'
  setEmailStatus.mockResolvedValue(null)
})

describe('POST /api/email-retry', () => {
  it('rejects a missing or wrong secret', async () => {
    expect((await call()).statusCode).toBe(401)
    expect((await call('Bearer nope')).statusCode).toBe(401)
    expect(emailRetryBatch).not.toHaveBeenCalled()
  })

  it('rejects everything when RETRY_SECRET is unset', async () => {
    delete process.env.RETRY_SECRET
    expect((await call('Bearer ')).statusCode).toBe(401)
  })

  it('re-sends each row and records the outcome', async () => {
    emailRetryBatch.mockResolvedValue([
      { id: 'a', email: 'a@x.co', full_name: 'A A', code: 'AAAA' },
      { id: 'b', email: 'b@x.co', full_name: 'B B', code: 'BBBB' },
    ])
    sendMail.mockResolvedValueOnce('sent').mockRejectedValueOnce(new Error('421'))
    const res = await call('Bearer retry-secret-value')
    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ processed: 2, SENT: 1, FAILED: 1 })
    expect(setEmailStatus).toHaveBeenCalledWith('a', 'SENT')
    expect(setEmailStatus).toHaveBeenCalledWith('b', 'FAILED')
  })
})
