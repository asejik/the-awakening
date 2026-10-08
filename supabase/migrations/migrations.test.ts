import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

// Runs the real migration in an in-process Postgres (PGlite). Supabase's roles are created first.
const sql = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')

let db: PGlite

async function rpc<T = Record<string, unknown>>(query: string, params: unknown[] = []): Promise<T[]> {
  return (await db.query<T>(query, params)).rows
}

const person = (phone: string, email: string, extra: object = {}) => ({
  full_name: 'Tolulope Adeyemi', gender: 'Female', institution: 'University of Ilorin', department: 'Law',
  phone, email, needs_transport: false, followup_optin: true, age_confirmed: true, source: 'test', ...extra,
})

async function register(p: object, event = 'awakening-2026') {
  const [row] = await rpc<{ r: Record<string, unknown> }>('select public.register_attendee($1, $2::jsonb) as r', [event, JSON.stringify(p)])
  return row.r
}

beforeAll(async () => {
  db = new PGlite() // cold start can take several seconds
  await db.exec(`create role anon; create role authenticated; create role service_role;`)
}, 60_000)

beforeEach(async () => {
  // Fresh schema per test: roll back, then migrate (also proves the pairs round-trip).
  await db.exec('drop function if exists public.ops_summary(text)') // 002 object outlives 001's down
  await db.exec(sql('001_registrations.down.sql'))
  await db.exec(sql('001_registrations.sql'))
  await db.exec(sql('002_ops.sql'))
})

