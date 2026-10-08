import { useId } from 'react'

type Props = { label: string; date: string; time: string; reverse?: boolean }

/** Maroon disc with rotating ring text, lifted from the flyer (DESIGN.md §7 "Day badge"). */
export function DayBadge({ label, date, time, reverse = false }: Props) {
  const pathId = useId()
  const [month, day] = date.split(' ') // "Oct. 31st" → "Oct." / "31st"
  const ring = `${label.toUpperCase()} · `.repeat(5)

  return (
    <div className="relative grid size-24 shrink-0 place-items-center rounded-full bg-maroon text-center text-cream shadow-hard-sm">
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className={`absolute inset-0 animate-badge-spin ${reverse ? '[animation-direction:reverse]' : ''}`}
      >
        <defs>
          <path id={pathId} d="M50,50 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
        </defs>
        <text className="fill-cream font-text text-[10.5px] font-semibold tracking-[0.12em]">
          <textPath href={`#${pathId}`}>{ring}</textPath>
        </text>
      </svg>
      <p className="relative font-text font-bold uppercase italic">
        <span className="sr-only">{label}: </span>
        <span className="block text-[21px] leading-[0.9]">{month}</span>
        <span className="block text-[21px] leading-[0.9]">{day}</span>
        <span className="mx-auto mt-1 block w-10 border-t-2 border-ember pt-0.5 text-[16px] leading-none">{time}</span>
      </p>
    </div>
  )
}
