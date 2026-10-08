# Idea Brief: The Awakening Registration

| | |
|---|---|
| **Mode** | B: client idea (requirements given verbally, no PRD document) |
| **Project type** | Internal organisation tool, single event, fixed deadline |
| **Working name** | The Awakening Registration |
| **Client** | Citizens of Light Church, Ilorin |
| **Builder** | asejik |
| **Status** | P00 complete. Verdict: READY TO PLAN (with defaults, see below) |
| **Date** | 2026-10-07 |

---

## 1. Problem statement

Citizens of Light Church is holding **The Awakening: Freshers Plug In**, a two-day event for new university students:

- **Day 1:** Oct 24, 4PM
- **Day 2:** Oct 25, 9AM
- **Venue:** Freedom Dome, Ilesanmi Bus Stop, University Road Tanke, Ilorin

Before the event, the church needs to:

1. **Know who is coming**, so it can plan numbers, seats and materials.
2. **Plan pickup buses**, which run both days, using where attendees live.
3. **Run a fair raffle draw** on the day. Every registrant gets a unique ticket code.
4. **Follow up afterwards:** calls, WhatsApp messages, and adding people to the membership database.

Without a registration system, the church has no headcount, nothing to plan buses from, no fair way to run the raffle, and no contact list for follow-up.

## 2. Current alternatives and why they fall short

| Alternative | Why it isn't being used |
|---|---|
| Google Forms + Apps Script (Sheet, code generation, email) | Could do most of the job for free. **Rejected deliberately by the client:** the church wants a custom page that matches the flyer and reflects its standard of excellence. This is the reason the builder was engaged. |
| Paper registration at the venue | No pre-event headcount or transport data. Slow at the door. |
| WhatsApp sign-up messages | Unstructured and impossible to de-duplicate. Can't produce raffle codes. |
| Event platforms (Eventbrite, Luma, Tix.africa, etc.) | Not evaluated in depth. Branding is limited and data lives on a third-party platform. Not pursued because of the custom-page decision. |

**Fallback, kept on record:** if the custom page isn't live in time (see the kill signals in section 12), a branded Google Form with an Apps Script that generates and emails codes is a working Plan B that can be built in a day.

## 3. Value proposition

> For **Citizens of Light Church**, which needs to register about 500 freshers for The Awakening, the registration page **collects clean attendee, transport and follow-up data in one Sheet and gives every registrant a unique raffle code instantly**, in a page that matches the event's branding, **unlike** a generic Google Form or ad-hoc WhatsApp sign-ups.

## 4. Users, roles and context

| Role | Who | Needs to |
|---|---|---|
| **Registrant** | New university students (freshers) in Ilorin, mostly UNILORIN but possibly other institutions | Register quickly on a phone, get the raffle code, know the event details |
| **Church admin / organisers** | Church staff and the event team | See registrations in the Google Sheet, count them, plan transport, run the raffle, follow up |
| **Raffle host** | Whoever runs the draw on the day | Pick a code at random, check the winner's identity |
| **Transport team** | Church volunteers | Group registrants by area to choose central pickup points |

**Registrant context (ASSUMPTIONS, not confirmed):**
- Almost entirely on mobile phones, mostly Android, often on mobile data that can be slow or costly
- Arrive via campus outreach, WhatsApp Status and social media posts of the flyer, so mostly by link, possibly by QR code
- English is fine
- Many new students rarely check email, so the code must also appear on screen

**Who pays / who decides:** the church decides and owns the accounts. Budget is **zero**: free tiers only.

## 5. Workflow

**Registrant flow (target):**
1. Sees the flyer or link via outreach, WhatsApp Status or social media.
2. Opens the registration page on their phone.
3. Fills in the form and agrees to the privacy and consent notice.
4. Submits. The system checks for a duplicate registration, generates a unique 4-character code and saves the row to the Google Sheet.
5. The code appears **on screen immediately**, with a prompt to screenshot it.
6. The code is also **emailed** to them. If sending fails, it's retried later, but the registration is already saved.

**Church flow:**
1. Watches registrations come into the Sheet.
2. After registration slows down, the transport team groups addresses and decides central pickup points.
3. Pickup points are sent to registrants who need transport. **The channel for this is a gap, see open questions.**
4. On the event day, the raffle host draws a code at random and checks the winner's name and phone number against the Sheet.
5. After the event, the team uses the Sheet for follow-up and membership.

## 6. Scope

**The core job of version one:**
Take a registration reliably, give the person a unique raffle code on screen and by email, and store clean, de-duplicated data in the church's Google Sheet.

