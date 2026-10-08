import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'

// Runs Code.gs in Node against a fake Sheet that coerces values the way Google Sheets does
// ("08012345678" → 8012345678, "2E45" → 2e45, "=X" → formula) unless prefixed with '.

type Cell = string | number | Date | { formula: string }

function sheetsCoerce(v: unknown): Cell {
  if (typeof v !== 'string') return v as Cell
  if (v.startsWith("'")) return v.slice(1)
  if (v.startsWith('=')) return { formula: v }
  if (/^\d+(\.\d+)?(e\d+)?$/i.test(v)) return Number(v)
  return v
}

type Call = { fn: string; body: Record<string, unknown> }

type Summary = Partial<Record<'total' | 'last_hour' | 'last_24h' | 'unsynced' | 'unsynced_oldest_minutes' | 'failed' | 'exhausted' | 'logged' | 'sent', number>>

function load(opts: {
  pending?: Record<string, string>[]; existingIds?: string[]; retryUrl?: string; failRpc?: string
  alertEmail?: string; isLive?: boolean; summary?: Summary
} = {}) {
  const rows: Cell[][] = (opts.existingIds ?? []).map((id) => [id])
  const calls: Call[] = []
  const pings: string[] = []
  const mails: { to: string; subject: string; body: string }[] = []
  const cache = new Map<string, string>()
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange: (row: number, col: number, nr: number, nc: number) => ({
      getValues: () => rows.slice(row - 2, row - 2 + nr).map((r) => r.slice(col - 1, col - 1 + nc)),
      setValues: (values: unknown[][]) => values.forEach((v, i) => (rows[row - 2 + i] = v.map(sheetsCoerce))),
    }),
    appendRow: () => {},
  }
  const props: Record<string, string> = {
    SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_x', EVENT_SLUG: 'awakening-2026',
    ...(opts.retryUrl ? { RETRY_URL: opts.retryUrl, RETRY_SECRET: 'r' } : {}),
    ...(opts.alertEmail ? { ALERT_EMAIL: opts.alertEmail } : {}),
    ...(opts.isLive ? { IS_LIVE: 'true' } : {}),
  }
  const response = (code: number, body: unknown) => ({ getResponseCode: () => code, getContentText: () => (body === undefined ? '' : JSON.stringify(body)) })
  const globals = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }), flush: () => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    MailApp: { sendEmail: (to: string, subject: string, body: string) => mails.push({ to, subject, body }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    UrlFetchApp: {
      fetch: (url: string, o: { payload?: string; headers: Record<string, string> }) => {
        if (!url.includes('/rest/v1/rpc/')) { pings.push(url); return response(200, { status: 'ok' }) }
        const fn = url.split('/rpc/')[1]
        calls.push({ fn, body: JSON.parse(o.payload ?? '{}') })
        if (fn === opts.failRpc) return response(500, { message: 'boom' })
        if (fn === 'sheet_pending') return response(200, opts.pending ?? [])
        if (fn === 'ops_summary') return response(200, { total: 0, last_24h: 0, unsynced: 0, unsynced_oldest_minutes: 0, failed: 0, exhausted: 0, logged: 0, sent: 0, ...opts.summary })
        return response(200, 1)
      },
    },
  }
  const src = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8')
  const fns = new Function(...Object.keys(globals), `${src}; return { syncFromSupabase, dailyDigest, TABS };`)(...Object.values(globals))
  return {
    sync: fns.syncFromSupabase as () => number | null, digest: fns.dailyDigest as () => void,
    headers: fns.TABS.Registrations as string[], rows, calls, pings, mails,
  }
}

const reg = (id: string, extra: Record<string, string> = {}) => ({
  id, created_at: '2026-10-09 10:00:00', code: '2E45', full_name: 'Tolu', gender: 'Female', institution: 'U',
  institution_other: '', department: 'Law', phone: '08012345678', email: 't@x.co', needs_transport: 'No',
  area: '', address: '', consent_at: '2026-10-09 10:00:00', followup_optin: 'Yes', age_confirmed: 'Yes', source: '',
  level: '100 Level', ...extra,
})

