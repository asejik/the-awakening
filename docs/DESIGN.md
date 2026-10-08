# DESIGN.md: The Awakening Registration

**Direction: A, "Flyer, Alive"** (approved by the builder, who is design approver for the church).
Mockup reference: [design/directions.html](design/directions.html), Direction A only.
Source of truth for the brand: `The Awakening.png` (flyer), `the awakening - logo.png` (title lockup) and `clc logo.png`.

**All UI uses these tokens.** No one-off colours, sizes, radii, shadows or durations. If something is missing, add a token here first.

---

## 1. Brand brief

- **Users:** university freshers in Ilorin, on low-end and mid-range Android phones over mobile data. They usually open the page from WhatsApp Status, Instagram or a campus QR code, inside an in-app browser.
- **Feel:** **loud, joyful, street-bold, welcoming.** Youthful hype, but trustworthy enough to hand over a phone number.
- **Idea:** *the flyer, now tappable.* The first screen is the poster. Everything after it is a sticker pasted onto cream paper.
- **Platform:** mobile web, designed at 360px first. Desktop is the same column, centred.

---

## 2. Colour

### Tokens

| Token | Hex | Role |
|---|---|---|
| `--color-cream` | `#FAF0DC` | Page background (form, sections) |
| `--color-paper` | `#FFF8F6` | Input fill, tags, raised "paper" surfaces |
| `--color-ember` | `#F05A35` | Starburst, primary button fill, success-screen background. **Never text on cream.** |
| `--color-ember-700` | `#C7381A` | Orange *text* on cream/paper: links, ticket labels, tags |
| `--color-maroon` | `#4E0710` | Info panels, Day badges, ticket header, blobs |
| `--color-ink` | `#140A0A` | Text, outlines, hard shadows, selected segments |
| `--color-muted` | `#5C4842` | Secondary text, helper text |
| `--color-error` | `#B3261E` | Error text and borders (always with an icon and a message) |
| `--color-success` | `#1F6B3A` | Rare inline success, e.g. "Email sent" |
| `--color-focus` | `#F05A35` | Focus ring (paired with an ink outline, see §7) |

### Contrast (WCAG 2.2 AA; checked)

