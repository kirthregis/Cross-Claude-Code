# Deploy — prove it finds gigs first

## Step 1 — the proof (2 minutes, no setup, no keys)

In a terminal:

```bash
cd worker
npx wrangler login      # opens your browser, click Allow
npx wrangler deploy
```

It prints a URL like `https://emy-gigradar.<you>.workers.dev`.

**Open that URL and press "Run the test."**

You'll see:
- how many DJ listings exist in the UAE right now
- how many are worth alerting Emy about
- **every source, with what it returned** — including any that failed
- the top gigs, scored
- what is honestly *not* covered

Nothing is stored. Nobody is alerted. If the number is poor, stop here —
you've lost 2 minutes, not a month.

## Step 2 — only if step 1 convinces you

```bash
npx wrangler kv namespace create GIGS
```
Paste the printed `id` into `wrangler.toml`, and uncomment the
`[[kv_namespaces]]` and `[triggers]` blocks.

```bash
npx web-push generate-vapid-keys
```
Put the **public** key into `wrangler.toml` → `VAPID_PUBLIC`, then:

```bash
npx wrangler secret put VAPID_PRIVATE     # paste the private key
npx wrangler secret put INGEST_KEY        # any long random string
npx wrangler deploy
```

Now in the app: **⚡ New gig → Connect server**, paste the Worker URL,
**Turn on alerts**. She gets pushes with the app closed.

## Step 3 — email gigs (optional, big win)

Cloudflare dashboard → your domain → **Email Routing** → forward
`bookings@emyvisiongroup.com` to a Worker, pointing at `/ingest/email`.
Agency mailouts and inbound enquiries then flow in automatically.

## Cost

| | Free tier | This uses |
|---|---|---|
| Requests | 100,000/day | ~626 (0.6%) |
| KV reads | 100,000/day | ~1,250 (1.3%) |
| KV writes | 1,000/day | ~40 (4%) |

Writes only happen when a gig is genuinely new, so an idle day costs nothing.

## If something fails

- `wrangler: command not found` → use `npx wrangler` (as above).
- Login won't open → run `npx wrangler login --browser=false` and paste the URL.
- A source shows `fail` in the report → that board blocked the request. The
  others keep working; tell me which and I'll adjust it.