**Must-have for launch:**
- A branded, mobile-first registration page that follows the flyer's identity (orange-red, cream, maroon, graffiti-style headline)
- Event details on the page: dates, times, venue, programme
- Form fields:
  - Full name
  - Gender
  - Institution: UNILORIN, other listed options, and "Other" with a text box
  - Department
  - Phone number (labelled as the WhatsApp number)
  - Email
  - Address or area, for transport planning
  - Transport need (Yes/No), recommended
  - Consent checkbox
- Server-side validation of phone and email formats
- **De-duplication:** one registration per phone number and per email
- Unique 4-character code that avoids look-alike characters (no 0/O, 1/I/L)
- A row written to the Google Sheet, including the code and a timestamp
- A confirmation screen showing the code clearly
- A confirmation email with the code and event details, sent from the church's account
- Email failure never blocks or loses a registration; failed sends are retried
- Registration can be closed at a set time

**Later (nice to have, not version one):**
- A raffle draw screen to project on the day
- A simple admin view with counts by institution, gender and area (the Sheet covers this for now)
- WhatsApp or SMS confirmation
- Check-in at the door to mark attendance
- Exports for the membership database

**Out of scope:**
- User accounts and logins for registrants
- Payments
- Choosing pickup points automatically (the transport team does this manually from the Sheet)
- Multi-event support or reusing the platform for future events (possible later, not designed for now)

## 7. Assumptions and facts

| # | Statement | Status | How to confirm |
|---|---|---|---|
| 1 | Event is Oct 24 (4PM) and Oct 25 (9AM) at Freedom Dome, Tanke, Ilorin | FACT | Flyer |
| 2 | About 500 registrants expected | ASSUMPTION (church estimate) | Watch the registration rate in the first 3 days |
| 3 | The code is used for a raffle draw on the event day | FACT | Client |
| 4 | Raffle rules (which day, presence required, walk-ins, redraw) | UNKNOWN | CLIENT_QUESTIONS, must answer |
| 5 | The church's Gmail account owns the Sheet and sends the email | FACT | Client |
| 6 | Budget is zero; hosting on the Vercel Hobby plan | FACT | Builder |
| 7 | The church has no domain of its own | ASSUMPTION | CLIENT_QUESTIONS |
| 8 | A consumer Gmail account can send enough email for about 500 registrants, with bursts | **ASSUMPTION, HIGH RISK** | Technical spike in P01 (section 9) |
| 9 | Pickup buses run both days; central points are chosen from collected addresses | FACT | Client |
| 10 | Registrants will read email; the on-screen code is a safety net | ASSUMPTION | Check open rates if available; ask a handful of freshers |
| 11 | Audience is mostly UNILORIN, with some from other institutions | ASSUMPTION | Institution field data |
| 12 | Some registrants may be under 18 | ASSUMPTION | Common for Nigerian freshers; consider an 18+/guardian check |
| 13 | Registration goes live as soon as the build is done; close time not set | FACT / UNKNOWN | CLIENT_QUESTIONS |
| 14 | Vercel Hobby terms allow a non-commercial church event site | ASSUMPTION | Read Vercel's Hobby fair-use terms before launch |

## 8. Sustainability and ownership

- **Revenue:** none. This is a non-revenue project.
- **Success definition:** see section 11.
- **Running costs:** expected to be ₦0 (Vercel Hobby, Google Sheets and Gmail free tiers).
- **Account ownership:**
  - **Google account (Sheet and email):** the church. Good.
  - **Vercel project:** recommend creating it under a church-controlled account, or transferring it after the event, with the builder given access. If it lives on the builder's personal account, the church depends on the builder for the site.
  - **Domain:** none. The site will run on a `*.vercel.app` address. Keep it short and readable, because it will be typed from WhatsApp Status and posters.
- **After the event:** decide whether to close the page, archive the Sheet and revoke script or app credentials. See CLIENT_QUESTIONS.

## 9. Constraints, dependencies and risks

**Time (fixed):** the event is Oct 24, 17 days from this brief. Outreach is already running, so every day the page isn't live loses registrations. Target: **live by about Oct 12–13.**