describe('syncFromSupabase (Apps Script)', () => {
  let gas: ReturnType<typeof load>

  beforeEach(() => { gas = load({ pending: [reg('a'), reg('b')] }) })

  it('appends new rows and keeps phone and code as text', () => {
    expect(gas.sync()).toBe(2)
    const row = gas.rows[0]
    expect(row[gas.headers.indexOf('phone')]).toBe('08012345678')
    expect(row[gas.headers.indexOf('code')]).toBe('2E45')
    expect(row[gas.headers.indexOf('synced_at')]).toBeInstanceOf(Date)
    expect(row[gas.headers.indexOf('level')]).toBe('100 Level')
    expect(gas.headers.at(-1)).toBe('level') // appended last so existing Sheet rows don't shift
  })

  it('marks every fetched row synced after writing', () => {
    gas.sync()
    expect(gas.calls.map((c) => c.fn)).toEqual(['sheet_pending', 'sheet_mark_synced'])
    expect(gas.calls[1].body).toEqual({ p_ids: ['a', 'b'] })
  })

  it('never duplicates a row already in the Sheet (re-run after a crash)', () => {
    const g = load({ pending: [reg('a'), reg('b')], existingIds: ['a'] })
    expect(g.sync()).toBe(1)
    expect(g.rows.map((r) => r[0])).toEqual(['a', 'b'])
    expect(g.calls[1].body).toEqual({ p_ids: ['a', 'b'] })
  })

  it('neutralises formulas in user input', () => {
    const g = load({ pending: [reg('a', { full_name: '=HYPERLINK("http://evil")', department: '+1' })] })
    g.sync()
    expect(g.rows[0][g.headers.indexOf('full_name')]).toBe('=HYPERLINK("http://evil")')
    expect(g.rows[0][g.headers.indexOf('department')]).toBe('+1')
  })

  it('does not mark rows synced if fetching fails', () => {
    const g = load({ failRpc: 'sheet_pending' })
    expect(() => g.sync()).toThrow(/sheet_pending failed: HTTP 500/)
    expect(g.calls.map((c) => c.fn)).toEqual(['sheet_pending'])
  })

  it('does nothing extra when there is nothing pending', () => {
    const g = load({ pending: [] })
    expect(g.sync()).toBe(0)
    expect(g.calls.map((c) => c.fn)).toEqual(['sheet_pending'])
  })

  it('pings the retry endpoint only when RETRY_URL is set', () => {
    gas.sync()
    expect(gas.pings).toEqual([])
    const g = load({ pending: [], retryUrl: 'https://site/api/email-retry' })
    g.sync()
    expect(g.pings).toEqual(['https://site/api/email-retry'])
  })
})

describe('alerts and daily digest (P03-01)', () => {
  it('sends nothing when ALERT_EMAIL is not set', () => {
    const g = load({ summary: { exhausted: 3 } })
    g.sync()
    expect(g.mails).toEqual([])
    expect(g.calls.map((c) => c.fn)).not.toContain('ops_summary')
  })

  it('alerts once (not every 5 minutes) when emails are exhausted', () => {
    const g = load({ alertEmail: 'builder@x.co', summary: { exhausted: 2 } })
    g.sync(); g.sync(); g.sync()
    expect(g.mails).toHaveLength(1)
    expect(g.mails[0]).toMatchObject({ to: 'builder@x.co', subject: '[Awakening] 2 confirmation email(s) failed 5 times' })
  })

  it('alerts when the Sheet copy is stalled or many emails are failing', () => {
    const g = load({ alertEmail: 'b@x.co', summary: { unsynced: 4, unsynced_oldest_minutes: 45, failed: 12 } })
    g.sync()
    expect(g.mails.map((m) => m.subject).sort()).toEqual([
      '[Awakening] 12 confirmation emails are failing',
      '[Awakening] Sheet copy is 45 minutes behind',
    ])
  })

  it('flags logged-only emails on LIVE, but not on TEST', () => {
    const test = load({ alertEmail: 'b@x.co', summary: { logged: 5 } })
    test.sync()
    expect(test.mails).toEqual([])
    const live = load({ alertEmail: 'b@x.co', isLive: true, summary: { logged: 5 } })
    live.sync()
    expect(live.mails[0].subject).toBe('[Awakening] LIVE emails are in log mode')
  })

  it('alerts when the sync itself fails', () => {
    const g = load({ alertEmail: 'b@x.co', failRpc: 'sheet_pending' })
    expect(() => g.sync()).toThrow()
    expect(g.mails[0].subject).toBe('[Awakening] Sheet sync is failing')
  })

  it('alerts on a registration spike', () => {
    const g = load({ alertEmail: 'b@x.co', summary: { last_hour: 150 } })
    g.sync()
    expect(g.mails[0].subject).toBe('[Awakening] 150 registrations in the last hour')
  })

  it('sends a daily summary with the counts', () => {
    const g = load({ alertEmail: 'b@x.co', summary: { total: 212, last_24h: 37, sent: 205, failed: 2 } })
    g.digest()
    expect(g.mails[0].subject).toBe('[Awakening] Daily summary: 212 registered (+37 in 24h)')
    expect(g.mails[0].body).toContain('Emails failing (still retrying): 2')
  })
})
