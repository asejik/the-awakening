import { EVENT } from '../shared/event'
import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import { ClosedPanel } from './components/ClosedPanel'
import { DuplicateNotice } from './components/DuplicateNotice'
import { Hero } from './components/hero/Hero'
import { SuccessTicket } from './components/SuccessTicket'

// The form (react-hook-form + zod) loads after the hero has painted.
const RegistrationForm = lazy(() => import('./components/RegistrationForm').then((m) => ({ default: m.RegistrationForm })))

type Done = { kind: 'created'; code: string; fullName: string } | { kind: 'duplicate' }
type Status = { state: 'loading' | 'open' | 'not_open' | 'closed'; opensAt?: string | null }

export default function App() {
  const [done, setDone] = useState<Done | null>(null)
  // The prerendered HTML and the first client render both show the placeholder (hydration matches);
  // the lazy form mounts only after hydration, so React never tries to server-render it.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)
  const [status, setStatus] = useState<Status>({ state: 'loading' })

  // Which screen to show (open / opens soon / closed). If the check fails, show the form:
  // the server still enforces the window.
  useEffect(() => {
    let live = true
    fetch('/api/status', { signal: AbortSignal.timeout(8_000) })
      .then((r) => r.json())
      .then((s: Status) => live && setStatus(s.state ? s : { state: 'open' }))
      .catch(() => live && setStatus({ state: 'open' }))
    return () => {
      live = false
    }
  }, [])

  const finish = (result: Done) => {
    window.scrollTo(0, 0)
    setDone(result)
  }

  if (done?.kind === 'created') return <SuccessTicket code={done.code} fullName={done.fullName} />
  if (done?.kind === 'duplicate') return <DuplicateNotice />

  return (
    <main>
      <Hero />

      <section id="register" aria-labelledby="register-heading" className="mx-auto max-w-[440px] scroll-mt-4 px-4 pb-10 pt-8">
        <span className="mb-2 inline-block -rotate-2 border-2 border-ink bg-paper px-2.5 py-0.5 font-display text-[15px] text-ember-700 shadow-hard-sm">
          IT'S FREE
        </span>
        <h2 id="register-heading" className="font-display text-h1 text-ink">
          Register now
        </h2>
        <p id="form-intro" className="mb-5 mt-1.5 font-text text-lead text-muted">
          {status.state === 'not_open' || status.state === 'closed'
            ? "Registration happens right here on this page."
            : 'It takes about a minute.'}
        </p>
        {!hydrated || status.state === 'loading' ? (
          <FormPlaceholder />
        ) : status.state === 'open' ? (
          <Suspense fallback={<FormPlaceholder />}>
            <RegistrationForm onDone={finish} onClosed={(state) => setStatus({ state })} />
          </Suspense>
        ) : (
          <ClosedPanel state={status.state} opensAt={status.opensAt} />
        )}
      </section>

      <footer className="mx-auto max-w-[440px] border-t-2 border-ink/15 px-4 pb-10 pt-5 text-center font-text text-small text-muted">
        <p>
          Questions? Email{' '}
          <a href={`mailto:${EVENT.contactEmail}`} className="font-semibold text-ember-700 underline underline-offset-2">
            {EVENT.contactEmail}
          </a>
        </p>
        <p className="mt-1">
          {EVENT.host} ·{' '}
          <a href="/privacy" className="underline underline-offset-2">
            Privacy notice
          </a>
        </p>
      </footer>
    </main>
  )
}

function FormPlaceholder() {
  return <div className="min-h-[900px]" aria-busy="true" />
}

const noopSubscribe = () => () => {}