**Email capacity (highest technical risk):**
- Apps Script on a consumer Gmail account can email **100 recipients per day**, and the script stops with an error once the quota is hit ([Google: Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas)).
- Ordinary Gmail sending (for example SMTP with an app password) is commonly reported at about 500 per day, but sources conflict. Treat this as **unverified** ([InboxAlly](https://www.inboxally.com/blog/how-many-recipients-does-gmail-allow), [Nylas](https://developer.nylas.com/docs/cookbook/email/gmail-smtp-settings.md)). Exceeding Gmail limits can block sending for up to 24 hours.
- Third-party email services that send *as* a `@gmail.com` address tend to be spam-foldered or rejected. Most free tiers need a verified domain, which the church doesn't have.
- **Requirements this creates:**
  - Save the registration and show the code **before and independently of** sending the email
  - Keep a send status for each registrant, so failed or deferred emails can be retried
  - Expect bursts after outreach days
- **P01 must choose the sending method and run a small spike test before building the full form.**

**Raffle integrity:** duplicates and code sharing are the main threats. De-duplication by phone and email, plus a name and phone check at the draw, covers both.

**Google Sheet as the database:** fine at about 500 rows. P01 should consider concurrent writes, code-uniqueness checks under load, and Sheets API quotas.

**Sensitive data and law:**
- The site collects names, phone numbers, emails, gender and home addresses of students, so the **Nigeria Data Protection Act 2023** applies.
- The page needs a short notice explaining what is collected and why (event logistics, transport, raffle, follow-up calls and WhatsApp messages, church membership), plus a consent checkbox.
- Recommend a separate opt-in for follow-up messages.
- Some freshers may be minors; consider an "I am 18+ or have guardian consent" line.
- **Verify the exact NDPA requirements; this brief is not legal advice.**
- Access to the Sheet should be limited to the people who need it.

**Dependencies on the client:**
- Access to the church Gmail account: Sheet ownership, plus an app password or API authorisation, which needs 2-step verification on that account
- Raffle rules
- Registration close time
- Wording of the consent text
- The list of institutions
- Confirmation email content and sign-off
- Logo files (high resolution) and approval of the design

## 10. Requirements to raise with the church

These are phrased professionally for the client; the detail is in CLIENT_QUESTIONS.md.

1. **Free email has a daily limit.** At about 500 registrants, some confirmation emails may arrive hours late on busy days. Every registrant still sees their code on screen straight away.
2. **The raffle needs written rules** before launch: one entry per person, winners must be present, redraw if absent.
3. **Following up by WhatsApp and adding people to membership needs to be stated** on the form, so registrants know and agree.
4. **The church should own the hosting account**, or be able to take it over.
5. **The address field is free text,** so the transport team should expect to tidy it. An "Area/neighbourhood" field plus "Need a bus? Yes/No" would make pickup planning much easier.
6. **Pickup points are decided after registration,** so the church needs a way to tell people their pickup point. The confirmation email can't include it.

## 11. Success metrics (event plus the following 90 days)

- **Uptime:** registration page live by Oct 13 and available through close
- **Registrations:** 500 target; track daily
- **Reliability:** no lost registrations (every successful submit has a Sheet row)
- **Email delivery:** at least 95% of confirmation emails sent within 24 hours
- **Duplicates:** zero duplicate raffle entries; no raffle disputes on the day
- **Transport:** pickup points decided from Sheet data by Oct 22
- **Turnout:** at least 60% of registrants attend (needs a headcount or check-in; the target is a guess to be set by the church)
- **Follow-up:** the follow-up team contacts registrants within 30 days of the event, using the Sheet

## 12. Verdict

**READY TO PLAN**, using the recommended defaults in CLIENT_QUESTIONS.md where the church hasn't answered yet. The open raffle questions don't block building: whatever the answers, the system still needs unique codes, de-duplication and one row per person.

**Needs clarification (can run in parallel with P01):** raffle rules, close time, consent wording and the institution list.

**Risks to raise:** email limits on a free Gmail account; account ownership of the Vercel project; NDPA consent; how pickup points will be communicated.

**Kill or pivot signals:**
- **Not live by Oct 14:** switch to Plan B, a branded Google Form plus an Apps Script that emails codes, so outreach isn't wasted.
- **The email spike shows Gmail can't reliably send about 150 per day:** treat on-screen display as the main way people get their code. Send emails in deferred batches or drop email, and tell the church.
- **Registrations below about 100 by Oct 18:** the problem is promotion, not the page. Push QR codes and WhatsApp sharing rather than adding features.
- **Duplicate or fake sign-ups start appearing:** tighten de-duplication or add a simple spam check, and don't add features until that's fixed.
- **Scope creep before launch** (admin dashboard, draw screen, check-in): defer until registration is live and stable.

## 13. Open questions for P01

1. Email sending method: Apps Script, Gmail SMTP with an app password, or the Gmail API. Run a sending spike test first.
2. How to guarantee unique codes and de-duplication with a Google Sheet as the store (concurrency).
3. How to queue and retry failed emails without a paid database or background workers.
4. How the church gets credentials and access, and how to rotate or revoke them after the event.
5. Spam and bot protection on a public form at no cost.
6. Close-time behaviour and on-site registration on the event day (depends on the client's answers).
7. Raffle draw method: random pick from the Sheet by an admin (default), or a projected draw screen later.
