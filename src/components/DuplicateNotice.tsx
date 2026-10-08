import { MailCheck } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { EVENT } from '../../shared/event'
import { Button } from './Button'

/** Already registered: never shows the existing code (it's only re-sent to the email on file). */
export function DuplicateNotice({ onBack }: { onBack: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])

  return (
    <section className="min-h-dvh bg-ember px-4 pb-10 pt-5">
      <div className="mx-auto max-w-[440px]">
        <picture className="mx-auto block w-[180px]">
          <source srcSet="/assets/title.webp" type="image/webp" />
          <img src="/assets/title.png" alt={EVENT.name} width={640} height={500} className="h-auto w-full" />
        </picture>
        <div className="mx-auto mt-6 max-w-[340px] bg-maroon p-5 text-center text-cream shadow-panel">
          <MailCheck aria-hidden size={36} strokeWidth={2} className="mx-auto" />
          <h1 ref={headingRef} tabIndex={-1} className="mt-3 font-display text-h2 outline-none">
            You're already registered!
          </h1>
          <p className="mt-3 font-text text-lead">
            We've re-sent your raffle code to the email you used when you registered. Check your inbox (and spam).
          </p>
          <p className="mt-3 font-text text-small text-cream/85">Didn't get it? Wait 10 minutes, then try registering again.</p>
        </div>
        <div className="mt-7 flex justify-center">
          <Button variant="secondary" onClick={onBack}>
            ← Back to home
          </Button>
        </div>
      </div>
    </section>
  )
}
