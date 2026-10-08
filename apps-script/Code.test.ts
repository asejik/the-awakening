import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'

// Runs Code.gs in Node against a fake Sheet that coerces values the way Google Sheets does:
// "09151234567" becomes the number 9151234567 and "2E45" becomes 2e45, unless prefixed with '.

type Cell = string | number | Date

function sheetsCoerce(v: unknown): Cell {
  if (typeof v !== 'string') return v as Cell
  if (v.startsWith("'")) return v.slice(1)
  if (/^\d+(\.\d+)?(e\d+)?$/i.test(v)) return Number(v)
  return v
}

function load(initialRows: Cell[][] = []) {
  const rows: Cell[][] = [...initialRows]
  const sheet = {
    getLastRow: () => rows.length + 1,
    getRange: (row: number, col: number, nr: number, nc: number) => ({
      getValues: () => rows.slice(row - 2, row - 2 + nr).map((r) => r.slice(col - 1, col - 1 + nc)),
    }),
    appendRow: (values: unknown[]) => rows.push(values.map(sheetsCoerce)),
  }
  const cache = new Map<string, string>()
  const globals = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => sheet }), flush: () => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: (k: string) => cache.get(k) ?? null, put: (k: string, v: string) => cache.set(k, v) }) },
    Utilities: { getUuid: () => crypto.randomUUID() },
  }
  const src = readFileSync(new URL('./Code.gs', import.meta.url), 'utf8')
  const fns = new Function(...Object.keys(globals), `${src}; return { register_, TABS };`)(...Object.values(globals))
  return { register: fns.register_ as (p: object) => Record<string, unknown>, headers: fns.TABS.Registrations as string[], rows }
}

const person = (phone: string, email: string) => ({
  full_name: 'Test Person', gender: 'Male', institution: 'U', institution_other: '', department: 'D',
  phone, email, needs_transport: 'No', area: '', address: '', followup_optin: 'No', age_confirmed: 'Yes', source: 'test',
})

describe('register_ (Apps Script)', () => {
  let gas: ReturnType<typeof load>
  beforeEach(() => { gas = load() })

  it('stores phone and code as text so the leading 0 survives', () => {
    gas.register(person('09151234567', 'a@x.co'))
    const row = gas.rows[0]
    expect(row[gas.headers.indexOf('phone')]).toBe('09151234567')
    expect(typeof row[gas.headers.indexOf('code')]).toBe('string')
  })

  it('detects a duplicate phone (the M1 bug)', () => {
    expect(gas.register(person('09151234567', 'a@x.co')).status).toBe('created')
    const dup = gas.register(person('09151234567', 'b@x.co'))
    expect(dup.status).toBe('duplicate')
    expect(gas.rows).toHaveLength(1)
  })

  it('detects a duplicate email', () => {
    gas.register(person('09151234567', 'a@x.co'))
    expect(gas.register(person('08012345678', 'a@x.co')).status).toBe('duplicate')
  })

  it('still matches phones already stored as numbers by the old code', () => {
    const legacy = load()
    const row = legacy.headers.map((h) => (h === 'phone' ? 9151234567 : h === 'code' ? 'ABCD' : h === 'email' ? 'old@x.co' : 'x'))
    legacy.rows.push(row)
    expect(legacy.register(person('09151234567', 'new@x.co')).status).toBe('duplicate')
  })

  it('throttles re-sends for the same registration', () => {
    gas.register(person('09151234567', 'a@x.co'))
    expect(gas.register(person('09151234567', 'a@x.co')).resend).toBe(true)
    expect(gas.register(person('09151234567', 'a@x.co')).resend).toBe(false)
  })

  it('generates unique codes from the unambiguous alphabet', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 300; i++) {
      const r = gas.register(person('0803' + String(i).padStart(7, '0'), `p${i}@x.co`))
      codes.add(r.code as string)
    }
    expect(codes.size).toBe(300)
    for (const c of codes) expect(c).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/)
  })
})
