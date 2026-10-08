# Project Plan: The Awakening Registration

Mode: NEW · Source: [IDEA_BRIEF.md](IDEA_BRIEF.md) · Client answers: pending ([CLIENT_QUESTIONS.md](CLIENT_QUESTIONS.md)). Recommended defaults are used and marked [ASSUMPTION].
Prepared 2026-10-08. Event: Oct 24–25, 2026. Target launch: **Oct 13**, with a hard fallback deadline of Oct 14.

---

## 0. Project Profile

| Field | Value |
|---|---|
| Name | The Awakening Registration |
| Type | Client project (internal organisation tool for Citizens of Light Church) |
| Owner | Client: Citizens of Light Church, Ilorin. Builder: asejik |
| Platform | Public, mobile-first website (single-page app plus serverless functions). Not a PWA or native app. |
| Public pages | Yes: registration page, confirmation screen, privacy notice. Protected: raffle draw page (Next tier). |
| Users and scale | About 500 registrants over about 10 days, with bursts after outreach (assume up to 150/day and 30 at once). Fewer than 5 admins. Reused per event afterwards (similar scale). |
| User locations and laws | Ilorin, Nigeria. **Nigeria Data Protection Act 2023 (NDPA).** |
| Languages | English only |
| Data sensitivity | Moderate. Names, phone numbers, emails, gender and home addresses of students, some possibly under 18. No financial or ID data. |
| Payments | None |
| AI features | None |
| Stack | Frontend: Vite + React + TypeScript + Tailwind CSS 4. Backend: Vercel Functions (Node). Database: Google Sheet via Apps Script web app. Auth: none for registrants; shared passphrase for the draw page. Email: Gmail SMTP (nodemailer, app password). Hosting: Vercel Hobby. |
| Key integrations | Google Apps Script web app (church account); Gmail SMTP (church account) |
| Environments | dev (local `vercel dev` with a test Sheet and log-only email) · preview (Vercel preview with the test Sheet) · prod (live Sheet with real email) |
| Rigor level | **STANDARD**: public form holding students' personal data, but short-lived, with no payments or auth. (AUDIT_STANDARD.md not provided; level agreed with the builder.) |

---

## 1. Problem and Outcomes

**Problem.** The church needs a headcount, transport data, a fair raffle and a follow-up list for about 500 freshers attending The Awakening. It wants this on a custom, on-brand page rather than a generic form.

**Goal.** Every registrant gets a unique raffle code on screen and by email within seconds or minutes. Every registration becomes exactly one clean row in the church's Google Sheet.

### Success criteria

| Criterion | Target | How measured |
|---|---|---|
| Live in time | Production URL live by Oct 13 (Oct 14 at the latest) | Deployment date |
| No lost registrations | 100% of "success" screens have a matching Sheet row | Compare success-function log count with Sheet row count daily |
| Email delivered | ≥95% of rows show `email_status = SENT` within 24 hours | Sheet filter on `email_status` |
| No duplicate tickets | 0 duplicate phone numbers or emails in the Sheet | Sheet `COUNTIF` check / pre-draw audit |
| Speed | p95 submit-to-code time under 5s on mobile data | Function logs (duration) |
| Volume | ~500 registrations (church target) | Sheet row count, tracked daily |
| Fair draw | Draw completed on the day with no disputes | Winners tab plus organiser feedback |
| Transport planned | Pickup points decided from Sheet data by Oct 22 | Transport lead confirms |

### User stories

1. **As a fresher**, I want to register in under two minutes on my phone, **so that** I'm counted and entered into the raffle.
   - Form works on a 360px-wide screen; all fields are reachable without horizontal scrolling.
   - Validation errors appear next to the field, in plain English, without clearing my other answers.
   - Submitting with valid data shows my code within 5s (p95).
2. **As a fresher**, I want my raffle code shown on screen and sent to my email, **so that** I can't lose it.
   - The code is shown large, with "Screenshot this" guidance and the event details.
   - An email with the same code arrives, normally within a minute. If it's delayed, it's retried automatically.
   - If email fails, I still see my code on screen.
3. **As a fresher who registers twice by mistake**, I want to be told I'm already registered, **so that** I don't get confused.
   - Re-using a registered phone number or email gives "You're already registered. We've re-sent your code to your email."
   - No new row is created, and the existing code is **not** shown on screen (see §9).
4. **As a church organiser**, I want each registration as a row in our Google Sheet, **so that** I can count attendees, plan buses and follow up.
   - Each row has a timestamp, code, all form fields, consent flags and email status.
   - Sheet access is limited to named leads.
5. **As the raffle host** (Next tier), I want to draw a random code on the projector, **so that** the draw is fair and visible.
   - The draw page needs a passphrase.
   - Drawn codes are never drawn again. The host can mark a winner as "Claimed" or "Absent, redraw".
   - Every draw is recorded in a Winners tab.

