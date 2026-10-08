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

function load(opts: { pending?: Record<string, string>[]; existingIds?: string[]; retryUrl?: string; failRpc?: string } = {}) {
  const rows: Cell[][] = (opts.existingIds ?? []).map((id) => [id])
  const calls: Call[] = []
  const pings: string[] = []
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
  }
  const response = (code: number, body: unknown) => ({ getResponseCode: () => code, getContentText: () => (body === undefined ? '' : JSON.stringify(body)) })
  const globals = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }), flush: () => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }) },
    UrlFetchApp: {
      fetch: (url: string, o: { payload?: string; headers: Record<string, string> }) => {
        if (!url.includes('/rest/v1/rpc/')) { pings.push(url); return response(200, { status: 'ok' }) }
        const fn = url.split('/rpc/')[1]
        calls.push({ fn, body: JSON.parse(o.payload ?? '{}') })
        if (fn === opts.failRpc) return response(500, { message: 'boom' })
        if (fn === 'sheet_pending') return response(200, opts.pending ?? [])
        return response(200, 1)
      },
    },
  }
  const src = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8')
  const fns = new Function(...Object.keys(globals), `${src}; return { syncFromSupabase, TABS };`)(...Object.values(globals))
  return { sync: fns.syncFromSupabase as () => number | null, headers: fns.TABS.Registrations as string[], rows, calls, pings }
}

const reg = (id: string, extra: Record<string, string> = {}) => ({
  id, created_at: '2026-10-09 10:00:00', code: '2E45', full_name: 'Tolu', gender: 'Female', institution: 'U',
  institution_other: '', department: 'Law', phone: '08012345678', email: 't@x.co', needs_transport: 'No',
  area: '', address: '', consent_at: '2026-10-09 10:00:00', followup_optin: 'Yes', age_confirmed: 'Yes', source: '', ...extra,
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
