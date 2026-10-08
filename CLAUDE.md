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
- Google Apps Script web app (source in `apps-script/`) writing to a Google Sheet in the church account
- Gmail SMTP via nodemailer, using an app password on the church Gmail
- zod (one schema shared by client and server), react-hook-form, Vitest, Playwright

## Commands

- `npm run dev`: frontend only (Vite). It does **not** run `/api` functions.
- `npm run dev:full`: `vercel dev`, frontend plus `/api` functions. Needs the Vercel CLI (`npm i -g vercel`) and a linked project.
- `npm run build`: type check (`tsc -b`) plus the Vite build
- `npm run typecheck`: `tsc -b` across three projects: `tsconfig.app.json` (src), `tsconfig.node.json` (configs) and `tsconfig.api.json` (api)
- `npm run lint`: oxlint, config in `.oxlintrc.json`
- `npm test`: runs all Vitest tests (`src/**/*.test.ts`, `api/**/*.test.ts`). For a single test: `npx vitest run path/to/file.test.ts -t "name"`.
- Playwright end-to-end tests arrive in M4 (`npx playwright test e2e/file.spec.ts -g "name"`).

## Layout

- `src/`: React SPA. Tokens are in `src/styles/theme.css`, mirroring docs/DESIGN.md §9.
- `api/`: Vercel Functions (Node, `@vercel/node` types)
- `apps-script/Code.gs`: pasted by hand into each event Sheet's Apps Script editor. It isn't deployed from this repo.
- `public/assets/`: optimised images actually shipped
- `brand/`: source artwork only. It's never referenced by the app; the 1.4 MB flyer must never be loaded by the page.

## Architecture rules that need several files to understand

- **The browser never calls Apps Script directly.** It calls `POST /api/register`, and the function calls Apps Script server-to-server with `GAS_SECRET` in the JSON body (Apps Script `doPost` can't read custom headers). The older `raw-registration` project used a browser `no-cors` POST. Don't copy that, because this page needs the response: the code, duplicates and errors.
- **Apps Script owns de-duplication and code generation.** Under `LockService` it checks the normalised phone and email, generates a code from `23456789ABCDEFGHJKMNPQRSTUVWXYZ` until it's unique, then appends the row. Keep this atomic, and don't move code generation to the function.
- **Email never blocks or loses a registration.** The row is saved and the code returned first; the email is sent via `waitUntil` afterwards, and then `setEmailStatus` is called. An Apps Script time trigger posts FAILED or stale PENDING rows to `/api/email-retry`. There is one email template and one SMTP path, both in Node.
- **Duplicates never return the existing code to the browser.** It's only re-sent to the email on file, which prevents code harvesting.
- **No secrets in `VITE_` variables.** `VITE_` variables are compiled into the bundle. The secrets are `GAS_URL`, `GAS_SECRET`, `SMTP_USER`, `SMTP_PASS`, `RETRY_SECRET` and `DRAW_PASSPHRASE`, and they stay server-side.
- **Event-specific content lives in `src/config/event.ts` plus env vars.** That covers text, dates, institutions, email copy and open/close times, which keeps the app reusable for future events. Each event gets its own Sheet and Apps Script deployment.
- Prefix Sheet values starting with `= + - @` with `'` to prevent formula injection.
- **Apps Script redeploys:** edit the existing deployment to a new version, so the URL stays the same. Creating a new deployment changes the URL.
- **Environments:** Vercel Preview uses the test Sheet with `EMAIL_MODE=log`; Production uses the live Sheet with `EMAIL_MODE=smtp`.

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
- **The live Sheet is production data.** Develop against the test Sheet and test Apps Script deployment. Never write to the prod Sheet from dev, and never paste real registrant data into prompts, logs or tests.
- **Report in P07's format:** summary, files changed, data/config changes, check results with output, ACTIONS FOR ME, manual test checklist, risks. Then update `docs/PROGRESS.md`.
- **UI:** follow `docs/DESIGN.md` tokens (once created). Use no one-off colours or sizes, add no new UI or animation libraries without asking, and respect `prefers-reduced-motion`.

## Git

This folder is its own repository (branch `main`). The parent `~/projects` repo just sees it as an untracked folder; never run git commands against the parent from here.