### Out of scope
- Registrant accounts or logins
- Payments
- Check-in at the door
- WhatsApp or SMS messages
- Automatic pickup-point assignment
- Admin dashboard (the Sheet is the admin tool)
- Multiple languages
- Offline mode
- Running several events on one deployment (reuse means new settings plus a new Sheet per event, see §5)

### Requirement mapping
No PRD (Mode B). The client's verbal requirements map as follows:

| Requirement | Covered by |
|---|---|
| Registration page for The Awakening | Story 1, Epic A |
| 4-character random code, emailed | Stories 2–3, Epic B |
| Details sent to Google Sheet | Story 4, Epic B |
| Fields: name, gender, department, phone, email, address | Epic A (plus institution, transport need, area and consent from P00) |
| Raffle on the day | Story 5, Epic D (Next) |
| Branded, "excellence" | Epic C |
| Reusable for future events | Epic E |

---

## 2. Features and Scope

| Epic | Feature | Tier | Why |
|---|---|---|---|
| **A. Registration form** | Form with all fields, client-side and server-side validation | MVP | The core job |
| | Conditional address and area fields (only if "Needs bus = Yes") | MVP | Cleaner transport data, less personal data collected |
| | Privacy notice, consent and age checkboxes | MVP | NDPA |
| | Registration open/close by date-time (server-enforced) | MVP | Raffle list must freeze at the draw |
| **B. Code and storage** | Unique 4-character code, look-alike characters removed, generated under a lock | MVP | Raffle integrity |
| | De-duplication by normalised phone and email | MVP | One ticket per person |
| | Row written to the Sheet; result returned to the page | MVP | The core job |
| | Confirmation screen with the code | MVP | Main way people get their code |
| | Confirmation email via Gmail SMTP, sent after the response | MVP | Client requirement |
| | Email status tracking plus automatic retry | MVP | Gmail limits make failures likely on burst days |
| | "Already registered": re-send the code to the email on file | MVP | Handles duplicates without leaking codes |
| **C. Branding** | Flyer-matched design, optimised artwork, event details section | MVP | The reason the client chose a custom page |
| **D. Raffle** | Passphrase-protected draw page, random server-side draw, Winners tab, Claimed/Absent | **Next** (after launch, by Oct 20) | Agreed: build after registration is stable |
| | Projector animation | Next | Nice to have on the day |
| **E. Reuse** | All event content in one config file plus environment variables; Sheet template and Apps Script in the repo; setup guide | MVP (light) / Later (polish) | Client wants reuse; keep the cost low now |
| | Spam protection: honeypot plus minimum fill time | MVP | Public form |
| | Cloudflare Turnstile, behind a switch | Later (enable only if spam appears) | Extra friction and dependency on slow networks |
| | Admin stats page, CSV export, check-in | Later | The Sheet covers these for now |

---

## 3. Users, Roles and Permissions

| Role | View | Create | Edit | Delete | How they authenticate |
|---|---|---|---|---|---|
| Registrant (public) | Own code (only on the success screen, once) | Own registration | — | Request by emailing the church (manual) | None |
| Organiser / lead | Sheet rows (as shared) | — | Sheet cells (shared editors only) | Sheet rows (owner/editors) | Their Google account, via Sheet sharing |
| Raffle host (Next) | Drawn code plus the winner's first name and institution only | Draw records | Winner status (Claimed/Absent) | — | Shared draw passphrase (server-checked) |
| Builder | Everything (dev and prod) | Deployments | Code, config | — | Church Google account, Vercel, GitHub |
| Church account owner | Everything | — | — | Everything; can revoke the app password and the Apps Script | Church Google account |

**Account lifecycle.** There are no user accounts. Admin access is plain Google Sheet sharing. The draw passphrase is set as an environment variable, changed per event, and removed after the event. The app password is **deleted after the event** (part of close-out), which cuts off email instantly.

---

## 4. Data Model

Storage is one Google Spreadsheet per event, owned by the church Google account.

### Tab `Registrations`
Ownership: the church. Rows are created by Apps Script only, never edited by the app.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Generated by Apps Script |
| `created_at` | ISO datetime (Africa/Lagos) | |
| `code` | 4 characters | Alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (31 characters, 923,521 combinations). Unique. |
| `full_name` | text ≤ 80 | Trimmed |
| `gender` | enum | Male / Female |
| `institution` | enum | From config list, or `Other` |
| `institution_other` | text ≤ 80 | Only when `Other` |
| `department` | text ≤ 80 | Free text |
| `phone` | text | Normalised to `0XXXXXXXXXX` (11 digits, Nigerian). **Unique.** |
| `email` | text | Lowercased and trimmed. **Unique.** |
| `needs_transport` | Yes / No | |
| `area` | text ≤ 60 | Only when transport = Yes, e.g. "Tanke", "Oke-Odo" |
| `address` | text ≤ 200 | Only when transport = Yes |
| `consent_at` | ISO datetime | Required |
| `followup_optin` | Yes / No | Separate opt-in for calls and WhatsApp messages [ASSUMPTION: client Q6] |
| `age_confirmed` | Yes | Required [ASSUMPTION: client Q7] |
| `email_status` | PENDING / SENT / FAILED | |
| `email_attempts` | integer | |
| `emailed_at` | ISO datetime | |
| `source` | text ≤ 40 | Optional `?src=` tag from QR codes or links, e.g. `qr-hostel`, `wa-status`; used to measure outreach |