| Pair | Ratio | Allowed use |
|---|---|---|
| ink on cream / paper | 17.2 / 18.6 | All text |
| muted on cream / paper | 7.5 / 8.1 | All text |
| ember-700 on cream / paper | 4.6 / 5.0 | All text |
| error on cream / paper | 5.8 / 6.2 | All text |
| cream on maroon | 13.6 | All text |
| ember on maroon | 4.6 | All text (Day badge dividers, accents) |
| ink on ember | 5.8 | All text: **button labels on ember** |
| maroon on ember | 4.6 | All text |
| paper/white on ember | 3.2 | **Large or bold display only (≥24px, or ≥18.66px bold).** The title artwork is exempt (it's an image with an ink outline). |
| ember on cream | 3.0 | **Never for text.** Only shapes and fills. |

---

## 3. Typography

**Two families only.** Load both from Google Fonts with `display=swap`, and only the weights listed.

| Role | Family | Weights |
|---|---|---|
| Display: headings, buttons, ticket code, tags | **Lilita One** | 400 (only weight) |
| Text: body, labels, inputs, details | **Barlow Condensed** | 500, 600, 700, plus italic 500 and 700 |

The **title "THE AWAKENING" is always the artwork image** (`title.webp`), never typeset.

### Type scale

All sizes in px, mobile-first. Desktop is the same: it's a single column.

| Token | Size / line-height | Font | Use |
|---|---|---|---|
| `--text-code` | 76 / 1 | Lilita, letter-spacing .08em | Raffle code on the ticket |
| `--text-h1` | 32 / 1.0 | Lilita | Section heading ("Plug in. Grab your raffle ticket.") |
| `--text-h2` | 26 / 0.95 | Lilita | "FRESHERS PLUG IN" panel, success heading |
| `--text-button` | 22 / 1 | Lilita, letter-spacing .02em | Buttons |
| `--text-lead` | 18 / 1.3 | Barlow 500 | Intro paragraph, helper copy |
| `--text-body` | 19 / 1.3 | Barlow 500 | Input values (≥16px avoids iOS zoom) |
| `--text-label` | 15 / 1.2 | Barlow 700, uppercase, letter-spacing .06em | Field labels |
| `--text-detail` | 17 / 1.1 | Barlow 700 *italic*, uppercase | Venue and date details (flyer style) |
| `--text-small` | 14–16 / 1.25 | Barlow 600 | Error messages (16), ticket meta labels (12–14) |
| `--text-tag` | 15 / 1 | Lilita | Tilted tags ("IT'S FREE", "FEATURING") |

**Rules:**
- Use uppercase only for labels, details and tags. Body copy and headings stay sentence case.
- Italic is reserved for details (venue, dates, programme), echoing the flyer.
- Never set display type below 14px.

---

## 4. Spacing and layout

- **Scale (4px base):** `--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 20 · `--space-6` 24 · `--space-8` 32 · `--space-10` 40 · `--space-12` 48
- **Page gutter:** 16px. **Content column:** max-width 440px, centred. On wide screens the cream page fills the viewport, and the starburst hero stays the column's width, centred.
- **Spacing:**
  - field to field: 14px (`--space-3` + 2, used only here)
  - section padding: 24–32px vertical
  - label to input: 5px
- Hero order (fixed):
  1. CLC logo (as supplied, 56px wide, clear of the starburst)
  2. Day badges (left and right)
  3. Title artwork
  4. "FRESHERS PLUG IN" panel
  5. Venue panel
  6. "Register free" button (scrolls to the form)

---

## 5. Shape and depth

**Signature: the hard offset shadow,** no blur, borrowed from the title's drop shadow. Use soft blurred shadows nowhere except the dev mockup frame.

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | Stamp |
| `--radius-md` | 12px | Inputs, segmented options |
| `--radius-lg` | 14px | Buttons |
| `--radius-xl` | 18px | Ticket |
| `--radius-full` | 9999px | Day badges |
| `--border-ink` | 2.5px solid ink | Inputs, segments |
| `--border-ink-thick` | 3px solid ink | Buttons, ticket |
| `--shadow-hard-sm` | `3px 3px 0 var(--color-ink)` | Day badges |
| `--shadow-hard` | `5px 5px 0 var(--color-ink)` | Buttons, the "IT'S FREE" tag |
| `--shadow-hard-lg` | `7px 7px 0 var(--color-ink)` | Ticket |
| `--shadow-panel` | `5px 5px 0 var(--color-cream)` | Maroon venue panel on ember |
| `--shadow-focus` | `4px 4px 0 var(--color-ember)` | Focused input |

**No glass or blur anywhere.** It's unnecessary for this look and costly on low-end phones.

---

## 6. Motion

Library: **Motion** (`motion/react`), only where CSS can't do the job, such as sequencing the ticket reveal. Prefer CSS transitions and keyframes. Animate **transform and opacity only.**

| Token | Value |
|---|---|
| `--dur-fast` | 150ms (press, hover, focus) |
| `--dur-base` | 250ms (field reveal, error appear, stamp) |
| `--dur-slow` | 400ms (ticket entrance) |
| `--ease-out` | `cubic-bezier(.2,.8,.2,1)`, for everything except the badges |
| `--ease-linear` | `linear` (badge rotation only) |

**Allowed motion (complete list):**
1. **Button press:** on `:active`, `translate(4px,4px)` and the shadow shrinks to `1px 1px 0` (`--dur-fast`). Hover on pointer devices lifts by -1px.
2. **Day badges:** the ring text rotates, 18s per turn (Day 2 reversed). It's on the hero only, never behind body text.
3. **Conditional fields** (transport → area and address; institution "Other"): opacity 0→1 and translateY 8→0 (`--dur-base`).
4. **Errors:** the message fades in (`--dur-base`). There's no shake.
5. **Ticket reveal (signature):**
   - the ticket goes from scale 1.12 and rotate -3° to its resting state (`--dur-slow`)
   - the "ENTERED!" stamp goes from scale 1.8 to 1, at 14° (`--dur-base`, 380ms delay)
   - focus then moves to the ticket heading for screen readers

**`prefers-reduced-motion: reduce`:** badges are static, the ticket and stamp appear instantly, and the button press is a colour change only (no translate). Content is **never** hidden while waiting for an animation.

---

## 7. Components

### Button (primary): one per screen
- Ember fill, ink label (Lilita 22), 3px ink border, `--shadow-hard`, `--radius-lg`, min-height 52px, full width in the form.
- **Secondary** (e.g. the hero "Register free" sitting on ember): paper fill, same border and shadow.
- **Loading:** label becomes "Registering…" with a small rotating Lucide `loader-2` (not rotated under reduced motion); disabled; `aria-busy`.
- **Disabled:** 50% opacity on the fill only; the shadow stays.

### Text input and select
- Paper fill, `--border-ink`, `--radius-md`, min-height 50px, Barlow 500 19px.
- Label above, always visible (never placeholder-only).
- **Focus:** `--shadow-focus` plus a 2px ink outline, offset 2px, for keyboard users (`:focus-visible`).
- **Error:** border `--color-error`, then a message underneath: Lucide `circle-alert` (16px) followed by the plain-English message. Linked with `aria-describedby`; `aria-invalid="true"`.
- **Select (institution):** native `<select>`, styled to match, with a Lucide `chevron-down`. Native means it works in every in-app browser.

### Segmented choice (gender, needs bus)
- Two equal options; radio inputs underneath. Unselected: paper with an ink border. Selected: ink fill with cream text. Min-height 48px.

### Checkbox (consent, age, follow-up opt-in)
- 24px box, 2.5px ink border, `--radius-sm`, ink fill when checked, with a cream Lucide `check`.
- The whole label row is tappable (≥44px tall). Links inside the label (e.g. "privacy notice") use ember-700 and are underlined.

### Panels (hero)
- **Maroon panel:** cream text, `--shadow-panel` on ember, detail type (italic uppercase).
- **Tag:** paper fill, 2px ink border, Lilita 15 in ember-700, rotated -2°.
- **Day badge:** 96px maroon disc, `--shadow-hard-sm`, ring text in Barlow 600 10.5px cream, centre "OCT. / 24TH" in Barlow 700 italic, ember divider, time underneath.

### Raffle ticket (success screen)
The success screen background is ember with maroon blobs in the corners; the small title artwork sits on top.

**Heading:** "You're plugged in, {firstName}!"

**The ticket, top to bottom:**
1. **Header:** maroon band, "RAFFLE TICKET" in label type. The "ENTERED!" stamp overlaps the top-right corner.
2. **Name (approved addition):** the registrant's **full name** under the header, in Lilita 22, ink, centred, up to 2 lines. If a name doesn't fit 2 lines at 22px, step down to 18px. The name makes the screenshot proof of ownership at the draw.
3. **Code:** Lilita 76, letter-spacing .08em, with "YOUR RAFFLE CODE" underneath in ember-700 label type.
4. **Perforation:** a dashed ink line, with half-circle notches cut out of each side.
5. **Stub:** Day 1 / Day 2 / Venue in detail type, with muted meta labels.

**Container:** cream, 3px ink border, `--radius-xl`, `--shadow-hard-lg`, width `min(300px, 100%)`.

**Below the ticket:** a maroon hint bar with a Lucide `camera` icon: "Screenshot this ticket. You'll need the code if you win." Then a secondary line: "Check your inbox (and spam) for a copy."

**Never shown:** a ticket or row number, since it would reveal the registration count.

**Accessibility:**
- The code is in a live region: "Your raffle code is K 7 Q X", announced letter by letter via `aria-label`.
- The visible text is selectable, so it can be copied.

### Page-level states (copy matches PROJECT_PLAN §8)
- **Closed** and **not yet open:** the hero stays; the form area becomes a maroon panel with the message in Lilita.
- **Server or network error:** an inline banner above the submit button, with a paper background, a 2.5px error border and a Lucide `wifi-off` or `circle-alert` icon. The user's answers are kept.
- **Already registered:** the success screen layout with **no ticket**, a maroon panel saying "You're already registered! We've re-sent your code to the email you used."

### Icons
- **Lucide only,** 2px stroke (2.5 at 16px), `currentColor`, `aria-hidden` unless the icon stands alone.
- **No emoji in the UI.** Emoji are fine in email copy only.

---

## 8. Imagery and assets

| Asset | Source | Ship as | Budget |
|---|---|---|---|
| Title lockup | `the awakening - logo.png` (904×706) | `title.webp` ≤720px wide plus a PNG fallback; `width`/`height` set | ≤ 60 KB |
| CLC logo | `brand/clc-logo.png` **used exactly as supplied** (it already includes the church name; never add a text label beside it). Trimmed of empty margin only. | `clc-logo.webp` (264px wide) plus a PNG fallback; shown 56px wide, top-left; its text must not overlap the starburst | ≤ 15 KB |
| Starburst and blobs | Inline SVG / CSS (no image) | — | 0 KB |
| Open Graph / WhatsApp preview | Flyer, cropped 1200×630 | `og.jpg` | ≤ 150 KB |

The full flyer PNG (1.4 MB) is **never** loaded by the page.

**Starburst:** a 16-point SVG polygon (outer radius 100, inner 62) in ember, sitting behind the badges and the title, about 680px wide at the 360px viewport, clipped by the hero.

---

## 9. Tailwind 4 theme (copy-ready)

```css
/* src/styles/theme.css */
@import "tailwindcss";

@theme {
  --color-cream: #FAF0DC;
  --color-paper: #FFF8F6;
  --color-ember: #F05A35;
  --color-ember-700: #C7381A;
  --color-maroon: #4E0710;
  --color-ink: #140A0A;
  --color-muted: #5C4842;
  --color-error: #B3261E;
  --color-success: #1F6B3A;

  --font-display: "Lilita One", "Arial Black", sans-serif;
  --font-text: "Barlow Condensed", "Arial Narrow", sans-serif;

  --text-code: 76px;   --text-code--line-height: 1;
  --text-h1: 32px;     --text-h1--line-height: 1;
  --text-h2: 26px;     --text-h2--line-height: 0.95;
  --text-button: 22px; --text-button--line-height: 1;
  --text-lead: 18px;   --text-lead--line-height: 1.3;
  --text-body: 19px;   --text-body--line-height: 1.3;
  --text-label: 15px;  --text-label--line-height: 1.2;
  --text-detail: 17px; --text-detail--line-height: 1.1;
  --text-small: 16px;  --text-small--line-height: 1.25;
  --text-meta: 13px;   --text-meta--line-height: 1.2;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-xl: 18px;

  --shadow-hard-sm: 3px 3px 0 var(--color-ink);
  --shadow-hard: 5px 5px 0 var(--color-ink);
  --shadow-hard-lg: 7px 7px 0 var(--color-ink);
  --shadow-panel: 5px 5px 0 var(--color-cream);
  --shadow-focus: 4px 4px 0 var(--color-ember);
  --shadow-pressed: 1px 1px 0 var(--color-ink);

  --ease-out: cubic-bezier(.2, .8, .2, 1);
  --animate-badge-spin: badge-spin 18s linear infinite;
  --animate-ticket-in: ticket-in 400ms var(--ease-out) both;
  --animate-stamp-in: stamp-in 250ms 380ms var(--ease-out) both;

  @keyframes badge-spin { to { transform: rotate(360deg); } }
  @keyframes ticket-in { from { opacity: 0; transform: scale(1.12) rotate(-3deg); } to { opacity: 1; transform: none; } }
  @keyframes stamp-in { from { opacity: 0; transform: rotate(14deg) scale(1.8); } to { opacity: 1; transform: rotate(14deg) scale(1); } }
}

:root {
  --dur-fast: 150ms;
  --dur-base: 250ms;
  --dur-slow: 400ms;
  --border-ink: 2.5px;
  --border-ink-thick: 3px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

Spacing uses Tailwind's default 4px scale (`p-4` = 16px, and so on). Don't add arbitrary values like `p-[13px]`.

---

## 10. Rules for this project

- **One dominant element per screen:**
  - Hero: the title artwork
  - Form: the "Get my ticket" button is the one primary action
  - Success: the ticket
- **Don't drift into generic.** No Inter or system-font UI, no purple or blue, no gradients at all, no glass, no emoji icons, no three-icon-card rows.
- **Copy voice:** short, warm, campus-casual ("Plug in", "Grab your raffle ticket", "You're plugged in!"). Error messages are plain and specific; never "Invalid input".
- **Touch:** every tappable target is ≥44×44px; nothing important is hover-only; every button has a pressed state.
- **Performance:**
  - No particles or parallax; the only continuous animation is the badge rotation
  - JS ≤120 KB gzipped, hero image ≤60 KB, two font families
  - LCP target under 2.5s on Fast 3G
- **Accepted bend:** the badge rotation is ambient motion. It's kept because it's the flyer's own signature; it's slow, never behind body text, and disabled under reduced motion.
- **The raffle draw screen (M6)** uses the same tokens at projector scale. Its design gets a separate P06-B pass before it's built.

---

## 11. Email (confirmation and re-send)

- **Source:** `emails/Confirmation.tsx` (React Email + Tailwind, same colour tokens). `npm run email:build` renders it into `api/_lib/email-template.ts`, which is committed. A test fails if the template is stale.
- **Structure:**
  1. An ember header band with the title artwork (`/assets/email-title.png`; PNG because some clients can't show WebP) and the "Freshers Plug In" tag
  2. Heading and intro
  3. The **ticket**: maroon "RAFFLE TICKET" bar, full name, a 52px code, "YOUR RAFFLE CODE", dashed perforation, then Day 1, Day 2 and the full venue. The hard shadow is faked with 9px right and bottom borders, since `box-shadow` isn't reliable in email.
  4. A maroon "keep this email" bar
  5. Sign-off and footer
- **Responsive by being fluid:** max 600px, percentage widths, and sizes that work from 320px up.
  - **No `sm:`/`md:` classes:** React Email 1.0 with Tailwind 4 inlines them on every screen size (a bug, found 2026-10-08).
- **Fonts:** plain `@font-face` (Lilita One, Barlow Condensed) with Arial Black and Arial fallbacks.
  - **Never use React Email's `<Font>`:** it sets `* { font-family }` and put the display face on body text.
- `color-scheme: light only`.
- Dynamic values are `{{PLACEHOLDERS}}`, HTML-escaped at send time. An unfilled placeholder throws instead of sending.

