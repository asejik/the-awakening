import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, WifiOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { COPY, INSTITUTION_OTHER, INSTITUTIONS } from '../../shared/event'
import { clearDraft, loadDraft, saveDraft } from '../lib/draft'
import { registrationSchema, type Registration, type RegistrationInput } from '../../shared/registration'
import { sourceTag, submitRegistration, type SubmitResult } from '../lib/submit'
import { Button } from './Button'
import { CheckboxField } from './form/CheckboxField'
import { SegmentedField } from './form/SegmentedField'
import { SelectField } from './form/SelectField'
import { TextField } from './form/TextField'

type Done = Extract<SubmitResult, { kind: 'created' | 'duplicate' }>
type Closed = Extract<SubmitResult, { kind: 'closed' | 'not_open' }>['kind']
type Banner = 'offline' | 'error' | null

const SLOW_AFTER_MS = 8_000

export function RegistrationForm({ onDone, onClosed }: { onDone: (result: Done) => void; onClosed: (state: Closed) => void }) {
  const [banner, setBanner] = useState<Banner>(null)
  const [slow, setSlow] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const openedAt = useRef(0)
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const {
    register,
    handleSubmit,
    control,
    subscribe,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationInput, unknown, Registration>({
    resolver: zodResolver(registrationSchema),
    mode: 'onTouched',
    shouldFocusError: true,
    defaultValues: {
      full_name: '', institution: '', institution_other: '', department: '', phone: '', email: '',
      area: '', address: '', followup_optin: false, ...loadDraft(), source: sourceTag(),
    },
  })

  useEffect(() => subscribe({ formState: { values: true }, callback: ({ values }) => saveDraft(values) }), [subscribe])

  const institution = useWatch({ control, name: 'institution' })
  const needsTransport = useWatch({ control, name: 'needs_transport' })

  useEffect(() => {
    if (banner) bannerRef.current?.focus()
  }, [banner])

  const onSubmit = async (values: Registration, event?: React.BaseSyntheticEvent) => {
    setBanner(null)
    const slowTimer = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    const result = await submitRegistration(values, {
      website: String(new FormData(event?.target as HTMLFormElement).get('website') ?? ''),
      elapsed_ms: Date.now() - openedAt.current,
    })
    clearTimeout(slowTimer)
    setSlow(false)

    if (result.kind === 'created' || result.kind === 'duplicate') {
      clearDraft()
      return onDone(result)
    }
    if (result.kind === 'closed' || result.kind === 'not_open') return onClosed(result.kind)
    if (result.kind === 'invalid') {
      const names = Object.keys(result.fields) as (keyof RegistrationInput)[]
      names.forEach((name) => setError(name, { message: result.fields[name] }))
      if (names[0]) setFocus(names[0])
      return
    }
    setBanner(result.kind)
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate aria-describedby="form-intro" className="relative">
      <TextField label="Full name" autoComplete="name" registration={register('full_name')} error={errors.full_name?.message} />

      <SegmentedField legend="Gender" options={['Male', 'Female']} registration={register('gender')} error={errors.gender?.message} />

      <SelectField
        label="Institution"
        placeholder="Choose your institution"
        options={[...INSTITUTIONS, INSTITUTION_OTHER]}
        registration={register('institution')}
        error={errors.institution?.message}
      />
      {institution === INSTITUTION_OTHER && (
        <TextField
          className="reveal"
          label="Name of your institution"
          autoComplete="organization"
          registration={register('institution_other')}
          error={errors.institution_other?.message}
        />
      )}

      <TextField label="Department" registration={register('department')} error={errors.department?.message} />

      <TextField
        label="Phone (WhatsApp)"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="08012345678"
        registration={register('phone')}
        error={errors.phone?.message}
      />

      <TextField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="name@gmail.com"
        hint="We'll email your raffle code here."
        registration={register('email')}
        error={errors.email?.message}
      />

      <SegmentedField
        legend="Need a pickup bus?"
        options={['Yes', 'No']}
        registration={register('needs_transport')}
        error={errors.needs_transport?.message}
      />
      {needsTransport === 'Yes' && (
        <div className="reveal">
          <TextField
            label="Area"
            placeholder="e.g. Tanke, Oke-Odo, School hostel"
            hint="Helps us choose the nearest pickup point."
            registration={register('area')}
            error={errors.area?.message}
          />
          <TextField
            label="Address"
            autoComplete="street-address"
            registration={register('address')}
            error={errors.address?.message}
          />
        </div>
      )}

      <div className="mt-5">
        <CheckboxField registration={register('consent')} error={errors.consent?.message}>
          {COPY.consent}{' '}
          <a href="/privacy" target="_blank" rel="noopener" className="font-semibold text-ember-700 underline underline-offset-2">
            Read the privacy notice
          </a>
          .
        </CheckboxField>
        <CheckboxField registration={register('age_confirmed')} error={errors.age_confirmed?.message}>
          {COPY.ageConfirm}
        </CheckboxField>
        <CheckboxField registration={register('followup_optin')}>
          {COPY.followup} <span className="text-muted">(Optional)</span>
        </CheckboxField>
      </div>

      {banner && (
        <div
          ref={bannerRef}
          tabIndex={-1}
          role="alert"
          className="reveal mt-4 flex items-start gap-2.5 rounded-md border-ink !border-error bg-paper p-3.5 font-text text-lead text-ink outline-none"
        >
          {banner === 'offline' ? (
            <WifiOff aria-hidden size={22} strokeWidth={2.5} className="mt-0.5 shrink-0 text-error" />
          ) : (
            <CircleAlert aria-hidden size={22} strokeWidth={2.5} className="mt-0.5 shrink-0 text-error" />
          )}
          <span>
            {banner === 'offline'
              ? "You seem to be offline. Your answers are still here. Tap the button again when you're connected."
              : "We couldn't save your registration. Your answers are still here. Please try again in a minute."}
          </span>
        </div>
      )}

      {/* Honeypot: invisible to people (and screen readers); bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <Button type="submit" loading={isSubmitting} className="mt-5 w-full">
        {isSubmitting ? 'Registering…' : 'Get my ticket'}
      </Button>
      <p aria-live="polite" className="mt-3 min-h-6 text-center font-text text-small text-muted">
        {slow ? "Still working, please don't close this page." : ''}
      </p>
    </form>
  )
}
