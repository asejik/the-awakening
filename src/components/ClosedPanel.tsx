import { CalendarClock, CircleCheck } from 'lucide-react'
import { EVENT } from '../../shared/event'

type Props = { state: 'not_open' | 'closed'; opensAt?: string | null }

function formatOpening(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    timeZone: 'Africa/Lagos', weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
  })
}

/** Replaces the form outside the registration window (PROJECT_PLAN §8 "closed / before opening"). */
export function ClosedPanel({ state, opensAt }: Props) {
  const Icon = state === 'closed' ? CircleCheck : CalendarClock
  return (
    <div role="status" className="bg-maroon p-5 text-center text-cream shadow-hard">
      <Icon aria-hidden size={36} strokeWidth={2} className="mx-auto" />
      <h2 className="mt-3 font-display text-h2">
        {state === 'closed' ? 'Registration is closed' : 'Registration opens soon'}
      </h2>
      <p className="mt-3 font-text text-lead">
        {state === 'closed'
          ? `Thank you for the love! See you at ${EVENT.name}.`
          : opensAt
            ? `Come back on ${formatOpening(opensAt)} to grab your raffle ticket.`
            : 'Check back shortly to grab your raffle ticket.'}
      </p>
      <p className="mt-3 font-text text-detail font-bold uppercase italic">{EVENT.venue}</p>
    </div>
  )
}
