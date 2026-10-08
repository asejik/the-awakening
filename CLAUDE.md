# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A branded, mobile-first registration page for **The Awakening: Freshers Plug In** (Citizens of Light Church, Ilorin; Oct 24–25, 2026). Each registrant gets a unique 4-character raffle code, shown on screen and emailed, and becomes one row in the church's Google Sheet. A passphrase-protected raffle draw page comes after launch.

- **Owner:** client, Citizens of Light Church. Built by asejik.
- **Rigor level:** STANDARD
- **Plan:** `docs/PROJECT_PLAN.md` is the source of truth for scope, data model, architecture and milestones. Background is in `docs/IDEA_BRIEF.md`; open client decisions are in `docs/CLIENT_QUESTIONS.md`; the client-facing summary is `docs/client/PLAN_SUMMARY.md`.
- **Status:** see `docs/PROGRESS.md`.

## Stack

- Vite + React + TypeScript + Tailwind CSS 4 (static single-page app)
- Vercel Functions (Node) in `api/`, on Vercel Hobby
- Supabase Postgres (system of record; SQL in `supabase/migrations/`), reached only from `api/` via `@supabase/supabase-js` with the secret key
- Google Sheet mirror in the church account, filled by an Apps Script time trigger (source in `apps-script/`)
- Gmail SMTP via nodemailer, using an app password on the church Gmail
- zod (one schema shared by client and server), react-hook-form, Vitest, Playwright

## Commands

- `npm run dev`: frontend only (Vite). It does **not** run `/api` functions.
- `npm run dev:full`: frontend plus `/api` functions via `scripts/dev-server.mjs` (Vite middleware, Vercel-style handler shim), with env from `.env.local`. Use this, not `vercel dev`, which was slow and did not load `.env.local` here.
- `npm run build`: type check (`tsc -b`) plus the Vite build
- `npm run typecheck`: `tsc -b` across three projects: `tsconfig.app.json` (src), `tsconfig.node.json` (configs) and `tsconfig.api.json` (api)
- `npm run lint`: oxlint, config in `.oxlintrc.json`
- `npm test`: runs all Vitest tests (`src/**/*.test.ts`, `api/**/*.test.ts`). For a single test: `npx vitest run path/to/file.test.ts -t "name"`.
- Playwright end-to-end tests arrive in M4 (`npx playwright test e2e/file.spec.ts -g "name"`).

## Layout

- `src/`: React SPA. Tokens are in `src/styles/theme.css`, mirroring docs/DESIGN.md §9; custom utilities `border-ink`, `border-ink-thick`, `reveal` live there too. Form controls are in `src/components/form/`.
- `shared/`: code used by both the page and `api/`: `registration.ts` (the one zod schema plus `toPayload`), `event.ts` (event content), `phone.ts`.
- `api/`: Vercel Functions (Node, `@vercel/node` types)
- `apps-script/Code.gs`: pasted by hand into each event Sheet's Apps Script editor. It isn't deployed from this repo.
- `public/assets/`: optimised images actually shipped
- `brand/`: source artwork only. It's never referenced by the app; the 1.4 MB flyer must never be loaded by the page.

## Architecture rules that need several files to understand

- **Supabase is the system of record; the Google Sheet is a mirror** (PROJECT_PLAN Revision 2). The original Apps Script web app plus Sheet lock design failed M1's load test (1–3s per registration, one at a time), so don't reintroduce writes through Apps Script on the request path.
- **Only `api/` touches the database,** using `SUPABASE_SECRET_KEY`. RLS is on with no policies, and function EXECUTE is revoked from `anon`/`authenticated`. The browser never talks to Supabase and no Supabase key goes into the bundle.
- **Uniqueness lives in Postgres.** UNIQUE (event, phone), (event, email) and (event, code). `register_attendee()` does the duplicate check, code generation (alphabet `23456789ABCDEFGHJKMNPQRSTUVWXYZ`) and insert in one call, retrying on a code collision. Don't add app-level locks or move code generation into Node.
- **Email never blocks or loses a registration.** The code is returned first; the email is sent via `waitUntil`, then `set_email_status` (SENT/FAILED/LOGGED). The Apps Script trigger pings `/api/email-retry` every 5 minutes. There's one email template and one SMTP path, both in Node.
- **Duplicates never return the existing code to the browser.** It's only re-sent, at most once per 10 minutes, to the email on file. This prevents code harvesting.
- **The Sheet mirror (`apps-script/Code.gs`) pulls, it isn't pushed to.**
  - `syncFromSupabase()` (5-minute trigger plus a "Sync now" menu) fetches `sheet_pending`, skips ids already in the Sheet, batch-appends, then calls `sheet_mark_synced`.
  - `phone` and `code` are written with a leading `'`, because Sheets drops leading zeros and turns `2E45` into a number (found in M1).
  - Prefix values starting with `= + - @` with `'`.
- **No secrets in `VITE_` variables.** `VITE_` variables are compiled into the bundle. The secrets are `SUPABASE_SECRET_KEY`, `SMTP_USER`, `SMTP_PASS`, `RETRY_SECRET` and `DRAW_PASSPHRASE`, and they stay server-side.
- **Reuse:** event content lives in `shared/event.ts` (used by page and server), plus env vars (`EVENT_SLUG`, open/close times). Every table has an `event` column; each event gets its own Sheet.
- **Environments:** local and Preview use the TEST Supabase project, TEST Sheet and `EMAIL_MODE=log`. Production uses LIVE with `EMAIL_MODE=smtp`. Migrations run on TEST first, then LIVE.

## Visual identity (full system in `docs/DESIGN.md`; source artwork in `brand/`)

- Palette: orange-red (~`#F05A35`), cream background (~`#FAF0DC`), deep maroon (~`#4E0710`), black outlines, off-white lettering. These are estimates from the image.
- Type: bubbly graffiti-style display lettering for the title, condensed uppercase sans for details
- Motif: an orange starburst on cream, with maroon blobs in the corners; the Citizens of Light Church logo (a flame over a circle) top-left
- Ship only the optimised images in `public/assets/`; budgets are in DESIGN.md §8.

## Working rules (P07: safe change protocol)

- Follow the P07 protocol for every task: **Plan → stop for approval → Implement → Verify → Report**. Never skip the approval stop.
- **Before any change:**
  - The working tree should be clean. If it isn't, ask for a checkpoint commit first.
  - Run type check, lint, build and tests to get a baseline, and report any existing failures rather than hiding them.
  - Check the task against `docs/PROJECT_PLAN.md`. Flag anything outside the agreed scope, since it may need a change request from the church.
- **Make only the approved changes.** If the same error survives two fix attempts, stop and explain what you've learned instead of trying a third workaround.
- **Type checking:** `tsconfig.json` must keep `"noUnusedLocals": true` and `"noUnusedParameters": true`. Never delete apparently unused code silently; list it for approval.
- **Bug fixes:** reproduce the bug first, then explain the root cause with evidence before proposing a fix, and add a test that would catch it.
- **LIVE Supabase and the LIVE Sheet are production data.** Develop against TEST. Never write to LIVE from dev, and never paste real registrant data into prompts, logs or tests.
- **Report in P07's format:** summary, files changed, data/config changes, check results with output, ACTIONS FOR ME, manual test checklist, risks. Then update `docs/PROGRESS.md`.
- **UI:** follow `docs/DESIGN.md` tokens (once created). Use no one-off colours or sizes, add no new UI or animation libraries without asking, and respect `prefers-reduced-motion`.

## Git

This folder is its own repository (branch `main`). The parent `~/projects` repo just sees it as an untracked folder; never run git commands against the parent from here.
