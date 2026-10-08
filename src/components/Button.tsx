import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

/** Sticker button: ink outline + hard shadow that presses in (DESIGN.md §6 item 1, §7). */
export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={
        'inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg border-ink-thick px-6 py-3 ' +
        'font-display text-button tracking-[0.02em] text-ink shadow-hard ' +
        'transition-[transform,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] ' +
        'active:translate-x-1 active:translate-y-1 active:shadow-pressed ' +
        'motion-reduce:active:translate-x-0 motion-reduce:active:translate-y-0 ' +
        'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink ' +
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:translate-0 disabled:active:shadow-hard ' +
        (variant === 'primary' ? 'bg-ember ' : 'bg-paper ') +
        className
      }
    >
      {loading && <LoaderCircle aria-hidden size={22} strokeWidth={2.5} className="animate-spin motion-reduce:animate-none" />}
      {children}
    </button>
  )
}
