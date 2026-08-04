# GigRadar — DJ Emy (gigs + EMY Studio)

> ### 🎧 EMY Studio — her production studio
> **Master the mix, design the cover, package the release, pass the platform
> checks, hand off to YouTube** — in one installable app that runs on her
> laptop and her phone, offline and online, with a voice assistant she can
> talk to. See **[STUDIO.md](STUDIO.md)** for the full walkthrough.
> Open it at **`/studio`**.

> ### 📄  Want the documents without running anything?
> Open the **[`pack/`](pack/)** folder. Rate card, pitch scripts, negotiation
> playbook, contract, invoice, runsheet and press pack — all generated, all
> usable right now. Nothing to install.
>
> ### 🚀 Want the live app with phone alerts?
> One click, no terminal:
> [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkirthregis%2FCross-Claude-Code%2Ftree%2Farena%2F019fc128-cross-claude-code)
>
> Then see [START-HERE.md](START-HERE.md) for switching on WhatsApp + email.

Every GCC gig, the minute it appears. Found, scored, priced, pitched, negotiated and contracted.

A gig-acquisition engine for DJ Emy, represented by **Emy Vision Group**. It watches every source where UAE and Qatar bookings surface, pushes the good ones to her phone within seconds, tells her exactly what to charge and who to call, and generates the entire paperwork pack the moment a deal is agreed.

---

## The flow

```
sources ──▶ normalise ──▶ dedupe ──▶ score ──▶ ALERT (phone, seconds)
                                       │
                                       ▼
                              price  ·  who to call  ·  what to say
                                       │
                                       ▼
                    contract · tech rider · runsheet · invoice · press/IP
```

## What it does

**1. Finds gigs, everywhere**
Instagram promoters and venues, WhatsApp promoter groups, the booking inbox, event calendars (Platinumlist / RA / Time Out), gig boards and agency roster calls. Every source is optional and independent — unconfigured feeds are skipped, and one slow or broken feed never blocks the rest.

**2. Understands messy text**
A promoter's caption or a WhatsApp voice-note transcript becomes structured data: venue, tier, area, date, set length, slot, genres, budget, exclusivity, travel, residency, and every contactable person ranked by how close they are to the money.

**3. Deduplicates ruthlessly**
The same gig hits Instagram, a WhatsApp group and an agency mailout. Content-based fingerprinting collapses all of them into one alert.

**4. Scores before it interrupts**
0–100 on genre fit, money, venue quality, contactability, urgency and freshness. Only urgent gigs may buzz between 02:00 and 09:00 Dubai time — she is never woken for a 1,500 AED weeknight bar slot.

**5. Prices with a reasoned model**
Base rate by venue tier, then transparent multipliers: Dubai season curve, night of week, set length, slot, short-notice premium, Ramadan, exclusivity, travel, residency. Returns an **opening ask**, a **realistic target**, and a **hard walk-away** — with every adjustment itemised so she can argue the number.

**6. Tells her exactly who to contact and what to say**
Contacts ranked by decision power, the right channel for each, and ready-to-send WhatsApp / Instagram DM / email pitches. Plus a negotiation playbook for the objections that actually come up in Dubai — including "do it for exposure".

**7. Generates the whole deal pack**
Performance agreement (fee schedule, cancellation tiers, technical rider, hospitality, sound-limit liability, **IP and press rights**, force majeure, exclusivity, Dubai governing law), a night-of runsheet with timings and checklists, an invoice, and a press/content pack.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional — the app runs fully without it
npm run seed                   # loads realistic Dubai sample leads
npm run dev                    # http://localhost:3000
```

`npm run seed` gives you a populated dashboard immediately so you can see scoring, pricing and contract generation working before wiring up a single real source.

```bash
npm test          # 154 tests (incl. EMY Studio DSP/release/assistant)
npm run build
npm run sweep     # run one ingest sweep from the CLI
```

---

## Turning on real alerts

Full walkthrough in **[START-HERE.md](START-HERE.md)**. Summary:

| Channel | Status | Notes |
|---|---|---|
| **WhatsApp** | ✅ supported | Meta Cloud API. Main channel — it's where she already is. |
| **Email** | ✅ supported | Resend. Easiest to set up, works immediately. |
| **Instagram** | ❌ not possible | Meta forbids API DMs to your own account; unofficial tools get accounts banned. IG gigs are alerted via WhatsApp/email with a one-tap link into the thread. |
| Telegram | optional | Alternative if you want it. |

### Telegram (optional alternative)

1. Message **@BotFather** on Telegram → `/newbot` → copy the token.
2. Message your new bot once, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy your chat id.
3. Put both in `.env.local`:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
APP_URL=https://your-deployment.com
```

