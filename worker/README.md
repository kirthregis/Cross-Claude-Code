# GigRadar Worker — always-on alerts

This is the half a static page cannot do: it runs on a schedule and pushes to
her phone **with the app closed**.

Free on Cloudflare's plan.

## Deploy (about 10 minutes, all in the browser or one terminal)

```bash
cd worker
npm i -g wrangler          # or: npx wrangler
wrangler login             # opens a browser

# 1. storage
wrangler kv namespace create GIGS
#    copy the printed id into wrangler.toml -> kv_namespaces.id

# 2. push keys (VAPID)
npx web-push generate-vapid-keys
#    put the PUBLIC key into wrangler.toml -> [vars] VAPID_PUBLIC
wrangler secret put VAPID_PRIVATE      # paste the private key
wrangler secret put INGEST_KEY         # any long random string

# 3. ship it
wrangler deploy
```

You get a URL like `https://emy-gigradar.<you>.workers.dev`.

## Connect the app

In the app: **⚡ New gig → Connect server**, paste that URL. Then
**Turn on alerts**. Done — she now gets pushes with the app closed.

## Endpoints

| Route | Purpose |
|---|---|
| `GET /feed.json` | Gig feed the app polls |
| `GET /vapid` | Public push key |
| `POST /subscribe` | Register a phone for push |
| `POST /ingest/whatsapp` | Inbound WhatsApp lead |
| `POST /ingest/email` | Inbound email lead |
| `POST /ingest/manual` | Anything pasted in |
| `GET /sweep` | Run a poll now (for testing) |

Ingest routes need header `x-ingest-key: <INGEST_KEY>`.

Test it:
```bash
curl -X POST https://YOUR-WORKER/ingest/manual \
  -H 'Content-Type: application/json' -H 'x-ingest-key: YOUR_KEY' \
  -d '{"text":"Need an Afro House DJ Saturday at Cove Beach, 2hr peak, AED 6500. WhatsApp +971 50 442 1188"}'
```
Her phone should buzz.

## Feeding it real gigs

- **Email** — Cloudflare Email Routing can forward the booking inbox straight
  to `/ingest/email`. No extra service.
- **WhatsApp groups** — a bridge (Meta Cloud API or Baileys) POSTing to
  `/ingest/whatsapp`.
- **Calendars / boards** — set `CALENDAR_FEEDS` / `BOARD_FEEDS` in
  `wrangler.toml` to comma-separated RSS or JSON URLs. Polled every 5 min.
- **Instagram** — no official API allows reading other accounts' posts or DMs.
  Anything that claims to is unofficial and risks the account. Instagram gigs
  are best pasted in manually, which the app already handles in one step.

## Scoring and quiet hours

Same engine as the app (`src/lib/score.ts`, `pricing.ts`) — one source of
truth. Gigs scored `suppress` never alert. Between 02:00 and 09:00 Dubai only
`urgent` gigs push; the rest wait in the feed.
