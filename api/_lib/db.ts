import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only Supabase access with the secret key. RLS is on with no policies, so this key
// (role service_role) is the only way in. Never import this from src/.

const TIMEOUT_MS = 10_000

export type RegisterPayload = {
  full_name: string
  gender: string
  institution: string
  institution_other: string
  department: string
  phone: string
  email: string
  needs_transport: boolean
  area: string
  address: string
  followup_optin: boolean
  age_confirmed: boolean
  source: string
}

export type RegisterResult =
  | { status: 'created'; id: string; code: string }
  | { status: 'duplicate'; id: string; code: string; email: string; full_name: string; resend: boolean }

export type EmailStatus = 'SENT' | 'FAILED' | 'LOGGED'
export type RetryRow = { id: string; email: string; full_name: string; code: string }

class DbError extends Error {}

let client: SupabaseClient | undefined

function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY
    if (!url || !key) throw new DbError('Supabase not configured')
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }) },
    })
  }
  return client
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await db().rpc(fn, args)
  if (error) throw new DbError(`${fn}: ${error.message}`)
  return data as T
}

export function registerAttendee(event: string, payload: RegisterPayload) {
  return rpc<RegisterResult>('register_attendee', { p_event: event, p: payload })
}

/** Counts one attempt for `key`; true while within `max` per `windowSeconds` (migration 003). */
export function rateLimitHit(key: string, max: number, windowSeconds: number) {
  return rpc<boolean>('rate_limit_hit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })
}

export function setEmailStatus(id: string, status: EmailStatus) {
  return rpc<null>('set_email_status', { p_id: id, p_status: status })
}

export function emailRetryBatch(event: string, limit: number) {
  return rpc<RetryRow[]>('email_retry_batch', { p_event: event, p_limit: limit })
}
