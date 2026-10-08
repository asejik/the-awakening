// Server-to-server calls to the church's Apps Script web app.
// The secret travels in the JSON body because Apps Script doPost can't read headers.

// Apps Script waits up to 25s for the Sheet lock; the function limit is 30s.
const TIMEOUT_MS = 28_000

export type RegisterPayload = {
  full_name: string
  gender: string
  institution: string
  institution_other: string
  department: string
  phone: string
  email: string
  needs_transport: string
  area: string
  address: string
  followup_optin: string
  age_confirmed: string
  source: string
}

export type RegisterResult =
  | { status: 'created'; id: string; code: string }
  | { status: 'duplicate'; id: string; code: string; email: string; full_name: string; resend: boolean }
  | { status: 'busy' }

export type GasError = { status: 'error' | 'unauthorized'; message?: string }

export class GasCallError extends Error {}

async function call<T>(action: string, payload: unknown): Promise<T> {
  const url = process.env.GAS_URL
  const secret = process.env.GAS_SECRET
  if (!url || !secret) throw new GasCallError('GAS not configured')

  let res: Response
  try {
    // Apps Script answers with a 302 to googleusercontent.com; fetch follows it as a GET.
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, action, payload }),
      redirect: 'follow',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (err) {
    throw new GasCallError(`GAS ${action} request failed: ${(err as Error).name}`)
  }

  let text: string
  try {
    text = await res.text()
  } catch (err) {
    throw new GasCallError(`GAS ${action} response failed: ${(err as Error).name}`)
  }
  let body: T | GasError
  try {
    body = JSON.parse(text)
  } catch {
    // An HTML page here usually means a wrong URL or a deployment not set to "Anyone".
    throw new GasCallError(`GAS ${action} returned non-JSON (HTTP ${res.status})`)
  }
  const status = (body as GasError).status
  if (status === 'error' || status === 'unauthorized') {
    throw new GasCallError(`GAS ${action} ${status}: ${(body as GasError).message ?? ''}`)
  }
  return body as T
}

export function gasRegister(payload: RegisterPayload) {
  return call<RegisterResult>('register', payload)
}

export type EmailStatus = 'SENT' | 'FAILED' | 'LOGGED'

export function gasSetEmailStatus(id: string, emailStatus: EmailStatus) {
  return call<{ status: 'ok' }>('setEmailStatus', { id, email_status: emailStatus })
}
