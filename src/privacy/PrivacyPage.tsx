import type { ReactNode } from 'react'
import { EVENT } from '../../shared/event'

// Plain-language privacy notice (NDPA 2023). Content mirrors PROJECT_PLAN §9; keep them in sync.
// Not legal advice: the church should have it reviewed if it can.
const UPDATED = '8 October 2026'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-[24px] leading-tight text-ink">{title}</h2>
      <div className="mt-2 space-y-2 font-text text-lead text-ink">{children}</div>
    </section>
  )
}

const mail = (
  <a href={`mailto:${EVENT.contactEmail}`} className="font-semibold text-ember-700 underline underline-offset-2">
    {EVENT.contactEmail}
  </a>
)

export function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[640px] px-4 pb-16 pt-6">
      <a href="/" className="inline-block">
        <picture className="block w-16">
          <source srcSet="/assets/clc-logo.webp" type="image/webp" />
          <img src="/assets/clc-logo.png" alt={`${EVENT.host}: back to registration`} width={264} height={336} className="h-auto w-full" />
        </picture>
      </a>

      <h1 className="mt-6 font-display text-h1 text-ink">Privacy notice</h1>
      <p className="mt-2 font-text text-lead text-muted">
        {EVENT.name} registration · Last updated {UPDATED}
      </p>

      <Section title="Who we are">
        <p>
          {EVENT.host}, Ilorin, runs {EVENT.name} and this registration page. We are responsible for the information you
          give us here. Contact us at {mail}.
        </p>
      </Section>

      <Section title="What we collect">
        <ul className="list-disc space-y-1 pl-5">
          <li>Your full name, gender, institution and department</li>
          <li>Your phone (WhatsApp) number and email address</li>
          <li>Whether you need a pickup bus and, only if you do, your area and address</li>
          <li>Your answers to the consent and age questions, and the time you registered</li>
          <li>Your raffle code, and whether we managed to email it to you</li>
        </ul>
        <p>We don't ask for your date of birth, ID or photos.</p>
      </Section>

      <Section title="Why we use it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To organise the event: headcount, seating and materials</li>
          <li>To plan pickup buses and tell you where to meet them</li>
          <li>To run the raffle draw and check that a winner's code is really theirs</li>
          <li>To send your raffle code and event details by email</li>
          <li>
            To follow up with you after the event by phone, WhatsApp or email about church activities, and to add you to our
            membership records. If you didn't tick the optional follow-up box, we won't call or message you for follow-up.
          </li>
        </ul>
        <p>We use your details because you agreed to this when you registered.</p>
      </Section>

      <Section title="Who can see it">
        <p>
          Only the church team organising the event (registration, transport and follow-up leads). We do not sell your
          details or share them outside the church.
        </p>
        <p>
          Your details are stored for us by two service providers: <b>Supabase</b> (our secure database) and <b>Google</b>{' '}
          (a Google Sheet the team works from, and the Gmail account that sends your confirmation). Their servers are outside
          Nigeria.
        </p>
      </Section>

      <Section title="How long we keep it">
        <p>
          We keep your registration for follow-up and church membership. We review it 12 months after the event and delete
          home addresses and anything we no longer need.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the Nigeria Data Protection Act 2023 you can ask us to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>show you the information we hold about you</li>
          <li>correct anything that's wrong</li>
          <li>delete your information</li>
          <li>stop follow-up calls or messages at any time</li>
        </ul>
        <p>
          Email {mail} from the address you registered with, and we'll respond as soon as we can. If you're not happy with our
          response, you can complain to the Nigeria Data Protection Commission.
        </p>
      </Section>

      <Section title="Under 18?">
        <p>
          If you're under 18, please register only with your parent's or guardian's consent. A parent or guardian can ask us to
          delete a child's details at {EVENT.contactEmail}.
        </p>
      </Section>

      <p className="mt-10">
        <a href="/" className="font-display text-button text-ink underline underline-offset-4">
          ← Back to registration
        </a>
      </p>
    </main>
  )
}
