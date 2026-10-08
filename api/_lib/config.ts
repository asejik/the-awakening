// Startup checks shared by the API routes. A misconfiguration fails loudly (503 + error log)
// instead of silently skipping emails or breaking every insert (P03-03, P03-07).

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'EVENT_SLUG', 'EMAIL_MODE'] as const

/** Returns a reason string if the server can't safely take registrations, else null. */
export function configProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  const missing = REQUIRED.filter((k) => !env[k])
  if (missing.length) return `missing env: ${missing.join(', ')}`
  // Must match the DB CHECK on registrations.event, or every insert fails.
  if (!/^[a-z0-9-]{1,40}$/.test(env.EVENT_SLUG!)) return 'EVENT_SLUG must be lowercase letters, digits and dashes'
  if (env.EMAIL_MODE !== 'smtp' && env.EMAIL_MODE !== 'log') return 'EMAIL_MODE must be smtp or log'
  // Log mode in production would silently skip every confirmation email.
  if (env.VERCEL_ENV === 'production' && env.EMAIL_MODE !== 'smtp') return 'EMAIL_MODE must be smtp in production'
  return null
}

let reported = false

/** Logs the problem once per instance; prod before M5 (no env at all) stays quiet. */
export function checkConfig(): boolean {
  const problem = configProblem()
  const unconfigured = REQUIRED.every((k) => !process.env[k]) // expected on prod until M5
  if (problem && !reported && !unconfigured) {
    console.error(JSON.stringify({ evt: 'config.invalid', problem }))
    reported = true
  }
  return problem === null
}

/** Strips email addresses from error text before it reaches the logs (P03-06). */
export function scrub(message: string): string {
  return message.replace(/[^\s<>"'@]+@[^\s<>"'@]+/g, '[email]')
}
