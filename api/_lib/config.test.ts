import { describe, expect, it } from 'vitest'
import { configProblem, scrub } from './config'

const ok = { SUPABASE_URL: 'u', SUPABASE_SECRET_KEY: 'k', EVENT_SLUG: 'awakening-2026', EMAIL_MODE: 'log' }

describe('configProblem', () => {
  it('accepts a complete preview/dev config', () => {
    expect(configProblem(ok)).toBeNull()
  })
  it('names missing variables', () => {
    expect(configProblem({ ...ok, SUPABASE_URL: '' })).toBe('missing env: SUPABASE_URL')
  })
  it('rejects a slug the database would refuse', () => {
    expect(configProblem({ ...ok, EVENT_SLUG: 'Awakening 2026' })).toMatch(/EVENT_SLUG/)
  })
  it('rejects log mode in production (P03-03)', () => {
    expect(configProblem({ ...ok, VERCEL_ENV: 'production' })).toBe('EMAIL_MODE must be smtp in production')
    expect(configProblem({ ...ok, VERCEL_ENV: 'production', EMAIL_MODE: 'smtp' })).toBeNull()
    expect(configProblem({ ...ok, VERCEL_ENV: 'preview' })).toBeNull()
  })
  it('rejects unknown email modes', () => {
    expect(configProblem({ ...ok, EMAIL_MODE: 'SMTP ' })).toMatch(/EMAIL_MODE/)
  })
})

describe('scrub', () => {
  it('removes email addresses from error text', () => {
    expect(scrub('550 5.1.1 <tolu.a+x@gmail.com>: user unknown')).toBe('550 5.1.1 <[email]>: user unknown')
    expect(scrub('Invalid login: 535-5.7.8')).toBe('Invalid login: 535-5.7.8')
  })
})
