// Everything specific to this event. To reuse the site for another event, change this file,
// the artwork in public/assets, and the env vars (EVENT_SLUG, open/close times).
// Used by both the page (src/) and the server (api/).

export const EVENT = {
  name: 'The Awakening',
  tagline: 'Freshers Plug In',
  host: 'Citizens of Light Church',
  days: [
    { label: 'Day 1', date: 'Oct. 24th', weekday: 'Saturday', time: '4PM' },
    { label: 'Day 2', date: 'Oct. 25th', weekday: 'Sunday', time: '9AM' },
  ],
  /** Always shown in full (builder decision 2026-10-08). */
  venue: 'Freedom Dome, Ilesanmi Bus Stop, Tanke, Ilorin',
  programme: ['Music', 'Freedom Studio Film', 'Word', 'Conscious Flow', 'Prayer'],
} as const

/** Builder decision 2026-10-08: UNILORIN freshers are the main target; everyone else picks Other. */
export const INSTITUTIONS = ['University of Ilorin'] as const
export const INSTITUTION_OTHER = 'Other'

export const COPY = {
  consent:
    'By registering, you agree that Citizens of Light Church may use your details to organise The Awakening ' +
    '(including transport and the raffle draw) and to contact you afterwards by phone, WhatsApp or email about ' +
    "church activities. Your details are stored securely with the church's service providers (Supabase and " +
    'Google) and will not be shared outside the church.',
  ageConfirm: "I am 18 or older, or I have my parent/guardian's consent.",
  followup: "Yes, I'd like the church to follow up with me by call or WhatsApp.",
} as const
