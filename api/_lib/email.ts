import type { Mail } from './mailer.js'

// M1: plain confirmation email. Branded template arrives in M3 (docs/DESIGN.md).

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)
}

export function confirmationEmail(to: string, fullName: string, code: string, resend: boolean): Mail {
  const firstName = fullName.trim().split(/\s+/)[0] ?? ''
  const intro = resend
    ? `You're already registered for The Awakening. Here's your raffle code again.`
    : `You're plugged in for The Awakening! Here's your raffle code.`
  const details = [
    'Day 1: Saturday, Oct 24 · 4PM',
    'Day 2: Sunday, Oct 25 · 9AM',
    'Freedom Dome, Ilesanmi Bus Stop, University Road, Tanke, Ilorin',
  ]

  const text = [
    `Hi ${firstName},`,
    '',
    intro,
    '',
    `YOUR RAFFLE CODE: ${code}`,
    '',
    ...details,
    '',
    'Keep this email. You will need your code if you win the raffle draw.',
    '',
    'See you there!',
    'Citizens of Light Church',
  ].join('\n')

  const html = `<p>Hi ${escapeHtml(firstName)},</p>
<p>${escapeHtml(intro)}</p>
<p style="font-size:14px;letter-spacing:.1em;margin:0">YOUR RAFFLE CODE</p>
<p style="font-size:40px;font-weight:bold;letter-spacing:.12em;margin:4px 0 16px">${escapeHtml(code)}</p>
<p>${details.map(escapeHtml).join('<br>')}</p>
<p>Keep this email. You will need your code if you win the raffle draw.</p>
<p>See you there!<br>Citizens of Light Church</p>`

  return { to, subject: `Your Awakening raffle code: ${code}`, text, html }
}
