export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined
}

export const controlClass = (invalid: boolean) =>
  'block min-h-[50px] w-full rounded-md bg-paper px-3.5 py-2.5 font-text text-body font-medium text-ink ' +
  'border-ink outline-none transition-shadow duration-[var(--dur-fast)] placeholder:text-muted/70 ' +
  'focus:shadow-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ' +
  (invalid ? '!border-error' : '')
