import { describe, expect, it } from 'vitest'
import { confirmationEmail, fillTemplate } from './email'

describe('confirmation email', () => {
  it('fills every placeholder and escapes user input', () => {
    const m = confirmationEmail('t@x.co', 'Tolu <script>alert(1)</script> Adeyemi', 'K7QX', false)
    expect(m.html).not.toMatch(/\{\{[A-Z_]+\}\}/)
    expect(m.html).not.toContain('<script>')
    expect(m.html).toContain('Tolu &#60;script&#62;')
    expect(m.html).toContain('K7QX')
    expect(m.html).toContain("You&#39;re plugged in, Tolu!")
    expect(m.subject).toBe('Your The Awakening raffle code: K7QX')
  })

  it('uses re-send wording for duplicates', () => {
    const m = confirmationEmail('t@x.co', 'Tolu Adeyemi', 'K7QX', true)
    expect(m.html).toContain('already registered, Tolu!')
    expect(m.text).toContain('You only need to register once')
  })

  it('has a plain-text version with the code, dates and full venue', () => {
    const m = confirmationEmail('t@x.co', 'Tolu Adeyemi', 'K7QX', false)
    expect(m.text).toContain('YOUR RAFFLE CODE: K7QX')
    expect(m.text).toContain('Freedom Dome, Ilesanmi Bus Stop, Tanke, Ilorin')
    expect(m.text).toContain('Saturday, Oct. 24th · 4PM')
  })

  it('uses absolute image URLs from SITE_URL', () => {
    process.env.SITE_URL = 'https://awakening.example/'
    try {
      expect(confirmationEmail('t@x.co', 'T A', 'K7QX', false).html).toContain('src="https://awakening.example/assets/email-title.png"')
    } finally {
      delete process.env.SITE_URL
    }
  })

  it('refuses to send with an unfilled placeholder', () => {
    expect(() => fillTemplate('<p>{{CODE}} {{NEW_THING}}</p>', { CODE: 'X' })).toThrow('{{NEW_THING}}')
  })
})
