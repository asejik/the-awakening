import { Camera } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { EVENT } from '../../shared/event'

type Props = { code: string; fullName: string }

/** The raffle ticket (DESIGN.md §7). Static in M2; the stamp/entrance motion arrives in M3. */
export function SuccessTicket({ code, fullName }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const firstName = fullName.trim().split(/\s+/)[0]
  const nameSize = fullName.length > 26 ? 'text-[18px]' : 'text-[22px]'

  return (
    <section className="relative min-h-dvh overflow-hidden bg-ember px-4 pb-44 pt-5">
      <div aria-hidden className="absolute -bottom-8 -left-12 h-[120px] w-[130px] rounded-[58%_42%_50%_50%/50%_60%_40%_50%] bg-maroon" />
      <div aria-hidden className="absolute -right-14 bottom-10 h-[130px] w-[150px] rounded-[58%_42%_50%_50%/50%_60%_40%_50%] bg-maroon" />

      <div className="relative mx-auto max-w-[440px]">
        <picture className="mx-auto block w-[180px]">
          <source srcSet="/assets/title.webp" type="image/webp" />
          <img src="/assets/title.png" alt={EVENT.name} width={720} height={562} className="h-auto w-full" />
        </picture>

        <h1 ref={headingRef} tabIndex={-1} className="mt-3 text-center font-display text-h2 text-ink outline-none">
          You're plugged in, {firstName}!
        </h1>
        <p className="mt-2 text-center font-text text-lead text-ink">Here's your raffle ticket. We've emailed it to you too.</p>

        <div className="relative mx-auto mt-5 w-full max-w-[300px] rounded-xl border-ink-thick bg-cream shadow-hard-lg">
          <div className="flex items-center rounded-t-[14px] bg-maroon px-3.5 py-2.5 font-text text-[14px] font-bold uppercase tracking-[0.1em] text-cream">
            Raffle ticket
          </div>
          <p className={`px-4 pt-3.5 text-center font-display leading-[1.05] text-ink ${nameSize}`}>{fullName}</p>
          <p
            className="pt-1.5 text-center font-display text-code tracking-[0.08em] text-ink select-all"
            aria-label={`Your raffle code is ${code.split('').join(' ')}`}
          >
            {code}
          </p>
          <p className="pb-1 pt-1 text-center font-text text-[14px] font-bold uppercase tracking-[0.14em] text-ember-700">
            Your raffle code
          </p>
          <div aria-hidden className="relative mt-4 border-t-[3px] border-dashed border-ink">
            <span className="absolute -left-4 -top-[15px] size-[26px] rounded-full border-ink-thick bg-ember [clip-path:inset(0_0_0_50%)]" />
            <span className="absolute -right-4 -top-[15px] size-[26px] rounded-full border-ink-thick bg-ember [clip-path:inset(0_50%_0_0)]" />
          </div>
          <dl className="grid grid-cols-2 gap-2 px-4 pb-3.5 pt-3 font-text text-[16px] font-medium italic uppercase leading-tight text-ink">
            {EVENT.days.map((d) => (
              <div key={d.label}>
                <dt className="text-[12px] font-bold not-italic tracking-[0.1em] text-muted">{d.label}</dt>
                <dd>
                  {d.date} · {d.time}
                </dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-[12px] font-bold not-italic tracking-[0.1em] text-muted">Venue</dt>
              <dd>{EVENT.venue}</dd>
            </div>
          </dl>
          <span
            aria-hidden
            className="absolute -right-2.5 -top-4 rotate-[14deg] rounded-sm border-[3px] border-ember-700 bg-cream/85 px-2 py-0.5 font-display text-[18px] text-ember-700"
          >
            ENTERED!
          </span>
        </div>

        <div className="relative mx-auto mt-6 flex w-full max-w-[300px] items-center gap-2.5 bg-maroon px-3.5 py-2.5 font-text text-[17px] leading-snug text-cream">
          <Camera aria-hidden size={22} strokeWidth={2} className="shrink-0" />
          <span>Screenshot this ticket. You'll need the code if you win.</span>
        </div>
        <p className="relative mx-auto mt-3 max-w-[300px] text-center font-text text-small text-ink">
          Check your inbox (and spam) for a copy.
        </p>
      </div>
    </section>
  )
}
