import { lazy, Suspense, useState, useSyncExternalStore } from 'react'
import { DuplicateNotice } from './components/DuplicateNotice'
import { Hero } from './components/hero/Hero'
import { SuccessTicket } from './components/SuccessTicket'

// The form (react-hook-form + zod) loads after the hero has painted.
const RegistrationForm = lazy(() => import('./components/RegistrationForm').then((m) => ({ default: m.RegistrationForm })))

type Done = { kind: 'created'; code: string; fullName: string } | { kind: 'duplicate' }

export default function App() {
  const [done, setDone] = useState<Done | null>(null)
  // The prerendered HTML and the first client render both show the placeholder (hydration matches);
  // the lazy form mounts only after hydration, so React never tries to server-render it.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)

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
          Plug in. Grab your raffle ticket.
        </h2>
        <p id="form-intro" className="mb-5 mt-1.5 font-text text-lead text-muted">
          Takes about a minute. You'll get a raffle code for the prize draw at the event.
        </p>
        {hydrated ? (
          <Suspense fallback={<FormPlaceholder />}>
            <RegistrationForm onDone={finish} />
          </Suspense>
        ) : (
          <FormPlaceholder />
        )}
      </section>
    </main>
  )
}

function FormPlaceholder() {
  return <div className="min-h-[900px]" aria-busy="true" />
}

const noopSubscribe = () => () => {}
