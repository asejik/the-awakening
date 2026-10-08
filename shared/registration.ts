import { z } from 'zod'
import { INSTITUTION_OTHER, INSTITUTIONS, LEVELS } from './event.js'
import { normalizeNigerianPhone } from './phone.js'

// One schema for the page (react-hook-form) and the server (/api/register).
// The page POSTs exactly these values; the server parses them again and calls toPayload().

const institutionChoices: readonly string[] = [...INSTITUTIONS, INSTITUTION_OTHER]

export const registrationSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(80, 'Keep it under 80 characters'),
    gender: z.enum(['Male', 'Female'], { error: 'Choose one' }),
    institution: z.string().refine((v) => institutionChoices.includes(v), 'Choose your institution'),
    institution_other: z.string().trim().max(80, 'Keep it under 80 characters').default(''),
    department: z.string().trim().min(2, 'Enter your department').max(80, 'Keep it under 80 characters'),
    level: z.enum(LEVELS, { error: 'Choose your level' }),
    phone: z
      .string()
      .trim()
      .refine((v) => normalizeNigerianPhone(v) !== null, 'Enter an 11-digit number, e.g. 08012345678'),
    email: z.string().trim().max(120, 'Keep it under 120 characters').pipe(z.email('Enter a valid email, e.g. name@gmail.com')),
    needs_transport: z.enum(['Yes', 'No'], { error: 'Choose Yes or No' }),
    area: z.string().trim().max(60, 'Keep it under 60 characters').default(''),
    address: z.string().trim().max(200, 'Keep it under 200 characters').default(''),
    consent: z.literal(true, { error: 'You need to agree to register' }),
    age_confirmed: z.literal(true, { error: 'Please confirm this to register' }),
    followup_optin: z.boolean().default(false),
    source: z.string().trim().max(40).default(''),
  })
  // Cross-field rules run even when other fields are invalid (`when`), so people see every error at once.
  // The value may then be partly invalid, so read it defensively.
  .superRefine(
    (value, ctx) => {
      const v = value as Record<string, unknown>
      const text = (key: string) => (typeof v[key] === 'string' ? (v[key] as string).trim() : '')
      if (v.institution === INSTITUTION_OTHER && text('institution_other').length < 2) {
        ctx.addIssue({ code: 'custom', path: ['institution_other'], message: 'Enter the name of your institution' })
      }
      if (v.needs_transport === 'Yes') {
        if (text('area').length < 2) ctx.addIssue({ code: 'custom', path: ['area'], message: 'Tell us your area, e.g. Tanke' })
        if (text('address').length < 5) {
          ctx.addIssue({ code: 'custom', path: ['address'], message: 'Add your address so we can plan the bus' })
        }
      }
    },
    { when: () => true },
  )

export type RegistrationInput = z.input<typeof registrationSchema>
export type Registration = z.output<typeof registrationSchema>

/** The shape stored in the database (see api/_lib/db.ts RegisterPayload). */
export function toPayload(r: Registration) {
  const transport = r.needs_transport === 'Yes'
  return {
    full_name: r.full_name,
    gender: r.gender,
    institution: r.institution,
    institution_other: r.institution === INSTITUTION_OTHER ? r.institution_other : '',
    department: r.department,
    level: r.level,
    phone: normalizeNigerianPhone(r.phone)!,
    email: r.email.toLowerCase(),
    needs_transport: transport,
    area: transport ? r.area : '',
    address: transport ? r.address : '',
    followup_optin: r.followup_optin,
    age_confirmed: true,
    source: r.source,
  }
}

/** Field name → first error message, for the API's 400 response and the form. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    out[key] ??= issue.message
  }
  return out
}
