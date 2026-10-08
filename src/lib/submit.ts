import type { Registration } from '../../shared/registration'

export type SubmitResult =
  | { kind: 'created'; code: string; fullName: string }
  | { kind: 'duplicate' }
  | { kind: 'invalid'; fields: Record<string, string> }
  | { kind: 'offline' }
  | { kind: 'error' }

const TIMEOUT_MS = 25_000

/** POSTs the validated form. Never throws: every outcome maps to a screen state. */
export async function submitRegistration(values: Registration): Promise<SubmitResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { kind: 'offline' }

  let res: Response
  try {
    res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return navigator.onLine === false ? { kind: 'offline' } : { kind: 'error' }
  }

  const body = await res.json().catch(() => ({}))
  if (res.status === 201 && typeof body.code === 'string') {
    return { kind: 'created', code: body.code, fullName: String(body.full_name ?? values.full_name) }
  }
  if (res.status === 200 && body.status === 'duplicate') return { kind: 'duplicate' }
  if (res.status === 400 && body.fields) return { kind: 'invalid', fields: body.fields }
  return { kind: 'error' }
}

/** `?src=qr-hostel` from QR codes and shared links, kept short and plain. */
export function sourceTag(): string {
  const src = new URLSearchParams(window.location.search).get('src') ?? ''
  return src.replace(/[^a-z0-9-]/gi, '').slice(0, 40)
}
