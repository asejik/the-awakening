# Reusing the site for a new event

About an hour of work. Do everything on **TEST** first, check it, then **LIVE**.

## 1. Content and artwork
- [ ] `shared/event.ts`: name, tagline, days (label, date, weekday, time), venue, programme, institutions, contact email, consent copy
- [ ] `brand/`: new source artwork
- [ ] Regenerate the shipped images:
  - `public/assets/title.webp`/`.png` (640px)
  - `email-title.png` (560px)
  - `clc-logo.*` if it changed
- [ ] `index.html`: title, description, `og:` text
- [ ] `public/og.jpg`: edit the text lines in `scripts/make-og.py`, then run:
  ```bash
  python3 scripts/make-og.py LilitaOne-Regular.ttf BarlowCondensed-BoldItalic.ttf
  ```
- [ ] `src/privacy/PrivacyPage.tsx`: event name and "last updated" date
- [ ] `npm run email:build`, then `npm test` (the template-freshness test must pass)

## 2. Database (Supabase)
- [ ] The same TEST and LIVE projects can be reused. **Resume them first** if paused (Free projects pause after about 7 idle days).
- [ ] Pick a new `EVENT_SLUG` (e.g. `awakening-2027`: lowercase, digits, dashes). Rows are separated by event, so last year's data stays untouched.
- [ ] Only run migrations that haven't been applied yet (`supabase/migrations/`, TEST then LIVE).

## 3. Google Sheet
- [ ] Make a new Sheet (or copy last year's and clear the rows).
- [ ] Extensions → Apps Script: paste `apps-script/Code.gs`.
- [ ] Script Properties:
  - `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `EVENT_SLUG` (new), `ALERT_EMAIL`
  - LIVE only: `IS_LIVE=true`, `RETRY_URL=https://<site>/api/email-retry`, `RETRY_SECRET`
- [ ] Run `setupSheet`, then `installTrigger`.
- [ ] Share with the event leads only, **as viewers** where possible.

## 4. Vercel environment variables
| Variable | TEST (Preview) | LIVE (Production) |
|---|---|---|
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | TEST project | LIVE project |
| `EVENT_SLUG` | new slug | new slug (**identical** to the LIVE Sheet's) |
| `EMAIL_MODE` | `log` | `smtp` (production refuses anything else) |
| `SMTP_USER`, `SMTP_PASS` | church Gmail + app password | same |
| `RETRY_SECRET` | random | random (same as the LIVE Script Property) |
| `REGISTRATION_OPENS_AT` / `REGISTRATION_CLOSES_AT` | optional | ISO with offset, e.g. `2027-10-24T12:00:00+01:00` |
| `DRAW_PASSPHRASE` | (M6) | new passphrase |

Env changes only apply to **new deployments**: redeploy after editing (Deployments → ⋯ → Redeploy).

## 5. Check before sharing the link
- [ ] Run the load test against TEST:
  ```bash
  node scripts/load-test.mjs --url <preview>/api/register --n 50 --email-mode-is-log --p95 3000
  ```
- [ ] Run the browser tests:
  ```bash
  npm run test:e2e
  ```
- [ ] One real registration on LIVE with your own email: ticket shown, email arrives in the inbox, row appears in the Sheet within 5 minutes. Then delete that row in Supabase and the Sheet.
- [ ] Share a link in WhatsApp and check the preview image.
