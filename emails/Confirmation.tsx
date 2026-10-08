import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  pixelBasedPreset,
} from '@react-email/components'
import { EVENT } from '../shared/event'

/**
 * Confirmation / re-send email, authored with Tailwind (DESIGN.md "Email").
 * React Email inlines the classes at build time (`npm run email:build`), producing
 * api/_lib/email-template.ts. {{PLACEHOLDERS}} are filled and HTML-escaped at send time.
 *
 * Fluid layout only: no `sm:`/`md:` classes. React Email 1.0 + Tailwind 4 inlines responsive
 * variants unconditionally (found 2026-10-08), and fluid widths are the safest choice for Gmail anyway.
 */
const PLACEHOLDERS = ['PREVIEW', 'HEADING', 'INTRO', 'FULL_NAME', 'CODE', 'SITE_URL'] as const
const p = (name: (typeof PLACEHOLDERS)[number]) => `{{${name}}}`

const FONT_FACES = [
  ['Lilita One', 400, 'https://fonts.gstatic.com/s/lilitaone/v17/i7dPIFZ9Zz-WBtRtedDbYEF8RQ.woff2'],
  ['Barlow Condensed', 500, 'https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B4-Lwz3bWuQ.woff2'],
  ['Barlow Condensed', 700, 'https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuQ.woff2'],
]
  .map(([family, weight, url]) => `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(${url}) format('woff2');}`)
  .join('')

const config = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        cream: '#FAF0DC',
        paper: '#FFF8F6',
        ember: '#F05A35',
        'ember-700': '#C7381A',
        maroon: '#4E0710',
        ink: '#140A0A',
        muted: '#5C4842',
      },
      fontFamily: {
        display: ['"Lilita One"', '"Arial Black"', 'Arial', 'sans-serif'],
        text: ['"Barlow Condensed"', '"Arial Narrow"', 'Arial', 'sans-serif'],
      },
    },
  },
}

export function Confirmation() {
  return (
    <Html lang="en">
      <Tailwind config={config}>
        <Head>
          <meta name="color-scheme" content="light only" />
          <meta name="supported-color-schemes" content="light" />
          {/* Plain @font-face only: React Email's <Font> also sets `* { font-family }`, which
              forced the display face onto body text. Clients without web fonts use the fallbacks. */}
          <style>{FONT_FACES}</style>
        </Head>
        <Preview>{p('PREVIEW')}</Preview>
        <Body className="m-0 bg-cream px-0 py-6 font-text text-ink">
          <Container className="mx-auto w-full max-w-[600px] bg-cream">
            {/* Header: ember band with the title artwork */}
            <Section className="rounded-t-[18px] bg-ember px-6 pb-6 pt-7 text-center">
              <Img
                src={`${p('SITE_URL')}/assets/email-title.png`}
                alt={`${EVENT.name}: ${EVENT.tagline}`}
                width="260"
                height="203"
                className="mx-auto block h-auto w-[260px] max-w-full"
              />
              <Text className="m-0 mt-4 inline-block bg-maroon px-4 py-1.5 font-display text-[20px] uppercase leading-[24px] text-cream">
                {EVENT.tagline}
              </Text>
            </Section>

            <Section className="px-5 pb-2 pt-7 text-center">
              <Text className="m-0 font-display text-[28px] leading-[32px] text-ink">{p('HEADING')}</Text>
              <Text className="m-0 mt-3 text-[17px] leading-[24px] text-ink">{p('INTRO')}</Text>
            </Section>

            {/* The raffle ticket. Thick right/bottom borders stand in for the hard shadow (no box-shadow in email). */}
            <Section className="px-5 pt-4">
              <Section className="mx-auto w-full max-w-[380px] rounded-[18px] border-[3px] border-b-[9px] border-r-[9px] border-solid border-ink bg-paper">
                <Text className="m-0 rounded-t-[14px] bg-maroon px-4 py-2.5 text-left text-[13px] font-bold uppercase leading-[16px] tracking-[2px] text-cream">
                  Raffle ticket
                </Text>
                <Text className="m-0 px-4 pt-4 text-center font-display text-[22px] leading-[26px] text-ink">{p('FULL_NAME')}</Text>
                <Text className="m-0 pt-1 text-center font-display text-[52px] leading-[60px] tracking-[8px] text-ink">
                  {p('CODE')}
                </Text>
                <Text className="m-0 pb-4 text-center text-[13px] font-bold uppercase leading-[16px] tracking-[3px] text-ember-700">
                  Your raffle code
                </Text>
                <Section className="border-0 border-t-[3px] border-dashed border-ink px-4 pb-4 pt-3">
                  {EVENT.days.map((d) => (
                    <Text key={d.label} className="m-0 mb-1 text-left text-[15px] leading-[20px] text-ink">
                      <b className="text-[12px] uppercase tracking-[1px] text-muted">{d.label}&nbsp;&nbsp;</b>
                      {d.weekday}, {d.date} · {d.time}
                    </Text>
                  ))}
                  <Text className="m-0 text-left text-[15px] leading-[20px] text-ink">
                    <b className="text-[12px] uppercase tracking-[1px] text-muted">Venue&nbsp;&nbsp;</b>
                    {EVENT.venue}
                  </Text>
                </Section>
              </Section>
            </Section>

            <Section className="px-5 pt-6">
              <Text className="m-0 bg-maroon px-4 py-3 text-center text-[16px] leading-[22px] text-cream">
                Keep this email or screenshot your ticket. You'll need your code if you win the raffle draw, and an ID
                that matches your registered name.
              </Text>
            </Section>

            <Section className="px-5 pb-2 pt-6 text-center">
              <Text className="m-0 font-display text-[22px] leading-[26px] text-ink">See you there!</Text>
              <Text className="m-0 mt-1 text-[15px] leading-[20px] text-muted">{EVENT.host}</Text>
            </Section>

            <Section className="px-5 pb-4 pt-4 text-center">
              <Text className="m-0 text-[12px] leading-[18px] text-muted">
                You're receiving this because you registered for {EVENT.name} at {p('SITE_URL')}. If that wasn't you,
                reply to this email and we'll remove your details.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default Confirmation
