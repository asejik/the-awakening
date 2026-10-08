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