Alerts arrive with the venue, date, recommended ask, best contact, and buttons for **Open deal** and **WhatsApp now**.

## Turning on sources

Everything is env-driven; see `.env.example` and the in-app **/sources** page, which shows live vs. not-set-up for each feed with its exact setup instructions.

| Source | How |
|---|---|
| WhatsApp groups | POST to `/api/ingest/whatsapp` from a WhatsApp Business webhook or Baileys bridge |
| Booking inbox | Forward mail to `/api/ingest/email` (SendGrid Inbound Parse / Cloudflare Email Workers) |
| Instagram | `IG_SCRAPER_URL` + `IG_WATCH_HANDLES` |
| Calendars | `CALENDAR_FEEDS` — RSS or JSON, both supported |
| Gig boards | `BOARD_FEEDS` — JSON endpoints |
| Anything | Paste it into the box on the dashboard, or POST `/api/ingest/manual` |

Inbound webhooks are authenticated with `INGEST_KEY`; the sweep endpoint with `CRON_KEY`.

### Keeping the radar sweeping

Hit `GET /api/sweep` every 60 seconds. On Vercel add to `vercel.json`:

```json
{ "crons": [{ "path": "/api/sweep", "schedule": "* * * * *" }] }
```

WhatsApp and email leads bypass the sweep and are processed the instant they arrive.

---

## Bookings route through Emy Vision Group

She is represented end-to-end by EVG, so the app never pitches first-person from the
artist — that undercuts the "one accountable, contracted point of contact" positioning
and invites direct-to-artist fee haggling. Instead:

- **Pitches** are signed by Kirth at EVG, and lead with the proof point that fits the
  room: FIFA World Cup Qatar 2022 / Arab Cup 2025 for brand and festival work, bilingual
  English–Arabic positioning for Arabic floors, golden-hour rooftop credentials for lounges.
- **Contracts** name EVG as the contracting party furnishing the Artist's services, with
  EVG signing on her behalf and a **non-circumvention clause** protecting the relationship.
- **Invoices** are payable to EVG only, with an explicit note that direct payment to the
  artist does not discharge the invoice.
- **Approvals** (artwork, billing, content) route to EVG, not the artist.

### GCC, not just Dubai

She works both sides of the Gulf. Doha, Abu Dhabi and the wider UAE are **home markets** —
a Doha booking carries no travel premium, which would otherwise have priced her out of
half her own territory. Riyadh, Kuwait, London etc. do carry it.

## Rates are market-researched

See **`RATE-RESEARCH.md`** for the full working. Dubai's DJ market runs in four
tiers (entry 1.5–3k · mid 3–5.5k · premium 6–15k · celebrity/international 20k+).
Emy sits at the top of *premium*, entering *celebrity* for brand work, on five
levers: FIFA World Cup 2022 + Arab Cup 2025 official tournament DJ, Afro House
genre scarcity in the GCC, bilingual EN/AR floors, full EVG representation, and
named venue history.

The ~AED 2,400 marketplace "average" is a saturated pool of part-time open-format
DJs — it is not her comparable set, and the negotiation playbook has a specific
counter for bookers who quote it.

## 📄 Import from documents — no retyping

Go to **`/profile` → Import from documents** and upload the EVG business licence
and bank details (PDF, `.md`, `.txt`). The app reads them and fills in:

- Registered legal entity name
- Trade licence number
- Account name, bank, IBAN, SWIFT

It's deliberately two-step: **Read files** shows what it found so you can check
it, then **Save these values** commits. Anything it can't find is listed
explicitly so you can type just those fields.

Scanned/photographed PDFs with no text layer will report that they need OCR
rather than silently returning nothing.

## 🔒 Sensitive data stays local

Uploaded files are parsed **in memory and never written to disk** — only the
extracted fields are stored, in your own SQLite file (`/data`, git-ignored) —
and rendered only onto the contract and invoice. Nothing is transmitted
anywhere or written to logs.

