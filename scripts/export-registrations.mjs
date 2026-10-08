#!/usr/bin/env node
// Exports one event's registrations to CSV (backup, transport planning). P03-08.
// Reads SUPABASE_URL / SUPABASE_SECRET_KEY / EVENT_SLUG from the environment, e.g. a git-ignored .env.live:
//   node --env-file=.env.live scripts/export-registrations.mjs > awakening-2026-10-20.csv
// Restore: Supabase → Table Editor → registrations → Insert → "Import data from CSV".

const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: key, EVENT_SLUG: event } = process.env
if (!url || !key || !event) {
  console.error('Set SUPABASE_URL, SUPABASE_SECRET_KEY and EVENT_SLUG (e.g. node --env-file=.env.live …)')
  process.exit(1)
}

const COLUMNS = [
  'id', 'event', 'created_at', 'code', 'full_name', 'gender', 'institution', 'institution_other', 'department',
  'phone', 'email', 'needs_transport', 'area', 'address', 'consent_at', 'followup_optin', 'age_confirmed', 'source',
  'email_status', 'email_attempts', 'emailed_at', 'sheet_synced_at',
]
const headers = { apikey: key, ...(key.startsWith('sb_') ? {} : { Authorization: `Bearer ${key}` }) }

const rows = []
for (let from = 0; ; from += 1000) {
  const res = await fetch(
    `${url}/rest/v1/registrations?event=eq.${encodeURIComponent(event)}&select=${COLUMNS.join(',')}&order=created_at`,
    { headers: { ...headers, Range: `${from}-${from + 999}` } },
  )
  if (!res.ok) {
    console.error(`Export failed: HTTP ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  const page = await res.json()
  rows.push(...page)
  if (page.length < 1000) break
}

// Quote every cell; neutralise spreadsheet formulas (CSV injection) by prefixing = + - @ with '.
const cell = (v) => {
  if (v === null || v === undefined) return '' // unquoted empty = NULL for Supabase's CSV import
  let s = String(v)
  if (/^[=+\-@]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}
process.stdout.write([COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(','))].join('\n') + '\n')
console.error(`Exported ${rows.length} registration(s) for ${event}.`)
