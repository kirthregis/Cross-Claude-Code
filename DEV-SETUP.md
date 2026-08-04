# Developer setup — the only things you need to do

Everything else is already built, tested (161 tests) and wired. This is the
complete list of what **only you** can do. ~10 minutes, in order.

## Required (2 items)

### 1. Get a free Gemini API key — 2 minutes
- Go to **https://aistudio.google.com/apikey** (sign in with a Google account; free tier, no card).
- **Create API key** → copy it.
- Add it to the app's environment:
  - **Laptop:** put `GEMINI_API_KEY=...` in `.env.local` (next to `.env.example`).
  - **Deployed (Vercel):** Settings → Environment Variables → add `GEMINI_API_KEY` → Redeploy.

This is the single biggest unlock: the assistant answers open questions, and
AI cover art works.

### 2. Set the admin token — 30 seconds
- Pick any password (a long random string is fine) and set `STUDIO_ADMIN_TOKEN=...`
  in the same place as above.
- This protects **`/studio/admin`** — your view of every suggestion she sends,
  with the AI's implementation plan, where you mark things Planned/Done.
- Leave it unset and the page stays locked (401); nothing else breaks.

## Optional — only if you want it (can wait)

| Item | What it gives you | Effort |
|---|---|---|
| `RESEND_API_KEY` + `STUDIO_NOTIFY_TO` | Email to **her** when a master/export finishes (the on-device ping already works) | ~3 min, free at resend.com |
| `DEV_FEEDBACK_TO` | Each suggestion also **emails you** with the AI plan (still lands in the DB + `/studio/admin` regardless) | 10 sec |
| `APP_URL` | Suggestion emails link to `/studio/admin` with the real host | 10 sec, after deploy |
| `FAL_KEY` | fal.ai image models (Flux/Recraft/Ideogram) — **skip for now**, Gemini free tier covers AI artwork | later |

## Deploy (your accounts — the only way it's on her phone)

1. Click the **Deploy with Vercel** button in the README (it now points at the
   right branch — the studio is included).
2. Add the env vars above under **Settings → Environment Variables** and redeploy.
3. Open your app URL → `/studio/admin`, enter your token once — confirm the back end.

> One honest caveat: Vercel's filesystem resets on redeploys, so suggestions
> stored there can be wiped on a redeploy. Your durable channels are the
> **email alerts** (`DEV_FEEDBACK_TO`) and, for laptop use, the local DB
> (`npm run inbox`). If you later want permanent hosted storage, add a free
> Neon Postgres — `src/lib/db.ts` is the only file to change.

## Verify in one command

```bash
npm run devcheck
```

Prints ✓/○/✗ for every item, the suggestion count in the DB, and the exact
action for anything missing. When the two ✗ are gone, the app is hand-off
ready: hand her the URL (or run it on her laptop) and add it to her home
screen.
