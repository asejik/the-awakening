import { EVENT } from '../../shared/event.js'
import { CONFIRMATION_HTML } from './email-template.js'
import type { Mail } from './mailer.js'

// HTML comes from emails/Confirmation.tsx (React Email + Tailwind), pre-rendered into
// email-template.ts by `npm run email:build`. Values are HTML-escaped before insertion.

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

/** Absolute site URL for images and the footer. Vercel exposes the production domain at runtime. */
function siteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return host ? `https://${host}` : 'http://localhost:3000'
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key: string) =>
    key in values ? escapeHtml(values[key]) : match,
  )
  const left = html.match(/\{\{[A-Z_]+\}\}/)
  if (left) throw new Error(`email template placeholder not filled: ${left[0]}`)
  return html
}

export function confirmationEmail(to: string, fullName: string, code: string, resend: boolean): Mail {
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''
  const heading = resend ? `You're already registered, ${firstName}!` : `You're plugged in, ${firstName}!`
  const intro = resend
    ? `Here's your raffle code for ${EVENT.name} again. You only need to register once.`
    : `You're registered for ${EVENT.name}. Here's your raffle ticket for the prize draw at the event.`
  const url = siteUrl()

  const html = fillTemplate(CONFIRMATION_HTML, {
    PREVIEW: `Your raffle code is ${code}. ${EVENT.days.map((d) => `${d.date} ${d.time}`).join(' & ')}.`,
    HEADING: heading,
    INTRO: intro,
    FULL_NAME: fullName,
    CODE: code,
    SITE_URL: url,
  })

  const text = [
    heading,
    '',
    intro,
    '',
    `RAFFLE TICKET: ${fullName}`,
    `YOUR RAFFLE CODE: ${code}`,
    '',
    ...EVENT.days.map((d) => `${d.label}: ${d.weekday}, ${d.date} · ${d.time}`),
    `Venue: ${EVENT.venue}`,
    '',
    "Keep this email or screenshot your ticket. You'll need your code if you win the raffle draw.",
    '',
    'See you there!',
    EVENT.host,
    '',
    `You're receiving this because you registered for ${EVENT.name} at ${url}.`,
  ].join('\n')

  return { to, subject: `Your ${EVENT.name} raffle code: ${code}`, text, html }
}
