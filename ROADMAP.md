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
