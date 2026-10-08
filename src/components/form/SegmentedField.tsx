import { useId } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { FieldError } from './FieldShell'

type Props = {
  legend: string
  options: readonly string[]
  error?: string
  registration: UseFormRegisterReturn
}

/** Two-option radio group drawn as sticker buttons (DESIGN.md §7 "Segmented choice"). */
export function SegmentedField({ legend, options, error, registration }: Props) {
  const id = useId()
  return (
    <fieldset className="mb-3.5" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="mb-1.5 block font-text text-label font-bold uppercase tracking-[0.06em] text-ink">{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <label key={o} className="relative">
            <input type="radio" value={o} {...registration} className="peer sr-only" />
            <span
              className={
                'flex min-h-12 cursor-pointer items-center justify-center rounded-md border-ink bg-paper font-text text-[18px] font-bold text-ink ' +
                'transition-colors duration-[var(--dur-fast)] peer-checked:bg-ink peer-checked:text-cream ' +
                'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ' +
                (error ? '!border-error' : '')
              }
            >
              {o}
            </span>
          </label>
        ))}
      </div>
      {error && <FieldError id={`${id}-error`} message={error} />}
    </fieldset>
  )
}
