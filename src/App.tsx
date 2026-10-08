import { useState } from 'react'
import { EVENT } from '../shared/event'
import { DuplicateNotice } from './components/DuplicateNotice'
import { RegistrationForm } from './components/RegistrationForm'
import { SuccessTicket } from './components/SuccessTicket'

type Done = { kind: 'created'; code: string; fullName: string } | { kind: 'duplicate' }

export default function App() {
  const [done, setDone] = useState<Done | null>(null)

  const finish = (result: Done) => {
    window.scrollTo(0, 0)
    setDone(result)
  }

  if (done?.kind === 'created') return <SuccessTicket code={done.code} fullName={done.fullName} />
  if (done?.kind === 'duplicate') return <DuplicateNotice />

  return (
    <main>
      {/* M2 hero stand-in; the full poster hero (starburst, Day badges) lands in M3. */}
      <header className="mx-auto flex max-w-[440px] flex-col items-center px-4 pb-6 pt-5 text-center">
        {/* The supplied logo, unaltered: it already carries the church name. */}
        <picture className="block w-20 self-start">
          <source srcSet="/assets/clc-logo.webp" type="image/webp" />
          <img src="/assets/clc-logo.png" alt={EVENT.host} width={264} height={336} className="h-auto w-full" />
        </picture>
        <picture className="mt-6 block w-full">
          <source srcSet="/assets/title.webp" type="image/webp" />
          <img src="/assets/title.png" alt={EVENT.name} width={720} height={562} className="h-auto w-full" />
        </picture>
        <p className="mt-1 bg-maroon px-5 py-2 font-display text-h2 uppercase text-cream">
          Freshers
          <br />
          Plug in
        </p>
        <p className="mt-4 font-text text-detail font-bold uppercase italic text-muted">
          {EVENT.days.map((d) => `${d.date} · ${d.time}`).join(' & ')}
          <br />
          {EVENT.venue}
        </p>
      </header>

      <section aria-labelledby="register-heading" className="mx-auto max-w-[440px] px-4 pb-10 pt-2">
        <span className="mb-2 inline-block -rotate-2 border-2 border-ink bg-paper px-2.5 py-0.5 font-display text-[15px] text-ember-700 shadow-hard-sm">
          IT'S FREE
        </span>
        <h2 id="register-heading" className="font-display text-h1 text-ink">
          Plug in. Grab your raffle ticket.
        </h2>
        <p id="form-intro" className="mb-5 mt-1.5 font-text text-lead text-muted">
          Takes about a minute. You'll get a raffle code for the prize draw at the event.
        </p>
        <RegistrationForm onDone={finish} />
      </section>
    </main>
  )
}
