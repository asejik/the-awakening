import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { FieldError } from './FieldShell'

type Props = {
  children: ReactNode
  error?: string
  registration: UseFormRegisterReturn
}

/** Whole row is tappable (≥44px). DESIGN.md §7 "Checkbox". */
export function CheckboxField({ children, error, registration }: Props) {
  const id = useId()
  return (
    <div className="mb-3">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1">
        <span className="relative mt-0.5 flex size-6 shrink-0">
          <input
            id={id}
            type="checkbox"
            {...registration}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={
              'peer size-6 cursor-pointer appearance-none rounded-sm border-ink bg-paper checked:bg-ink ' +
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
              (error ? '!border-error' : '')
            }
          />
          <Check aria-hidden size={16} strokeWidth={3} className="pointer-events-none absolute inset-0 m-auto hidden text-cream peer-checked:block" />
        </span>
        <span className="font-text text-small text-ink">{children}</span>
      </label>
      {error && <FieldError id={`${id}-error`} message={error} />}
    </div>
  )
}