### Tab `Winners` (Next)
Columns: `drawn_at`, `code`, `registration_id`, `status` (DRAWN / CLAIMED / ABSENT), `round`.

### Tab `Log`
Columns: `at`, `level`, `action`, `message`. Errors only, with no personal data beyond the row `id`.

### Standard fields and rules
- IDs and timestamps are on every row. `created_by` doesn't apply (the public creates rows).
- There's no tenant column: one Sheet per event provides the isolation.
- There's no soft delete. Deletion requests are handled by hand by deleting the row, and Sheet version history makes that recoverable for about 30 days.

### Access rules (designed now)
- The spreadsheet is **private to the church account**, shared by name with at most 3 leads [ASSUMPTION: client Q12]. Never "anyone with the link".
- **Only Apps Script writes**, and only after verifying the shared secret. Vercel never has a Google credential.
- The Apps Script web app runs **as the church account** with access set to "Anyone". The secret in the request body is the gate (Apps Script `doPost` can't read custom headers).
- Every value starting with `= + - @` is prefixed with `'` before it's written, to prevent formula injection.

### Sensitive data, retention and deletion
- Address and area are collected only when the person needs transport.
- **Retention [ASSUMPTION: client Q15]:** keep for follow-up and membership; review and delete addresses 12 months after the event. The sheet remains church property.
- Deletion requests go to the church email listed in the privacy notice, and the builder or church deletes the row by hand.

### Existing data to import
None.

---

## 5. Tech Stack

### Frontend and function options

| | **Option 1: Vite + React + Vercel Functions** (recommended) | Option 2: Next.js (App Router) |
|---|---|---|
| Cost | Free on Vercel Hobby | Free on Vercel Hobby |
| Learning curve | Lowest: same as `raw-registration` and `fma-registration` | Low: same as `ces` |
| Fit | One page plus two or three functions. A static build means the smallest bundle for low-end phones. | Server rendering, routing and server actions are mostly unused here |
| Local dev | Needs `vercel dev` to run `/api` functions locally | `next dev` runs everything |
| Lock-in | Low (`/api` functions are small Node handlers) | Low to medium (Vercel-optimised features) |
| AI codegen reliability | High | High |
| Reuse | Config file plus env vars | Same |

**Decision: Option 1.** You've shipped this exact shape twice for the same church, and the page doesn't need server rendering. The only cost is running `vercel dev` locally.

### Data and storage
**Apps Script web app writing to the church Sheet**, called **server-to-server from the Vercel function**, not from the browser. This is the builder's choice.

This fixes the `no-cors` limitation of `raw-registration`: the function gets a real JSON response, so it can return the code and the "already registered" or error states.

### Libraries
- `zod` validates on both client and server, from one shared schema
- `react-hook-form` handles the form, as in fma-registration
- `nodemailer` sends email, as in ces
- `@vercel/functions` provides `waitUntil`, so the email is sent after the response
- Vitest for unit tests; Playwright for end-to-end tests

**Skipped:**
- **TanStack Query and other state libraries:** one form submit doesn't need them.
- **UI kits:** they fight the custom look.
- **A real database:** the client wants the Sheet, and the scale is tiny.

### Free tiers: limits, what happens when exceeded, and first paid tier
**All figures should be verified before launch.**

| Service | Relevant limits | When exceeded | First paid tier |
|---|---|---|---|
| Vercel Hobby | **Non-commercial use only**; bandwidth about 100 GB/month; function duration limits apply (check whether the current default and maximum fit `maxDuration`) | Deployments or functions throttled or paused until the next cycle | Pro, about $20/user/month |
| Gmail SMTP (consumer) | About **500 recipients/day** (commonly reported, not confirmed by Google for consumer accounts); rolling 24 hours | Sending blocked for up to 24h; **incoming mail unaffected** | Google Workspace (needs a domain); 2,000/day |
| Apps Script (consumer) | Script runtime 6 min/execution; URL Fetch about 20,000/day; triggers about 90 min/day total; about 30 simultaneous executions; MailApp 100 recipients/day (not used) | Script throws and requests fail; the function shows "try again" | Workspace raises the quotas |
| Google Sheets | 10M cells per spreadsheet | N/A at this scale | — |
| GitHub | Free private repos | — | — |

None of these services pauses inactive projects.

### Reuse design
- `src/config/event.ts` holds everything specific to the event:
  - name, tagline, dates, venue, programme
  - institution list, colours, artwork paths
  - email subject and body copy
- Per-event environment variables (§6) point to that event's Sheet and Apps Script, and set the open and close times.
- `apps-script/Code.gs` lives in the repo, along with a `docs/SETUP_NEW_EVENT.md` checklist (written in M5): copy the Sheet template, paste the script, deploy, set the env vars, swap the config and artwork.

---

## 6. Architecture

```mermaid
flowchart LR
  subgraph Phone["Registrant's phone"]
    UI["Registration SPA<br/>(Vite + React)"]
  end
  subgraph Vercel["Vercel (Hobby)"]
    REG["POST /api/register"]
    RETRY["POST /api/email-retry"]
    DRAW["POST /api/draw (Next)"]
  end
  subgraph Google["Church Google account"]
    GAS["Apps Script web app<br/>doPost(action) + LockService"]
    SHEET[("Google Sheet<br/>Registrations · Winners · Log")]
    TRIG["Time trigger<br/>(every 15 min)"]
    GMAIL["Gmail SMTP"]
  end
  UI -- "form JSON" --> REG
  REG -- "secret + register" --> GAS
  GAS <--> SHEET
  GAS -- "{status, code, id}" --> REG
  REG -- "{status, code}" --> UI
  REG -. "waitUntil: send mail" .-> GMAIL
  REG -. "setEmailStatus" .-> GAS
  TRIG -- "pending/failed rows + secret" --> RETRY
  RETRY --> GMAIL
  RETRY -- "results" --> TRIG
  DRAW -- "secret + draw" --> GAS
```

### Flow for one registration
1. The browser validates the form with zod, then sends a POST to `/api/register`. The request includes the honeypot field and the form's open timestamp.
2. The function:
   - re-validates and normalises the phone and email
   - rejects bots (honeypot filled, or form submitted in under 3s)
   - rejects requests when registration is closed
   - calls Apps Script `register` with the secret
3. Apps Script takes a script **lock**, then:
   - checks the phone and email against existing rows
   - generates a code until it's unique
   - appends the row with `email_status = PENDING`
   - releases the lock
   - returns `{status: "created", id, code}` or `{status: "duplicate", id, email}`
4. The function replies to the browser straight away:
   - `created`: returns the code to show on screen
   - `duplicate`: returns "already registered"
5. Using `waitUntil`, the function then sends the email over Gmail SMTP: for `created`, the new code; for `duplicate`, a re-send to **the email on file**, limited to one re-send per 10 minutes, tracked in Apps Script. It then calls Apps Script `setEmailStatus` with SENT or FAILED.
6. **Retry:**
   - Every 15 minutes, an Apps Script time trigger collects rows that are FAILED, or PENDING for over 10 minutes, with `email_attempts` below 5.
   - It sends them (with the secret) to `/api/email-retry`, which emails them over SMTP and returns per-row results.
   - The trigger updates the statuses.
   - This keeps a single email template and one sending path.

### Server functions

| Endpoint | Purpose | Who can call |
|---|---|---|
| `POST /api/register` | Validate, store via Apps Script, return the code, then send the email | Public (honeypot, timing check, closed-window check) |
| `POST /api/email-retry` | Send emails for the rows Apps Script passes in | Apps Script trigger only (shared secret `RETRY_SECRET`) |
| `POST /api/draw` (Next) | Draw a random unused code; mark Claimed or Absent | Raffle host (passphrase `DRAW_PASSPHRASE`); limited to 5 failed attempts per IP per 10 minutes, tracked in Apps Script |

**Apps Script actions** (one `doPost`, routed by `action`): `register`, `setEmailStatus`, `draw`, `markWinner`. Each one checks `GAS_SECRET` first.

### Client vs server
- **Browser:** rendering, validation (for convenience only), the honeypot field, and showing results.
- **Server (Vercel):** the real validation, phone and email normalisation, the open/close check, bot checks, all secrets, SMTP, and the draw passphrase check.
- **Apps Script:** the lock, de-duplication, code generation, writing rows, random draw selection, and the retry trigger.

### Secrets: server only, never in the browser bundle
- In Vercel env: `GAS_URL`, `GAS_SECRET`, `SMTP_USER`, `SMTP_PASS` (app password), `RETRY_SECRET`, `DRAW_PASSPHRASE`, `REGISTRATION_OPENS_AT`, `REGISTRATION_CLOSES_AT`, `EMAIL_MODE` (`smtp` | `log`).
- **No `VITE_` prefix on any secret.** `VITE_` variables are compiled into the bundle.
- In Apps Script Script Properties: `GAS_SECRET`, `RETRY_URL`, `RETRY_SECRET`.

### What happens when a dependency goes down

| Dependency | If it's down or slow | Behaviour |
|---|---|---|
| Apps Script / Sheets | Registration can't be saved | Function times out after 20s and returns "We couldn't save your registration. Please try again." No code is shown, because no code exists. Logged in Vercel. |
| Gmail SMTP (limit reached or outage) | Email not sent | The registrant already has the code on screen. Row marked FAILED; the trigger retries every 15 minutes for up to about 75 minutes (5 attempts), and then the builder re-queues by hand. |
| Vercel | Site down | Nothing works. Fallback: Plan B Google Form (see §14). |

---

## 7. AI Features
N/A: none planned or needed.

---

## 8. Error Handling and Reliability

| Category | What the user sees | What the system does | What's logged |
|---|---|---|---|
| Input validation | Message under each field, e.g. "Enter an 11-digit phone number, e.g. 08012345678." Answers kept. | Same zod schema runs on the server; 400 if invalid | Nothing (normal behaviour) |
| Network or offline at submit | "You seem to be offline. Your answers are saved here. Tap Submit again when connected." | Form state kept in memory, and in `sessionStorage` in case of an accidental refresh | Nothing |
| Slow network | Button shows "Registering…" and is disabled; after 8s, "Still working, please don't close this page" | Client timeout 25s, then the error state | — |
| Apps Script error or timeout | "We couldn't save your registration. Please try again in a minute." | 20s fetch timeout; no automatic retry (avoids double rows), and the user retries. Safe, because de-duplication catches a row that did save. | Vercel log: action, duration, error |
| Lock contention (bursts) | Same as a slow network; if the lock isn't free within 10s, "busy, try again" | `LockService.tryLock(10000)`; 20s fetch timeout; function `maxDuration` 30s | Apps Script `Log` tab if the lock fails |
| SMTP failure or Gmail limit | Nothing new (the code is already on screen) | Row → FAILED; the trigger retries | Vercel log plus `Log` tab |
| Duplicate submission (double tap) | Button disabled after the first tap | The server de-duplicates by phone and email under the lock | — |
| Re-registration | "You're already registered. We've re-sent your code to the email you used." | The re-send is limited (one per 10 minutes) | — |
| Registration closed | The page shows "Registration is closed. See you at The Awakening!" in place of the form | Server returns 403 even if the page is stale | — |
| Bot (honeypot or too fast) | A fake success screen with no code (so the bot learns nothing) | No row written | Count only |
| Partial failure (row saved, response lost) | The user sees an error, retries, and gets "already registered" plus an email | De-duplication makes retries safe | — |

### Key screen states
- **Form:** idle, submitting, field errors, network error, server error, closed, before opening ("Registration opens on…").
- **Success:** the code shown large, plus the "Screenshot this" prompt, "Check your inbox (and spam)", and the event details with an add-to-calendar link (Later).
- **Draw (Next):** passphrase gate, ready, drawing animation, result, "Claimed" or "Absent, redraw", and "No codes left".

---

## 9. Security, Privacy and Compliance

| Threat | Mitigation |
|---|---|
| Bot or spam flood filling the Sheet and using up email quota | Honeypot field; minimum fill time (3s); emails only go to newly created rows. The Turnstile switch is ready if spam appears. Daily row-count check. |
| Multiple tickets per person | Unique phone and unique email, enforced under a lock in Apps Script |
| **Code harvesting** (entering someone's phone or email to see their code) | Duplicates **never return the code to the browser**; it's only re-sent to the email on file |
| Prize claimed with a screenshot of someone else's code | At the draw, the winner states their full name and phone number, and the host checks the Winners result against the Sheet |
| Apps Script URL discovered | Every action requires `GAS_SECRET` (a long random string) in the body. Rotate it per event. |
| Secrets leaking into the browser bundle | No secret has a `VITE_` prefix. The pre-launch audit checks the bundle with grep. |
| Formula injection in the Sheet | Prefix leading `= + - @` with `'` before writing |
| Email header or content injection | Fields validated and length-limited; nodemailer builds headers; names escaped in the HTML email |
| Draw page passphrase guessed | Server-side check; failed attempts limited; passphrase changed per event |
| Personal data exposed through Sheet sharing | Named-person sharing only, never link sharing; a pre-launch check of sharing settings |
| Church Gmail compromised through the app password | The app password is used only by Vercel env; **deleted after the event** |

### NDPA 2023 (verify; this isn't legal advice)
- **Privacy notice** on the page, linked next to the consent checkbox. It covers:
  - who collects the data (Citizens of Light Church)
  - what is collected and why (event logistics, transport, raffle, follow-up and membership)
  - who sees it, how long it's kept, and how to request access or deletion (the church email)
- **Consent:** a required checkbox for the event purposes, plus a **separate optional opt-in** for follow-up calls and WhatsApp messages.
- **Minors:** a required "18 or older, or I have my parent/guardian's consent" checkbox [ASSUMPTION: client Q7].
- **Minimise data:** collect address and area only when transport is needed. No date of birth, ID or photos.
- **Access and deletion requests:** handled manually by the church within a reasonable time.

---

## 10. Non-Functional Requirements

- **Performance (low-end Android on 3G/4G):**
  - JavaScript under 120 KB gzipped
  - Hero artwork **under 150 KB**. The current flyer PNG is 1.4 MB at 5400px, so export cropped WebP/AVIF at ≤1080px wide with a PNG fallback.
  - At most 2 web fonts, with `font-display: swap`
  - LCP under 2.5s on a simulated "Fast 3G" connection
- **Low-end devices:** no heavy animation libraries; CSS-only effects; works without hover.
- **Accessibility (WCAG 2.2 AA basics):**
  - Labels on every field, and errors linked to their fields
  - Contrast ≥ 4.5:1. Watch cream-on-orange and white-on-orange.
  - Touch targets ≥ 24px (aim for 44px)
  - Visible focus, logical keyboard order
  - The code announced to screen readers on the success screen
  - `autocomplete` attributes (name, email, tel, street-address)
- **SEO:** basic only. Title, description, and an Open Graph image (the flyer) so WhatsApp and social link previews look right. That matters here, because WhatsApp Status is the main channel.
- **Browsers:** Chrome Android, Opera Mini (basic support: the form must at least submit), Safari iOS, and in-app browsers (WhatsApp, Instagram).

---

## 11. Quality and Operations

**Testing:**
- **Unit tests (Vitest), only for logic that can break subtly:**
  - Nigerian phone normalisation (`+234…`, `234…`, `0…`, spaces and dashes)
  - the zod schema, including conditional fields
  - the open/close window check
  - the HTML escaping in the email template
- **End-to-end smoke tests (Playwright), run against preview with the test Sheet and `EMAIL_MODE=log`:**
  1. Happy path: fill in the form, submit, see the code, and the row appears in the test Sheet.
  2. Transport = Yes shows the address and area fields, which then become required.
  3. Duplicate phone number gives the "already registered" message and no code.
  4. Registration closed shows the closed message, and the API returns 403.
  5. (Next) Draw: wrong passphrase is rejected; right passphrase draws an unused code.
- **Load and spike test (M1):** a script sends 50 parallel registrations to the preview environment.

**Environments and deployment:**
- A GitHub repo is connected to Vercel. Pull requests and branches create preview deployments using the **test Sheet**; `main` deploys to prod using the live Sheet.
- Apps Script has two deployments: test and prod. **Update deployments by editing the existing deployment to a new version** (Manage deployments → Edit → New version), so the URL stays the same. A *new* deployment changes the URL. (`raw-registration` hit this.)

**Backups:** Sheet version history (automatic), plus a manual CSV export each evening from Oct 20 and before the draw.

**Monitoring:**
- Vercel function logs (errors and durations)
- Apps Script executions dashboard and the `Log` tab
- A daily 2-minute check by the builder: row count, any FAILED or PENDING emails, and errors

**Analytics (tied to success criteria):**
- Vercel Web Analytics (free tier, verify the limits) for page views, so you can work out conversion = rows ÷ visitors
- The `source` column for which outreach channel works

---

## 12. Build Plan

Riskiest first. Every milestone deploys.

| # | Milestone | Effort | Target |
|---|---|---|---|
| M0 | Setup | S | Oct 8 |
| M1 | **Spike: end-to-end pipeline under load** | S–M | Oct 9 |
| M2 | Real form, validation, de-duplication, confirmation | M | Oct 10 |
| M3 | Branding and content (after **P06**) | M | Oct 11 |
| M4 | Hardening: retry, spam protection, open/close, privacy notice, states, tests | M | Oct 12 |
| M5 | Launch (after **P04 + P08 + P03 PRE-LAUNCH**) | S | **Oct 13** |
| M6 | Raffle draw page (Next) | M | Oct 15–19 |
| M7 | Rehearsal, event and close-out | S | Oct 21–31 |

**P07 for every build task.** Run **P03 mid-project after M2**.

### M0: Setup (S)
**Goal:** a Vite + React + TS + Tailwind 4 project in its own git repo, deploying to Vercel.

**Tasks:**
- `git init` inside `the-awakening/`, then create a GitHub repo
- Create the Vercel project; connect the repo
- Create the test Sheet and the prod Sheet in the church account, from a template with the §4 headers
- Create the Apps Script project (bound to each Sheet)
- Turn on 2-Step Verification on the church Gmail; create an app password
- Add env vars in Vercel (Preview → test, Production → prod)

**Done when:**
- [ ] Pushing to `main` updates the live `*.vercel.app` URL showing a placeholder page
- [ ] Both Sheets exist in the church Drive, shared with nobody yet
- [ ] The app password exists and is stored only in Vercel env

### M1: Spike, the riskiest part (S–M)
**Goal:** prove function → Apps Script (lock, de-duplication, code) → Sheet → SMTP email works, is fast enough and lands in the inbox.

**Tasks:**
- Minimal `/api/register` and Apps Script `register` / `setEmailStatus`
- A bare HTML form
- Send to Gmail, Yahoo and Outlook test inboxes
- A 50-parallel-request load script against preview
- Confirm that `waitUntil` sends after the response, and how the function duration limit applies

**Done when:**
- [ ] One submit creates one row and shows a code, and the email arrives in the **inbox** (not spam) for the Gmail and one other provider
- [ ] 50 parallel submits give 50 rows, 50 unique codes, no errors, p95 under 8s
- [ ] The same phone submitted twice leaves one row
- [ ] SMTP disabled (wrong password) still shows the code, and the row shows FAILED
- [ ] **If any of these fail: stop and re-plan** (see §14, fallbacks)

### M2: Real form (M)
**Goal:** all fields, a shared zod schema, conditional transport fields, phone normalisation, the duplicate path, the confirmation screen, and the real email template (plain styling for now).

**Done when:**
- [ ] On a real Android phone, I can register in under 2 minutes and every validation message makes sense
- [ ] Choosing "Other" for institution shows a text box, and "Needs bus = Yes" shows the area and address fields
- [ ] `+234 801 234 5678` and `08012345678` are treated as the same person
- [ ] A duplicate shows "already registered" and re-sends the email, with no code on screen
- [ ] Unit tests pass

**Then:** run **P03 (mid-project)**.

### M3: Branding (M)
**Goal:** the page looks like the flyer, loads fast and is accessible. **Run P06 first.**

**Tasks:**
- Optimised artwork and the Open Graph image
- Fonts and colour tokens from the flyer
- Event details section
- Success-screen design
- Branded email template

**Done when:**
- [ ] The church contact approves screenshots of the form and success screen (**client sign-off 1**)
- [ ] A Lighthouse mobile run gives Performance ≥ 90 and Accessibility ≥ 95; the hero image is under 150 KB
- [ ] A WhatsApp link preview shows the flyer image and the title

### M4: Hardening (M)
**Tasks:**
- Retry trigger and `/api/email-retry`
- Honeypot and timing check
- Open/close window
- Privacy notice page
- All §8 states
- Formula-injection guard
- Playwright smoke tests 1–4
- `SETUP_NEW_EVENT.md` draft

**Done when:**
- [ ] Setting the app password wrong for one test, then fixing it, means FAILED rows turn SENT within 15–30 minutes
- [ ] Setting `REGISTRATION_CLOSES_AT` in the past shows the closed message, and the API refuses requests
- [ ] Turning airplane mode on before submit shows the offline message, and the answers survive
- [ ] Playwright smoke tests pass on preview

### M5: Launch (S)
**Run P04 + P08 + P03 PRE-LAUNCH first.**

**Tasks:**
- Prod env vars and a fresh `GAS_SECRET`
- Clear any test rows from the prod Sheet
- Share the Sheet with the named leads
- QR codes with `?src=` tags for outreach
- Hand the URL and QR codes to the church

**Done when:**
- [ ] A real registration on prod (the builder's own) works end to end, and the test row is then deleted
- [ ] Sheet sharing lists only the named leads
- [ ] The church confirms the go-live (**client sign-off 2**)

### M6: Raffle draw page (M, Next)
**Tasks:**
- `/draw` route with the passphrase gate
- `/api/draw` and Apps Script `draw` / `markWinner`
- Winners tab
- Projector-friendly layout and animation
- Playwright test 5

**Done when:**
- [ ] On the venue laptop and projector, the draw shows a code; "Absent" redraws a different code; drawn codes never repeat
- [ ] A wrong passphrase is refused, and after 5 wrong tries the page is locked for 10 minutes
- [ ] The church rehearses it once (**client sign-off 3**)

### M7: Rehearsal, event and close-out (S)
**Tasks:**
- Oct 21–22: final transport export and a draw rehearsal with the event's data
- Close registration at the agreed time
- After the event:
  - delete the app password
  - rotate or remove `GAS_SECRET` and `DRAW_PASSPHRASE`
  - set the page to "closed"
  - archive the Sheet

**Done when:**
- [ ] The app password is deleted (Google account → Security), the closed page is live, and the admin guide has been delivered

---

## 13. Client Delivery

**Calendar.**
- Raw effort is about 4 working days to launch, plus 2–3 days for the draw page.
- With a 30% buffer, launch falls between **Oct 13 and Oct 14**, and the draw page between **Oct 17 and Oct 20**.
- AI-assisted estimates are uncertain. M1 is the moment of truth: if the spike slips past Oct 10, tell the church immediately.

**Review and sign-off points:**

| Sign-off | When | Acceptance |
|---|---|---|
| 1. Design | End of M3 (~Oct 11) | Church approves screenshots of the form, success screen and email |
| 2. Go-live | M5 (~Oct 13) | One real registration works; the church confirms the URL and QR codes |
| 3. Raffle | M6 (by Oct 20) | Rehearsal draw on the venue setup succeeds |

**Change requests.**
- Anything new (fields, pages, SMS, check-in) is requested in writing (WhatsApp is fine).
- The builder replies with its effect on the dates. Work starts only after the church approves.
- **Freeze from Oct 21:** only fixes until the event.

**What the client must provide, and by when:**

| Item | By |
|---|---|
| Answers to CLIENT_QUESTIONS Q1–Q10 (suggested answers apply if there's no reply) | Oct 10 |
| High-resolution logo and flyer source files (if available), plus approval of the privacy and consent wording | Oct 10 |
| Institution list and email wording approval | Oct 11 |
| Names and Google emails of the leads to share the Sheet with | Oct 12 |
| Venue laptop and projector access for the draw rehearsal | Oct 21 |

**Account ownership:**
- The church owns the Google account (Sheets, Apps Script, Gmail).
- **The Vercel account is created with the church Gmail** (builder has full access) [ASSUMPTION: client Q13].
- GitHub repo: builder-owned, with church access on request.
- No domain.

**Handover (by Oct 23):**
- `docs/ADMIN_GUIDE.md`, written for non-technical leads:
  - reading the Sheet and filtering FAILED emails
  - handling deletion requests
  - running the draw
  - closing registration
  - deleting the app password
- `docs/SETUP_NEW_EVENT.md` for reuse
- Credentials stay in the church account
- **Support period:** through Oct 31

---

## 14. Risks and Open Questions

| Risk | Likelihood | Impact | Mitigation | Early warning sign |
|---|---|---|---|---|
| Gmail SMTP limit reached or blocked on a burst day | Medium | Medium (late emails) | Code shown on screen; retry trigger; emails only to new rows; bots filtered | `FAILED` rows building up; SMTP 421/550 errors in logs |
| Gmail flags the church account for automated sending | Low–Medium | High (church email affected) | Low volume, one email per real person, plain transactional content; delete the app password after the event | Security alert email to the church account |
| Apps Script slow or locked under bursts | Medium | Medium | Lock with a 10s wait; 20s fetch timeout; `maxDuration` 30s; M1 load test | p95 over 8s in M1 or in logs |
| Emails land in spam | Medium | Medium | Sent from real Gmail (passes Google's own sender checks); plain content; "check spam" on the success screen | M1 inbox test; registrants report it |
| Vercel Hobby "non-commercial" terms | Low | Medium | Free church event; verify the terms; move to the church's own Pro or Netlify if challenged | Vercel notice |
| Not live by Oct 14 | Low–Medium | High | Thin slices; M1 first; **Plan B: a branded Google Form plus Apps Script emailing codes, buildable in under a day** | M2 not done by Oct 11 |
| Low registrations | Medium | Medium (not a tech problem) | `source` tags show which channel works; share daily counts with the church | Fewer than 100 by Oct 18 |
| Spam or fake sign-ups | Low–Medium | Medium | Honeypot and timing; Turnstile switch | Junk names, bursts from one source |
| The church changes fields after launch | Medium | Low–Medium | Change request process; Sheet columns appended, not reordered | WhatsApp requests |

**Decisions still needed:**

| Decision | Who | Default if no answer |
|---|---|---|
| Raffle day, presence rule, walk-ins (Q1–Q3) | Client | Day 2; must be present; redraw if absent; walk-ins can register on their phones until the draw |
| Close time (Q5) | Client | At the draw; transport list frozen the night of Oct 22 |
| Consent and age wording (Q6–Q7) | Client | Suggested wording |
| Institution list (Q8) | Client | UNILORIN, KWASU, Kwara Poly, Al-Hikmah, Other |
| Pickup-point communication (Q11) | Client | WhatsApp broadcast by Oct 22, done by the church |
| Turnstile on or off | Builder | Off unless spam appears |
| Check whether Vercel's current function duration allows `maxDuration` of about 30s | Builder (M1) | Lower the lock wait if needed |

---

## 15. Decisions Log

| Decision | Alternatives | Why this one |
|---|---|---|
| Custom page instead of Google Forms | Google Forms + Apps Script | Client requirement (branding, excellence). Kept as Plan B. |
| Vite + React + Vercel Functions | Next.js | Single page; the builder has shipped this shape twice; smallest bundle |
| Apps Script web app as the data layer | Sheets API with a service account | Builder preference; no GCP project; the lock and logic live next to the Sheet |
| Call Apps Script **from the server**, not the browser | Browser `no-cors` POST (as in raw-registration) | `no-cors` hides the response, so the page couldn't show the code or errors; it would also expose the endpoint |
| Generate the code in Apps Script under a lock | Generate in the function and check uniqueness separately | One atomic step; no race conditions; fewer round trips |
| 4-character code from a 31-character alphabet (no 0/O/1/I/L) | Full A–Z0–9 | Read aloud at the draw and typed on phones; 923k combinations is plenty |
| Gmail SMTP via app password | Apps Script MailApp (100/day); Resend or Brevo (need a domain; gmail.com sender gets spam-foldered) | Highest free limit (about 500/day) from the church's real address, with no domain |
| Send email after the response (`waitUntil`) plus a retry trigger | Send before responding; no retries | The code appears fast; email failures never block or lose a registration |
| Duplicates re-send the code by email, never show it | Show the existing code | Prevents code harvesting by entering someone else's phone or email |
| Area and address only when transport is needed | Always ask for the address | Less personal data; cleaner transport data |
| Reuse via a config file plus env vars plus a new Sheet per event | Multi-event admin system | Meets "reusable" at almost no cost |
| Draw page after launch (Next tier) | Build it before launch | Registration has to be live first; the draw isn't needed until Oct 24–25 |
| Rigor STANDARD | LIGHT / STRICT | Public form with students' personal data, but no payments or auth, and short-lived |
