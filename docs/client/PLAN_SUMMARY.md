# The Awakening Registration: Plan Summary

*For Citizens of Light Church · Prepared October 8, 2026*

## What we're building

A registration page for **The Awakening: Freshers Plug In** (**Saturday Oct 31, 4PM and Sunday Nov 1, 9AM**; rescheduled from Oct 24–25; Freedom Dome, Ilesanmi Bus Stop, Tanke, Ilorin), designed to match the event flyer and work well on phones.

When a student registers:

1. They fill in a short form: name, gender, institution, department, phone (WhatsApp) number, email, and, if they need a pickup bus, their area and address.
2. They instantly see their own **4-character raffle code** on screen and are asked to screenshot it.
3. The same code is **emailed** to them from the church's Gmail address.
4. Their details are saved securely and appear as a new row in the **church's Google Sheet** within about 5 minutes, ready for headcount, bus planning and follow-up.

**Each person can register only once.** If someone tries again with the same phone number or email, they're told they're already registered, and their code is re-sent to their email.

**After the registration page is live,** we'll add a **raffle draw screen** for the projector. It's protected by a password, picks codes at random, never picks the same code twice, and redraws if a winner isn't present.

The page can be **reused for future events** by changing its settings.

## What we're not building (for now)

- Logins or accounts for students
- Payments
- SMS or WhatsApp messages from the system
- Check-in at the door
- Automatic choice of bus pickup points (your transport team will plan these from the Sheet)
- An admin website (the Google Sheet is your admin tool)

We're happy to discuss any of these as a later addition.

## Timeline

| Date | Milestone | What you'll do |
|---|---|---|
| Oct 9 | Behind-the-scenes test of saving and emailing | — |
| Oct 11 | **Design preview** | Review and approve screenshots |
| **Oct 13** (Oct 14 at the latest) | **Registration goes live** | Confirm go-live; receive the link and QR codes |
| By Oct 20 | Raffle draw screen ready | Rehearse the draw |
| Oct 21 onwards | No new changes, only fixes | — |
| Oct 22 | Final list for bus planning | Send pickup points to students |
| Oct 31 – Nov 1 | The event and raffle draw | — |
| After the event | Close registration and secure the account | — |

**If anything puts the Oct 14 launch at risk,** we'll tell you immediately and switch to a branded Google Form, so the outreach isn't wasted.

## What we need from you

| What | By |
|---|---|
| Answers to the questions we sent (anything unanswered uses our suggested option) | Oct 10 |
| High-quality logo and flyer files, if available; approval of the privacy and consent wording | Oct 10 |
| The list of schools to show, and approval of the confirmation email wording | Oct 11 |
| Names and Gmail addresses of the leaders who should see the Sheet | Oct 12 |
| Access to the venue laptop and projector for a draw rehearsal | Oct 21 |

**Changes after we start:** send them in writing (WhatsApp is fine). We'll tell you how each affects the timeline before doing it.

## Running costs

**₦0.** Everything runs on free plans:
- website hosting: Vercel's free plan
- a secure database: Supabase's free plan, which handles many people registering at the same moment
- the church's Google Sheet
- emails from the church's Gmail

Everything is set up under **the church's own accounts**.

**One thing to know:** free Gmail limits how many emails can be sent per day. On very busy days, some confirmation emails may arrive a few hours late, and the system retries them automatically. **Every student always sees their code on screen immediately**, so nobody loses their code.

## Keeping students' information safe

- Registrations are stored in a secure database (Supabase) that only the website's server can reach, with a copy in the church's Google Sheet. Both accounts belong to the church.
- The Sheet is shared only with the leaders you name.
- The form explains clearly how the church will use the information (event, transport, raffle, follow-up), and students agree before registering. Follow-up calls and WhatsApp messages have their own opt-in.
- Home addresses are asked for only from students who need a bus.
- After the event, the website's access to the church email is switched off.

## After the event

You'll receive a short guide covering:
- reading the Sheet
- running the draw
- closing registration
- handling a request to delete someone's details
- reusing the page for your next event

Support continues through **October 31**.
