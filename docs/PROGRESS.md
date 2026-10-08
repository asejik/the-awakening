# Progress

## 2026-10-08 · M0 Setup (CONFIG)
- **Changed:**
  - Own git repo
  - Brand source files moved to `brand/`
  - Vite + React + TS + Tailwind 4 scaffold, with the DESIGN.md tokens in `src/styles/theme.css`
  - Placeholder page (CLC mark, title artwork, "Registration opens soon")
  - `api/health` function
  - `apps-script/Code.gs` with `setupSheet()`
  - `.env.example`, Vitest and oxlint wired up
- **Next:**
  - Builder: push to GitHub, connect Vercel (church account), create the test and prod Sheets and run `setupSheet()`, create the Gmail app password
  - Then M1, the pipeline spike (PROJECT_PLAN §12)
- **Known issues:**
  - `npm install` reports esbuild's postinstall as blocked by npm's install-scripts policy. The build doesn't need it (Vite 8 uses Rolldown); revisit only if `vercel dev` or the tests complain.

## 2026-10-08 · M1 Spike: code complete, awaiting live verification (FEATURE)
- **Changed:**
  - Apps Script `doPost` (`register` with lock, duplicate check and unique code; `setEmailStatus`)
  - `/api/register`: validates, then calls Apps Script; the email is sent via `waitUntil` and its status recorded
  - Gmail SMTP mailer with a log mode
  - Plain confirmation email
  - `shared/phone.ts` normaliser
  - Temporary `public/spike.html`
  - `scripts/load-test.mjs`
  - `vercel.json` (`maxDuration` 30), `.vercelignore`
  - 30 unit tests: phone; handler paths; the Apps Script client's redirect, unauthorized and HTML-response handling
  - PROJECT_PLAN §8/§14 timeouts made consistent (10s lock, 20s fetch, 30s function)
- **Next:** builder deploys the TEST Apps Script and sets env vars. Then run the M1 "done when" checks: inbox test, 50-request load test, duplicate race, wrong SMTP password. Then M2.
- **Known issues:**
  - Spike endpoints exist on prod but return 503 (no prod env vars)
  - `spike.html` must be deleted in M2

## 2026-10-08 · M1 first live run: two bugs found and fixed (BUG FIX)
- **First run** (TEST Sheet, log mode):
  - A single registration took 2.7s.
  - 50 at once: 13 created, 32 busy, 5 timeouts.
  - Same-phone race: **two rows**.
- **Root causes:**
  1. Sheets stored phone `09151234567` as the number `9151234567` (confirmed in the Sheet), so phone duplicates never matched. A code like `2E45` would have become a number too.
  2. Each registration holds the lock for about 1.1s, so the Sheet handles about one per second, and the 10s lock wait rejected bursts.
- **Fixes:**
  - `phone` and `code` written with a leading `'` (forced text); phones compared by digits, so old rows still match
  - Read only columns id…email under the lock
  - Lock wait 25s, fetch timeout 28s
  - Log mode records `LOGGED` instead of `SENT`
  - Load test gains `--retry-busy` (the page will retry busy twice) and `--p95`
- **Tests:** 37 passing. The new Apps Script tests run Code.gs against a fake Sheet that coerces values like Google Sheets does. 3 of them fail on the old code, which reproduces the bug.
- **Also:** `vercel dev` replaced locally by `scripts/dev-server.mjs`. It was 2–5s per request and didn't load `.env.local`.
- **Next:** builder re-pastes `Code.gs` and redeploys as a new version (same URL); then re-run the M1 live checks.

## 2026-10-08 · M1 redo on Supabase (Revision 2): code complete, awaiting live run (FEATURE + DATABASE)
- **Why:** after the phone fix, Apps Script + Sheet lock managed only one registration every 2.5–3s; 4 of 10 parallel submits timed out. The builder approved option B: Supabase as the record, the Sheet as a mirror.
- **Changed:**
  - `supabase/migrations/001_registrations.sql` (+ `.down.sql`): table with UNIQUE (event, phone/email/code), CHECKs, RLS on with no policies; functions `register_attendee`, `set_email_status`, `email_retry_batch`, `sheet_pending`, `sheet_mark_synced`, executable by service_role only
  - `api/_lib/db.ts` (server-only supabase-js, 10s timeout)
  - `api/register.ts` on `register_attendee`
  - `api/email-retry.ts` (Bearer `RETRY_SECRET`)
  - `api/_lib/send-confirmation.ts` (shared send-and-record)
  - Apps Script rewritten as a pull mirror: `syncFromSupabase`, `installTrigger`, "Sync now" menu, retry ping
  - Deleted `api/_lib/gas.ts` and its tests
