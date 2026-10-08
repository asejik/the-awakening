# The Awakening Registration: Admin Guide

For the Citizens of Light Church team. No technical knowledge needed, except where a section says **(builder)**.

- **Registration page:** https://the-awakening-rho.vercel.app
- **Privacy notice:** https://the-awakening-rho.vercel.app/privacy
- **Contact address on the site:** clcchurchmedia@gmail.com
- **Registration closes:** Sunday 25 October 2026, 12:00 noon (WAT)

---

## 1. How it works, in one minute

1. A student fills in the form and taps **Get my ticket**.
2. They see a **raffle ticket** with their name and a 4-character code, such as `K7QX`, and the same ticket arrives by email.
3. Their details are saved in a secure database (Supabase). **Within 5 minutes** they appear as a new row in the church's Google Sheet, **"The Awakening – LIVE"**.
4. Each person can register **once**, by phone number or by email. If someone tries again, the site tells them they're already registered and re-sends their code to their original email. It never shows the code on screen.

## 2. The Google Sheet

- **Registrations** tab: one row per person. The newest rows are at the bottom.
- **Awakening → Sync now** (in the Sheet's menu bar) copies new registrations immediately, instead of waiting up to 5 minutes.
- **The Sheet is a copy.** Editing or deleting a row in the Sheet does **not** change the real database. To remove someone, see section 5.
- **Useful columns:**
  - `code`: the raffle code
  - `needs_transport`, `area`, `address`: for bus planning
  - `followup_optin`: **Yes** means the person agreed to follow-up calls and WhatsApp messages. **Only contact people marked Yes for follow-up.**
  - `source`: where they came from (if the link had a tag)
- **Bus planning:** use Data → Create a filter, set `needs_transport` = Yes, and sort by `area`.
- **Who can see it:** only the leads it's shared with, as **Viewers**. Don't change it to "Anyone with the link". It holds students' phone numbers and addresses.

## 3. Emails you might receive (sent to clcchurchmedia@gmail.com)

| Email subject | What it means | What to do |
|---|---|---|
| **[Awakening] Daily summary: N registered** | Sent about 7am: totals, new registrations in the last 24 hours, email delivery | Nothing; it's for your information |
| **[Awakening] N confirmation email(s) failed 5 times** | Those students saw their code on screen but never got the email | Tell the builder. Usually Gmail's daily limit or a changed password. |
| **[Awakening] N confirmation emails are failing** | Emails are being retried automatically every 5 minutes | Usually fixes itself. If it continues past an hour, tell the builder. |
| **[Awakening] Sheet copy is N minutes behind** | New registrations aren't reaching the Sheet | Try **Awakening → Sync now**. If it fails, tell the builder. **Registration itself is still working.** |
| **[Awakening] Sheet sync is failing** | As above | As above |
| **[Awakening] N registrations in the last hour** | An unusually large number of sign-ups | If outreach is happening, great. If the names look fake, tell the builder. |
| **[Awakening] LIVE emails are in log mode** | A settings mistake: emails aren't being sent | Tell the builder **immediately** |

Each alert repeats at most every 6 hours.

## 4. The raffle draw (rules shown on the form)

- One registration per person. **Duplicate or fake registrations are removed** and don't count.
- **Winners must be present** and show their code (on screen or in their email) **and an ID that matches their registered name**.
- **Before the draw,** skim the Sheet for obvious duplicates or fake entries: the same person under slightly different names, gibberish names, many entries with the same surname and similar numbers. Send the list to the builder to remove them.
- The draw screen comes in a later update (M6), with its own instructions.

## 5. Someone asks to see or delete their details

Under Nigerian data protection law, people can ask to see, correct or delete their details. Requests arrive at **clcchurchmedia@gmail.com**.

1. **Check it's really them:** the request should come from the email address they registered with.
2. **To see their details:** find their row in the Sheet and reply with what's in it.
3. **To delete:** forward the request to the builder, who deletes the row in the database. Then delete the row in the Sheet yourself.
4. **Record it** in the Sheet's **Deletions** tab: date, the `id` from their row, how they asked (e.g. "email"), who did it, and any notes.
5. Reply to confirm it's done.

**To stop follow-up only:** set their `followup_optin` to "No" in the Sheet, and tell the follow-up team.

## 6. Changing when registration closes (builder)

1. Vercel → the-awakening → Settings → Environment Variables (Production) → `REGISTRATION_CLOSES_AT`.
2. Set the new time **with the +01:00 offset**, e.g. `2026-10-25T14:00:00+01:00`.
3. **Deployments → the latest Production deployment → ⋯ → Redeploy.** Changes only apply after a redeploy.

**To close immediately:** set the time to a moment in the past, then redeploy. The page switches to "Registration is closed".

## 7. If something goes wrong

| Problem | What to do |
|---|---|
| The page shows an error when people register | Tell the builder. Their answers stay on screen, so they can try again a minute later. |
| A new release broke something **(builder)** | Vercel → Deployments → pick the last good Production deployment → ⋯ → **Promote**. It's back instantly. |
| The whole site is down for more than 30 minutes during outreach | Use **Plan B**: the builder shares a Google Form (same questions) so outreach isn't wasted. Its responses get merged into the database afterwards. |
| Someone says they didn't get their email | They saw the code on screen when they registered. Ask them to check spam, or to **register again with the same phone or email**: the site re-sends the code to their original email (at most once every 10 minutes). |

## 8. Backups (builder)

**Export everything to a CSV** each evening from 20 October, and again before the draw:
```bash
node --env-file=.env.live scripts/export-registrations.mjs > awakening-$(date +%F).csv
```
`.env.live` holds the LIVE `SUPABASE_URL`, `SUPABASE_SECRET_KEY` and `EVENT_SLUG`. It's git-ignored; never commit it.

**Restore:** Supabase → Table Editor → `registrations` → Insert → **Import data from CSV**. Rehearse this once on TEST.

The Google Sheet is also a continuous second copy.

## 9. After the event (builder)

1. Close registration (section 6), if it isn't already closed.
2. Delete the Gmail **app password** (Google Account → Security → App passwords).
3. Rotate the Supabase secret keys (TEST and LIVE). Remove `RETRY_SECRET` and the draw passphrase from Vercel, and delete the Apps Script triggers.
4. Final CSV export. Keep the Sheet for follow-up, and **review it after 12 months**: delete home addresses and anything no longer needed.
5. To reuse the site for the next event: `docs/SETUP_NEW_EVENT.md`.
