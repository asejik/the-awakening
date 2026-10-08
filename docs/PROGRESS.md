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