- **Tests:** 50 passing, including 11 that run the real migration in PGlite (in-process Postgres): duplicates, re-send throttle, code-collision retry, DB-level validation, retry selection, sheet sync, lockdown, rollback.
- **Next:** builder runs the migration on TEST, fills `.env.local`, updates the TEST Sheet script. Then the M1 live checks: 50 parallel with p95 under 3s, race, inbox, wrong password, mirror.

## 2026-10-08 · M1 complete: live checks passed (FEATURE + DATABASE)
- **Results (TEST project):**
  - **Load:** 50 parallel against a Vercel preview in London, measured from Nigeria: 50/50 created, 50 unique codes, 0 errors, p50 1.7s, **p95 2.8s** (target under 3s). The same run from a local machine was p95 3.4s, because of the 123ms round trip to London.
  - **Race:** the same phone at the same instant gave one created and one duplicate (passed twice).
  - **Sheet mirror:** every row was copied once within one trigger cycle. The builder confirmed leading zeros, text codes, no duplicates and the "Sync now" menu.
  - **Email:** real Gmail reached the inbox (builder). A wrong password gave the code on screen and `FAILED`; after restoring the password, `/api/email-retry` re-sent it → `SENT` (attempt 2).
  - **Security:** a request without the server key was refused (401); a wrong `RETRY_SECRET` was refused.
- **Config:** `vercel.json` `regions: ["lhr1"]`. The dashboard region setting hadn't applied (functions were running in `iad1`).
- **Not tested:** Yahoo and Outlook inboxes (the builder has no accounts). Test with a church member's address before launch (M5).
- **Next:** M2, the real form (zod schema, conditional fields, busy/duplicate/error states). Delete `spike.html`. Clear TEST data first.

## 2026-10-08 · M2 real form: built, awaiting builder review (FEATURE)
- **Changed:**
  - One zod schema (`shared/registration.ts`) shared by the form and `/api/register`. Plain-English messages; conditional rules (Other institution; bus → area and address); `toPayload()` normalises.
  - `shared/event.ts` holds the event content. Institutions are **University of Ilorin + Other only** (builder decision).
  - Form built with Direction A components: text, native select, segmented radios, checkboxes, sticker button.
  - States: field errors with focus on the first one, server field errors, submitting, slow after 8s, offline and error banners that keep the answers.
  - Success ticket (full name + code + stub, static) and the duplicate notice (no code).
  - `?src=` tag saved. `spike.html` deleted. TEST data cleared (116 rows).
- **Checks:** 57 tests; JS 111 KB gzipped (budget 120).
- **Browser run against TEST:** empty submit focused the first field; a real submit gave a ticket; a duplicate showed no code; offline showed the banner and kept the answers; no console errors.
- **Requirement noted for M3:** branded email must be full HTML/CSS and responsive; Tailwind only if compiled to inline styles.
- **Next:** builder reviews screenshots (P06 step 4) and tests on a real Android phone. Then P03 (mid-project), then M3.

## 2026-10-08 · M2 review fixes + P03 mid-project audit
- **Builder review:** venue is now shown in full ("Freedom Dome, Ilesanmi Bus Stop, Tanke, Ilorin"); the church logo is used exactly as supplied (no extra text label). Builder will do real-phone checks at the end of the build.
- **P03 MID:** `docs/audits/P03_2026-10-08.md`. Verdict: **READY WITH FIXES**, no blockers to continuing. High: no alerting (P03-01). Medium: SMTP timeouts, log mode in production, bundle at 93% of budget.
- **Next:** builder approves the fix batch, then M3.

## 2026-10-08 · P03 fix batch (AUDIT FIX: P03-01, 02, 03, 05, 06, 07, 10, 11)
- **Changed:**
  - Migration `002_ops.sql` (+ down): `retry_claimed_at`; claiming `email_retry_batch`; `ops_summary`
  - `api/_lib/config.ts`: startup checks; no log mode in production; slug format; `scrub()`
  - SMTP timeouts
  - Apps Script alerts plus a daily digest to `ALERT_EMAIL`
  - Plan and client-questions updates; vite 8.3.4
