# Deploy GigRadar permanently (Vercel + Postgres)

This is the setup that makes GigRadar **permanent and robust**: a stable URL,
24/7 radar that hunts on its own, data that survives every redeploy, and phone
alerts. Storage now supports **Postgres** (see `src/lib/storage/`), which is
what makes data durable on Vercel — a local SQLite file would reset on each
deploy.

> Scope: UAE only. The radar hunts Dubai/Abu Dhabi/UAE bookings and stays
> within her home market.

---

## Step 0 — One-time: a free Postgres database (5 min)

Data lives in Postgres so it never resets. Pick one (both have free tiers):

- **Neon** — https://neon.tech → sign up → **Create project** → copy the
  `DATABASE_URL` (looks like `postgresql://user:pass@ep-xxx.aws.neon.tech/db`).
- **Supabase** — https://supabase.com → new project → **Project Settings →
  Database → Connection string** → copy it.

You'll paste this URL into Vercel in Step 2. Save it for now.

> ⚠️ This connection string contains your database password. Treat it like a
> password — don't paste it into chat or email.

---

## Step 1 — Deploy the app to Vercel (2 min)

1. Go to **https://vercel.com/new** and sign in with GitHub.
2. **Import** the repository **`kirthregis/Cross-Claude-Code`**.
3. Under **Configure Project → Settings**, set the **Branch** to
   **`arena/019fccff-cross-claude-code`**.
4. Click **Deploy**. Wait ~2 minutes for the build.

When it finishes you get a URL like `cross-claude-code-xyz.vercel.app`.

---

## Step 2 — Add environment variables (5 min)

In Vercel, open your project → **Settings → Environment Variables**, add these,
then **Redeploy**:

| Variable | What it is | Required |
|---|---|---|
| `DATABASE_URL` | Your Neon/Supabase connection string from Step 0 | ✅ always |
| `APP_URL` | Your deployed URL, e.g. `https://gigradar.vercel.app` | ✅ always |
| `CRON_KEY` | A random password protecting `/api/sweep` | ✅ recommended |
| `INGEST_KEY` | A random password protecting inbound webhooks | only if using webhooks |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `WHATSAPP_TO` | Meta WhatsApp Cloud API — her phone alerts | one channel needed |
| `RESEND_API_KEY` / `ALERT_EMAIL_TO` | Email alerts (Resend free tier) | one channel needed |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | Telegram alerts (fastest free option) | one channel needed |

> You only need **one** alert channel to start (WhatsApp, email, or Telegram).
> `DATABASE_URL` + `APP_URL` + `CRON_KEY` are the three that make it "permanent."

### Setting up the 24/7 sweep cron
The `vercel.json` in the repo already defines a cron that calls `/api/sweep`
every minute. **Vercel requires the project to be on the Pro plan for cron
jobs** (free plan cron is limited). If you're on the free plan, you can still
run the radar on-demand (the web scan runs when the sweep runs); for truly
always-on you'll want the Pro plan or a free external cron hitting
`https://your-app.vercel.app/api/sweep` every minute with the `x-cron-key`
header.

---

## Step 3 — Verify it's permanent & working

1. Open your deployed URL — you should see the dashboard (run **npm run seed**
   once against Postgres if empty, or add a gig).
2. **Test durability:** deploy again / trigger a redeploy — your gigs, profile
   and settings **stay** because they're in Postgres now.
3. **Test an alert:** paste a test gig into the dashboard. If a channel is
   configured, she gets the ping.

---

## What she does afterward

**Nothing.** Once deployed:
- The radar hunts on its own (web scan + any feeds she wires up) every minute.
- Real gigs ping her phone via WhatsApp/email/Telegram with one-tap pitch links.
- Contracts, invoices and the shareable booking page auto-generate.

She can **optionally** personalise anything in the **Studio** (`/customize`) —
search phrases, blocklist, quiet hours, alert loudness, pitch sign-off, and
upload her photos/videos as artwork.

---

## Troubleshooting

- **Build fails** → make sure the branch is `arena/019fccff-cross-claude-code`.
- **Data resets on redeploy** → `DATABASE_URL` isn't set (or the app is running
  SQLite). Set it and redeploy.
- **No alerts** → no alert channel env vars are set, or the channel keys are
  wrong. Check `/sources` in the app.
- **Cron not firing** → cron needs Vercel Pro, or set up an external cron
  hitting `/api/sweep` with `x-cron-key`.

---

## Media note (photos/videos as artwork)

On Vercel, uploaded photos/videos are stored in the app's data dir, which Vercel
does **not** persist across redeploys (the database persists; media files do
not, without a blob store). For fully permanent media, a Vercel Blob / S3 store
is the follow-up — this is called out in `ROADMAP.md`. Local use persists fine.
