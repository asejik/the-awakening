// Deletes the rows the smoke tests created in the TEST project (source = 'e2e').
export default async function teardown() {
  process.loadEnvFile('.env.local')
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key) return
  const headers: Record<string, string> = { apikey: key }
  if (!key.startsWith('sb_')) headers.Authorization = `Bearer ${key}`
  const res = await fetch(`${url}/rest/v1/registrations?source=eq.e2e`, { method: 'DELETE', headers })
  if (!res.ok) console.warn(`e2e teardown: delete failed (${res.status})`)
}