- **Checks:** 73 tests; JS 111.52 KB gzipped.
- **Builder actions:** run 002 on TEST; re-paste Code.gs; add `ALERT_EMAIL`; re-run `installTrigger`; run `dailyDigest` once to see the email.
- **Next:** M3 (branding: poster hero, ticket motion, OG image, HTML email).

## 2026-10-08 · M3 branding: built, awaiting builder sign-off (FEATURE)
- **Changed:**
  - Poster hero: starburst, rotating DAY 1/2 badges, title, Freshers panel, full-venue panel, Featuring strip, "Register free" button that scrolls to and focuses the form
  - Ticket entrance and ENTERED! stamp motion (reduced-motion safe)
  - OG/Twitter tags plus `public/og.jpg` (1200×630); the site URL comes from Vercel at build time
  - **Full HTML responsive email** (React Email + Tailwind → inlined template, fluid layout, ticket design, plain-text version kept)
- **Performance work:** self-hosted fonts; the form is lazy-loaded after the hero; build-time prerender plus hydration; CSS inlined; title image at 640px; `robots.txt`.
- **Lighthouse mobile** (production build, 3 runs): Performance 75 / 93 / 93 (one CPU-noise outlier); Accessibility 100; Best Practices 100; SEO 100. LCP 2.8s, CLS 0.015.
- **JS:** main 75 KB gzipped; the form chunk (zod + react-hook-form) 39 KB gzipped, loaded after first paint.
- **Checks:** 80 tests (9 files). End-to-end against TEST: ticket, duplicate (no code), offline banner, no console errors.
- **Found:** React Email Tailwind applies `sm:` everywhere, and `<Font>` overrides all text; both are avoided (DESIGN.md §11).
- **Next:** builder sign-off on the screenshots; one real email to Gmail (images show once main is deployed); then M4.

## 2026-10-08 · M4 hardening: complete (FEATURE)
- **Changed:**
  - Registration window: `shared/window.ts`, `GET /api/status`, 403 outside the window. "Opens soon" and "closed" panels. Unconfigured production shows "opens soon", so `main` is safe to push.
  - Bot traps: honeypot plus a 3s minimum fill time, answered with a fake duplicate.
  - Answers saved per tab (sessionStorage, fails safely).
  - `/privacy` notice (NDPA), contact clcchurchmedia@gmail.com, linked from the consent and pre-rendered.
  - Cross-field errors (bus/area/address, Other institution) now show together with other errors; found by the e2e tests.
  - Playwright smoke tests (6) with automatic cleanup.
  - `docs/SETUP_NEW_EVENT.md`.
  - Close time default: **2026-10-25T12:00:00+01:00** (builder decision).
- **Checks:** see the commit; e2e 6/6, and 0 e2e rows left in TEST.
- **Next:** P04 + P08 + P03 PRE-LAUNCH, then M5 launch.

## 2026-10-08 · Pre-launch audits: P04 + P08 + P03 PRE-LAUNCH
- Reports: `docs/audits/P04_2026-10-08.md`, `P08_2026-10-08.md`, `P03_2026-10-08_PRE-LAUNCH.md`.
- **Critical (found by probing production after pushing main):** `/api/register` crashes on Vercel with `ERR_MODULE_NOT_FOUND`, because `shared/` uses extensionless ESM imports. No users affected (production shows "opens soon"). Fix pending approval.
- **Others:** no rate limit (High); sock-puppet raffle entries (Medium, church draw rule); no security headers; hosted Supabase grants to verify; @vercel/node dev noise; SEO: Event JSON-LD, sitemap, privacy OG; support footer; deployed smoke script.

## 2026-10-08 · Pre-launch audit fixes (AUDIT FIX: S-01, S-02, S-03, S-04, S-06, SEO-01..03, R-01, R-02)
- **Changed:**
  - `.js` ESM imports plus `nodenext` type-check (the production crash)
  - Migration `003` rate limit (20 per IP per 10 min, hashed) plus a spike alert
  - Raffle rules shown on the form, ticket and email
  - Security headers / CSP
  - `@vercel/node` removed (`npm audit` 0)
  - Event JSON-LD, sitemap, robots, privacy OG
  - Support footer
  - `scripts/smoke.mjs` for deployed checks
- **Checks:** 96 unit, 6/6 e2e.
- **Pending builder:** run 003 on TEST; SQL/Security Advisor output (S-05); 2FA.