describe('001_registrations', () => {
  it('creates a registration with a valid code', async () => {
    const r = await register(person('08012345678', 'tolu@example.com'))
    expect(r.status).toBe('created')
    expect(r.code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/)
  })

  it('treats the same phone or the same email as a duplicate, returning the stored email', async () => {
    const first = await register(person('08012345678', 'tolu@example.com'))
    const byPhone = await register(person('08012345678', 'other@example.com'))
    const byEmail = await register(person('09011112222', 'TOLU@example.com'))
    expect(byPhone).toMatchObject({ status: 'duplicate', id: first.id, code: first.code, email: 'tolu@example.com' })
    expect(byEmail.status).toBe('duplicate')
    expect((await rpc('select count(*)::int as n from public.registrations'))[0]).toEqual({ n: 1 })
  })

  it('throttles re-sends: none within 10 minutes of creation, then at most one per 10 minutes', async () => {
    const first = await register(person('08012345678', 'tolu@example.com'))
    expect((await register(person('08012345678', 'x@example.com'))).resend).toBe(false)
    await db.query(`update public.registrations set last_resend_at = now() - interval '11 minutes' where id = $1`, [first.id])
    expect((await register(person('08012345678', 'x@example.com'))).resend).toBe(true)
    expect((await register(person('08012345678', 'x@example.com'))).resend).toBe(false)
  })

  it('keeps events separate (reuse)', async () => {
    await register(person('08012345678', 'tolu@example.com'), 'awakening-2026')
    expect((await register(person('08012345678', 'tolu@example.com'), 'awakening-2027')).status).toBe('created')
  })

  it('retries on a code collision instead of failing', async () => {
    // Force collisions: occupy 30 of 31 first characters' worth is impractical, so seed random() instead.
    await db.exec(`select setseed(0.42)`)
    const a = await register(person('08012345678', 'a@example.com'))
    await db.exec(`select setseed(0.42)`) // same seed → same first code → unique violation → retry
    const b = await register(person('08098765432', 'b@example.com'))
    expect(b.status).toBe('created')
    expect(b.code).not.toBe(a.code)
  })

  it('rejects invalid data at the database level', async () => {
    await expect(register(person('8012345678', 'a@example.com'))).rejects.toThrow(/check constraint/)
    await expect(register(person('08012345678', 'a@example.com', { gender: 'Other' }))).rejects.toThrow(/check constraint/)
    await expect(register(person('08012345678', 'a@example.com', { age_confirmed: false }))).rejects.toThrow(/check constraint/)
  })

  it('records email status and attempts', async () => {
    const r = await register(person('08012345678', 'tolu@example.com'))
    await db.query('select public.set_email_status($1, $2)', [r.id, 'FAILED'])
    await db.query('select public.set_email_status($1, $2)', [r.id, 'SENT'])
    const [row] = await rpc<{ email_status: string; email_attempts: number; emailed_at: Date | null }>(
      'select email_status, email_attempts, emailed_at from public.registrations where id = $1', [r.id])
    expect(row).toMatchObject({ email_status: 'SENT', email_attempts: 2 })
    expect(row.emailed_at).not.toBeNull()
  })

  it('selects FAILED and stale PENDING rows for retry, under 5 attempts', async () => {
    const failed = await register(person('08011111111', 'f@example.com'))
    const stale = await register(person('08022222222', 's@example.com'))
    const fresh = await register(person('08033333333', 'n@example.com'))
    const exhausted = await register(person('08044444444', 'e@example.com'))
    await db.query(`update public.registrations set email_status = 'FAILED' where id = $1`, [failed.id])
    await db.query(`update public.registrations set created_at = now() - interval '11 minutes' where id = $1`, [stale.id])
    await db.query(`update public.registrations set email_status = 'FAILED', email_attempts = 5 where id = $1`, [exhausted.id])
    const ids = (await rpc<{ id: string }>(`select id from public.email_retry_batch('awakening-2026')`)).map((r) => r.id)
    expect(ids.sort()).toEqual([failed.id, stale.id].sort())
    expect(ids).not.toContain(fresh.id)
  })

  it('returns unsynced rows shaped for the Sheet, then marks them synced', async () => {
    const r = await register(person('08012345678', 'tolu@example.com', { needs_transport: true, area: 'Tanke', address: 'Block C' }))
    const [row] = await rpc<Record<string, string>>(`select * from public.sheet_pending('awakening-2026')`)
    expect(row).toMatchObject({ id: r.id, phone: '08012345678', needs_transport: 'Yes', area: 'Tanke', followup_optin: 'Yes' })
    expect(row.created_at).toMatch(/^\d{4}-\d\d-\d\d \d\d:\d\d:\d\d$/)
    const [marked] = await rpc<{ n: number }>('select public.sheet_mark_synced($1::uuid[]) as n', [[r.id]])
    expect(marked.n).toBe(1)
    expect(await rpc(`select * from public.sheet_pending('awakening-2026')`)).toHaveLength(0)
  })

  it('locks the table and functions away from anon/authenticated', async () => {
    const grants = await rpc<{ grantee: string }>(
      `select grantee from information_schema.role_table_grants where table_name = 'registrations' and grantee in ('anon','authenticated')`)
    expect(grants).toHaveLength(0)
    const [{ anon_exec }] = await rpc<{ anon_exec: boolean }>(
      `select has_function_privilege('anon', 'public.register_attendee(text, jsonb)', 'execute') as anon_exec`)
    expect(anon_exec).toBe(false)
    const [{ rls }] = await rpc<{ rls: boolean }>(`select relrowsecurity as rls from pg_class where relname = 'registrations'`)
    expect(rls).toBe(true)
  })

  it('002: a claimed retry row is not handed to an overlapping run', async () => {
    const r = await register(person('08011111111', 'f@example.com'))
    await db.query(`update public.registrations set email_status = 'FAILED' where id = $1`, [r.id])
    expect(await rpc(`select id from public.email_retry_batch('awakening-2026')`)).toHaveLength(1)
    expect(await rpc(`select id from public.email_retry_batch('awakening-2026')`)).toHaveLength(0)
    await db.query(`update public.registrations set retry_claimed_at = now() - interval '6 minutes' where id = $1`, [r.id])
    expect(await rpc(`select id from public.email_retry_batch('awakening-2026')`)).toHaveLength(1)
  })

  it('002: ops_summary counts what the alerts need', async () => {
    const a = await register(person('08011111111', 'a@example.com'))
    const b = await register(person('08022222222', 'b@example.com'))
    await register(person('08033333333', 'c@example.com'))
    await db.query(`update public.registrations set email_status = 'FAILED', email_attempts = 5 where id = $1`, [a.id])
    await db.query(`update public.registrations set email_status = 'SENT', sheet_synced_at = now() where id = $1`, [b.id])
    await db.query(`update public.registrations set created_at = now() - interval '40 minutes' where id = $1`, [a.id])
    const [{ s }] = await rpc<{ s: Record<string, number> }>(`select public.ops_summary('awakening-2026') as s`)
    expect(s).toMatchObject({ total: 3, unsynced: 2, exhausted: 1, failed: 0, sent: 1, logged: 0 })
    expect(s.unsynced_oldest_minutes).toBeGreaterThanOrEqual(40)
    const [{ anon_exec }] = await rpc<{ anon_exec: boolean }>(
      `select has_function_privilege('anon', 'public.ops_summary(text)', 'execute') as anon_exec`)
    expect(anon_exec).toBe(false)
  })

  it('002 rolls back to 001 behaviour', async () => {
    await db.exec(sql('002_ops.down.sql'))
    const cols = await rpc(`select 1 from information_schema.columns where table_name = 'registrations' and column_name = 'retry_claimed_at'`)
    expect(cols).toHaveLength(0)
    const r = await register(person('08011111111', 'f@example.com'))
    await db.query(`update public.registrations set email_status = 'FAILED' where id = $1`, [r.id])
    expect(await rpc(`select id from public.email_retry_batch('awakening-2026')`)).toHaveLength(1)
  })

  it('rolls back cleanly', async () => {
    await db.exec(sql('002_ops.down.sql'))
    await db.exec(sql('001_registrations.down.sql'))
    const [{ n }] = await rpc<{ n: number }>(`select count(*)::int as n from pg_tables where tablename = 'registrations'`)
    expect(n).toBe(0)
  })
})