**Don't send the trade licence, Emirates ID or bank statements through chat or
email.** Upload them to the app instead, where they stay on your own machine.

## ⚠️ Before real use — fill in the profile

Open **`/profile`** in the app. It lists exactly what's still missing and lets you edit
rates, contact details and contract defaults without touching code — changes take effect
immediately across pricing, pitches and contracts.

The compiled-in defaults live in **`src/lib/artist.ts`**; the `/profile` screen writes
overrides on top of them. What must be replaced:

- **`legalName`** — required for contracts to be valid
- **`baseRatesAed`** — currently Dubai market ballpark, not Emy's actual rates. Feed in 5–10 past bookings and these become genuinely accurate.
- **`hardFloorAed`** — her real never-below number
- **Contact details, Instagram handle, EPK URL**
- **Tech rider** — confirm the exact equipment she asks for
- **Bank details** for the invoice template

Also review:
- `RAMADAN_WINDOWS` in `src/lib/pricing.ts` — approximate, refine yearly
- `IG_WATCH_HANDLES` in `.env.example` — swap in the promoters who actually book her

**⚖️ Legal note:** the contract generator produces a solid industry-standard performance agreement covering fees, cancellation, technical requirements, IP, press rights and UAE governing law — but it is a template, not legal advice. Have a UAE-qualified lawyer review it once before using it on high-value bookings.

---

## EMY Studio

| Path | Role |
|---|---|
| `src/app/studio/*` | The studio: home, project workspace, settings |
| `src/components/studio/*` | Assistant, Master, Artwork, Release, Check panels |
| `src/lib/studio/types.ts` | Project / settings / master-params models |
| `src/lib/studio/audio.ts` | Browser audio engine: decode, A/B preview, chunked offline render, 48 kHz WAV export |
| `src/lib/studio/dsp.ts` | Pure DSP: BS.1770-4 loudness (LUFS), true-peak, biquads, soft-clip |
| `src/lib/studio/wav.ts` | WAV encoder (16/24-bit + RIFF INFO tags) |
| `src/lib/studio/release.ts` | Title/description/tags/file names + compliance checks |
| `src/lib/studio/assistant.ts` | Offline voice-command brain (works with zero keys) |
| `src/lib/studio/gemini.ts` | Free-tier Gemini REST client (chat + image) |
| `src/lib/studio/artwork.ts` | Canvas templates + AI cover pipeline (3000×3000) |
| `src/lib/studio/store.ts` | localStorage + IndexedDB persistence |
| `src/app/api/studio/*` | Email ping routes (Resend, server-side only) |

The studio is a PWA (`public/sw.js`, `public/manifest.json`, icons) — installs
to the home screen, works offline after first visit.

## Architecture

| Path | Role |
|---|---|
| `src/lib/artist.ts` | Compiled-in defaults: rates, rider, contract terms |
| `src/lib/profile-store.ts` | DB-backed overrides from `/profile`, deep-merged over the defaults |
| `src/lib/extract.ts` | Free text → structured gig; dedupe fingerprinting |
| `src/lib/pricing.ts` | The pricing brain — ask / target / walk-away with itemised reasoning |
| `src/lib/score.ts` | Fit scoring and alert tiering (incl. quiet hours) |
| `src/lib/sources/` | Pluggable source adapters — one file to add a feed |
| `src/lib/ingest.ts` | The sweep: fetch → normalise → dedupe → score → alert |
| `src/lib/notify.ts` | Telegram + webhook delivery |
| `src/lib/outreach.ts` | Pitches, contact strategy, negotiation playbook |
| `src/lib/contract.ts` | Contract, runsheet, invoice, press/IP pack |
| `src/lib/db.ts` | SQLite persistence (swap for Postgres by replacing this file) |

Next.js 15 · TypeScript · Tailwind 4 · SQLite · Vitest. Installable as a PWA.

## Tests

154 tests covering budget/date/contact extraction, dedupe, the full pricing model, scoring and alert tiers, and document generation — including regression tests for two bugs found by running the real pipeline:

- a gig happening **tonight** was read as already expired, suppressing the highest-leverage gigs of all
- pitches **underquoted a budget the client had already stated**, handing money back
- `\bexclusiv\b` **never matched "exclusive"** — the trailing word boundary meant exclusivity was silently never detected, losing the +30% premium (worth ~AED 8,650 on a single seeded booking)
