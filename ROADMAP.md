# GigRadar — roadmap & vision

The immediate mission is one sentence: **get DJ Emy booked in Dubai today, before
the other DJs see the slot, from her phone, for free, in a few taps.** The longer
vision is bigger — GigRadar becomes the place where UAE entertainment providers
and clients meet. This doc separates the two so we never let the long game drown
the immediate goal.

## The immediate goal (this week): book a premium Dubai gig

Three things have to be true, in this order:

1. **See it first.** The radar must surface an opportunity before her competitors
   do. The `pack/` documents and the app's scoring/pricing/contract engine are
   done. What turns the radar into a genuine "find it first" machine is real
   **sources** and **always-on running**:
   - **Web scan (NEW — `webSearchSource`)** scours Google News + custom feeds for
     UAE entertainment/booking leads on every sweep. No credentials, free.
   - **Her real networks** (WhatsApp promoter groups, booking inbox, IG handles)
     are the highest-value, lowest-latency feeds because they push the instant a
     gig is posted. Wire at least one.
   - **24/7** needs the sweep on a free cron (Vercel/Cloudflare). A laptop only
     scans while it's on.
2. **Get it quickly.** The alert already carries one-tap "WhatsApp the booker"
   (pitch pre-written), "Open Instagram", and the full deal page with
   Price / Contact / Negotiate / Paperwork. The seam between *see it* and *sent
   the pitch* is already one tap — protect that seam.
3. **Book it.** Contracts, invoices, runsheet and press pack are auto-generated.
   The profile must be completed (EVG legal name, licence, bank) or contracts are
   unenforceable.

**Go-live checklist** (also reproduced in `.env.example`):
- [ ] `npm install` + `npm run seed` to see it working
- [ ] Set `APP_URL` + at least one alert channel (`WHATSAPP_*`, `RESEND_*`, or
      `TELEGRAM_*`) — all free tiers
- [ ] Set at least one source: `CALENDAR_FEEDS` / `BOARD_FEEDS` (zero creds),
      `IG_WATCH_HANDLES` (+ scraper), or wire WhatsApp/email inbound
- [ ] Fill the `/profile` (EVG name, licence, bank, real rates)
- [ ] Deploy + add the `/api/sweep` cron (Vercel crons are in `vercel.json`)

## The edge — what nobody in this space gives an artist

Category positioning: GigRadar is not "another marketplace listing" and not a
"chatbot." It is the only tool that gives a **working artist the full
find → price → pitch → book → contract loop on their own phone, personalized to
their own positioning, for free, in under a minute per gig.** The defensible,
hard-to-copy edges:

1. **Radar-first, not search-first.** It hunts for the artist continuously
   (feeds + web scan) instead of making them scroll. "Before anyone else" comes
   from speed of discovery, and the scoring model ranks *what to move on now*.
2. **A pricing brain with a position, not a number.** Every quote is a
   transparent stack (season · night · slot · urgency · exclusivity · residency)
   built on researched Dubai tier rates and her actual leverage (FIFA credits,
   genre scarcity, EN/AR, full agency). Competitors quote a flat fee; GigRadar
   gives an ask / target / walk-away she can defend.
3. **One tap from alert to a client-facing booking page (`/book/[id]`).**
   The radar's output is a live, shareable microsite: her EPK, the date, the
   fee, and a "Request this booking" that lands in the agency's inbox. No
   booking tool lets an artist hand a client a per-opportunity booking page
   straight off their own radar. **This is the differentiator.**
4. **The whole paperwork pack auto-generates** — contract, tech rider,
   runsheet, invoice, press/IP — off the same profile and fee. Bookers and
   artists both hate admin; it's removed.
5. **Agency-routed by design.** EVG is the single contracted point of contact
   (non-circumvention, invoices payable to EVG). That's a *trust* feature that
   protects the relationship and supports premium pricing.

### Known architectural debt (do not regress, but be honest about it)
- There are **two "always-on" paths**: the Next/Vercel app with the cron sweep,
  and a Cloudflare Worker (`worker/`) with its own feeds + Web Push. They share
  the lib logic but have separate storage and channel wiring. Before the
  marketplace phase, consolidate onto ONE runtime to avoid drift.
- **Vercel's filesystem is ephemeral** — SQLite (`/data`) and uploaded media
  reset on every deploy. For a permanent hosted setup, move storage to
  Postgres/object storage (`db.ts` is the only swap point). Local use persists
  fine.

## The longer vision: a UAE entertainment marketplace

Down the road GigRadar becomes a **two-sided marketplace**:

- **Supply side (providers):** DJs, MCs, bands, dancers, singers, technical crews —
  each with a profile, pricing, availability, EPK and (later) verified reviews.
- **Demand side (clients):** venues, promoters, brands, event agencies and private
  clients posting briefs ("need an Afro-house DJ, Friday peak slot, Dubai Marina,
  this month").

Where the current single-artist engine maps onto it:

| Now (single artist) | Later (marketplace) |
|---|---|
| `src/lib/artist.ts` = one fixed artist | A `Provider` model, many artists |
| `activeProfile()` reads one profile | A `providers` table + discovery |
| Scoring fits ONE artist's genres | Matching scores any provider against any brief |
| Pitch is signed by EVG for Emy | Bookings route through each provider's agency/contract |
| One pricing brain | Per-provider rate cards + transparent market data |

The good news: the **core is reusable**. The normalise → dedupe → score → price →
contract pipeline, the sources system (every source already implements one tiny
`Source` interface), the outreach/negotiation playbook, and the paperwork
generator all transfer to many-provider, many-client shape with modest refactoring.

**Deliberate ordering — don't build the marketplace before Emy's engine works
end to end.** The marketplace only has value if supply-side providers actually
get booked, which is exactly what the single-artist engine proves first. So:
1. Get Emy booked today (above).
2. Generalise artist→providers and add more providers.
3. Open the demand side: a "post a brief" flow for clients.
4. Add discovery, search, proposals and (eventually) payments/escrow.

Every step keeps "she gets booked, first, for free, in a few taps" as the
north star — the marketplace is just that engine, generalised.
