#!/usr/bin/env node
// M1 load test for /api/register. Uses FAKE addresses, so the target MUST run with EMAIL_MODE=log.
// Usage: node scripts/load-test.mjs --url http://localhost:3000/api/register --n 50 --email-mode-is-log
// Rows are tagged source=loadtest and full_name "LOADTEST …" so they're easy to delete from the TEST Sheet.

const args = Object.fromEntries(
  process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]?.startsWith('--') ? true : all[i + 1] ?? true] : null)).filter(Boolean),
)
const url = args.url
const n = Number(args.n ?? 50)
const bypass = process.env.VERCEL_BYPASS // optional: Vercel "Protection Bypass for Automation" secret

if (!url || args['email-mode-is-log'] !== true) {
  console.error('Usage: node scripts/load-test.mjs --url <register url> [--n 50] --email-mode-is-log')
  console.error('The flag confirms the target has EMAIL_MODE=log. Never send fake addresses through the church Gmail.')
  process.exit(1)
}

const run = Date.now().toString(36)
const rand = (len) => Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('')
const person = (i, phone = '090' + rand(8)) => ({
  full_name: `LOADTEST ${run} ${i}`,
  gender: i % 2 ? 'Male' : 'Female',
  institution: 'University of Ilorin',
  department: 'Load Test',
  phone,
  email: `loadtest-${run}-${i}@example.invalid`,
  needs_transport: false,
  consent: true,
  age_confirmed: true,
  source: 'loadtest',
})

async function post(body) {
  const t = Date.now()
  try {
    const headers = { 'Content-Type': 'application/json' }
    if (bypass) headers['x-vercel-protection-bypass'] = bypass
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
    const json = await r.json().catch(() => ({}))
    return { http: r.status, status: json.status, code: json.code, ms: Date.now() - t }
  } catch (err) {
    return { http: 0, status: 'network:' + (err.cause?.code ?? err.name), ms: Date.now() - t }
  }
}

const pct = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]

// Fail fast if nothing is serving the URL (e.g. `vercel dev` not ready).
try {
  await fetch(new URL('/api/health', url), { signal: AbortSignal.timeout(5000), headers: bypass ? { 'x-vercel-protection-bypass': bypass } : {} })
} catch (err) {
  console.error(`Can't reach ${new URL('/api/health', url)} (${err.cause?.code ?? err.name}). Is \`npm run dev:full\` running and showing "Ready"?`)
  process.exit(1)
}

console.log(`Run ${run}: ${n} parallel registrations → ${url}`)
const results = await Promise.all(Array.from({ length: n }, (_, i) => post(person(i))))
const ms = results.map((r) => r.ms).sort((a, b) => a - b)
const created = results.filter((r) => r.status === 'created')
const codes = new Set(created.map((r) => r.code))
const byStatus = results.reduce((m, r) => ((m[`${r.http} ${r.status}`] = (m[`${r.http} ${r.status}`] ?? 0) + 1), m), {})

console.log('Outcomes:', byStatus)
console.log(`Created: ${created.length}/${n} · unique codes: ${codes.size}`)
console.log(`Latency ms: p50 ${pct(ms, 50)} · p95 ${pct(ms, 95)} · max ${ms.at(-1)}`)

console.log('\nRace: same phone submitted twice at the same moment…')
const phone = '091' + rand(8)
const race = await Promise.all([post(person('raceA', phone)), post(person('raceB', phone))])
console.log(race.map((r) => `${r.http} ${r.status}`).join(' | '), '(expect one created, one duplicate)')

const ok = created.length === n && codes.size === n && pct(ms, 95) < 8000 &&
  race.filter((r) => r.status === 'created').length === 1 && race.filter((r) => r.status === 'duplicate').length === 1
console.log(ok ? '\nPASS' : '\nFAIL')
process.exit(ok ? 0 : 1)
