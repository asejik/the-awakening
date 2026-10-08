import { EVENT } from '../../../shared/event'
import { Button } from '../Button'
import { DayBadge } from './DayBadge'
import { Starburst } from './Starburst'

const blob = 'absolute bg-maroon rounded-[58%_42%_50%_50%/50%_60%_40%_50%]'
const [venueName, ...venueRest] = EVENT.venue.split(', ')

/** The flyer as the first screen (DESIGN.md §4 hero order). */
export function Hero() {
  const scrollToForm = () => {
    const target = document.getElementById('register')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
    target?.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true })
  }

  return (
    <header className="relative overflow-hidden bg-cream pb-12">
      <Starburst className="absolute left-1/2 top-[70px] w-[760px] max-w-none -translate-x-1/2" />
      <div aria-hidden className={`${blob} -left-12 bottom-6 h-[120px] w-[130px]`} />
      <div aria-hidden className={`${blob} -bottom-8 -right-14 h-[130px] w-[150px]`} />

      <div className="relative mx-auto max-w-[440px] px-4 pt-4">
        {/* The supplied logo, unaltered: it already carries the church name. */}
        <picture className="block w-14">
          <source srcSet="/assets/clc-logo.webp" type="image/webp" />
          <img src="/assets/clc-logo.png" alt={EVENT.host} width={264} height={336} className="h-auto w-full" />
        </picture>

        <div className="mt-2 flex justify-between px-1">
          <DayBadge {...EVENT.days[0]} />
          <DayBadge {...EVENT.days[1]} reverse />
        </div>

        <h1 className="-mt-3">
          <picture className="block w-full">
            <source srcSet="/assets/title.webp" type="image/webp" />
            <img
              src="/assets/title.png"
              alt={`${EVENT.name}, ${EVENT.host}`}
              width={640}
              height={500}
              fetchPriority="high"
              className="h-auto w-full"
            />
          </picture>
        </h1>

        {/* Venue panel, as on the Pastor's updated flyer: church name, then the full address. */}
        <p className="mx-1.5 mt-3 bg-maroon px-4 py-3 text-center font-text text-detail font-bold uppercase text-cream shadow-panel">
          <span className="block font-display text-[22px] font-normal leading-tight">{EVENT.host}</span>
          <span className="mt-1 block italic">
            {venueName}, {venueRest.join(', ')}
          </span>
        </p>

        <div className="mt-6 text-center">
          <span className="inline-block -rotate-2 border-2 border-ink bg-paper px-3 py-0.5 font-text text-[15px] font-medium uppercase italic text-ink">
            Featuring
          </span>
          <ul className="mt-2 flex flex-wrap justify-center gap-x-2 font-text text-[19px] font-medium uppercase italic leading-tight text-ink">
            {EVENT.programme.map((item, i) => (
              <li key={item} className="flex gap-2">
                {i > 0 && (
                  <span aria-hidden className="font-bold text-maroon">
                    /
                  </span>
                )}
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex justify-center">
          <Button variant="secondary" onClick={scrollToForm}>
            Register free →
          </Button>
        </div>
      </div>
    </header>
  )
}
