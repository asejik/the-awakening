// Everything specific to this event. To reuse the site for another event, change this file,
// the artwork in public/assets, and the env vars (EVENT_SLUG, open/close times).
// Used by both the page (src/) and the server (api/).

export const EVENT = {
  name: 'The Awakening',
  tagline: 'Freshers Plug In',
  host: 'Citizens of Light Church',
  /** Privacy requests (access, correction, deletion). Builder decision 2026-10-08. */
  contactEmail: 'clcchurchmedia@gmail.com',
  days: [
    // Rescheduled 2026-10-08 (builder): was Oct 24–25.
    { label: 'Day 1', date: 'Oct. 31st', weekday: 'Saturday', time: '4PM' },
    { label: 'Day 2', date: 'Nov. 1st', weekday: 'Sunday', time: '9AM' },
  ],
  /** Always shown in full (builder decision 2026-10-08). */
  venue: 'Freedom Dome, Ilesanmi Bus Stop, Tanke, Ilorin',
  programme: ['Music', 'Freedom Studio Film', 'Word', 'Conscious Flow', 'Prayer'],
  /** For structured data (SEO). The end time isn't known, so the end is a date only. */
  schedule: { start: '2026-10-31T16:00:00+01:00', endDate: '2026-11-01' },
  place: { name: 'Freedom Dome', street: 'Ilesanmi Bus Stop, Tanke', locality: 'Ilorin', region: 'Kwara', country: 'NG' },
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
  /** P04 S-03 / builder decision: deter duplicate and fake entries. */
  raffleRules:
    'One registration per person. Duplicate or fake registrations will be reviewed and removed, and won\'t count in the raffle. ' +
    'Winners must be present and show an ID that matches their registered name.',
  winnerId: 'Winners must show an ID that matches this name.',
} as const
