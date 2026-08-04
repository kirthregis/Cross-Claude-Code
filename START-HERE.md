# Start here

## 🟢 Easiest: you don't need the app at all

Open the **[`pack/`](pack/)** folder in this repo. Everything is already
generated as documents you can read and copy:

- **1-RATE-CARD** — what to charge, per venue type, with every adjustment
- **2-PITCH-SCRIPTS** — WhatsApp / Instagram / email pitches, ready to send
- **3-NEGOTIATION** — every objection and the reply
- **4-CONTRACT** · **5-INVOICE** · **6-RUNSHEET** · **7-PRESS PACK**

Nothing to install. Start there.

---

## 🚀 Want it live on her phone? One click, no terminal

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fkirthregis%2FCross-Claude-Code%2Ftree%2Farena%2F019fcd29-cross-claude-code)

1. Click the button, sign in with GitHub, click **Deploy**. Wait ~2 minutes.
2. You get a URL like `https://gigradar-xyz.vercel.app`.
3. Open it on her phone → **Share → Add to Home Screen**.

Pages: `/` is the gig list · `/profile` is rates + EVG details + PDF upload ·
`/sources` is alert setup.

To switch on WhatsApp/email alerts, add the environment variables (below) under
**Settings → Environment Variables** in Vercel, then **Redeploy**.

> Note: Vercel resets its filesystem on each deploy, so saved data won't
> persist there. For permanent storage add Vercel Postgres — only
> `src/lib/db.ts` needs changing. Running locally persists fine.

---

## Option A — run it on your own laptop (10 minutes, free)

Everything works locally: paste in gigs, get prices, generate contracts, upload
the licence and bank PDFs. Alerts to her phone need Option B.

### 1. Install Node.js
Download the **LTS** version from <https://nodejs.org> and install it.

### 2. Get the code
Open **Terminal** (Mac: ⌘+Space → "Terminal") or **PowerShell** (Windows), then
paste these one line at a time:

```bash
git clone https://github.com/kirthregis/Cross-Claude-Code.git
cd Cross-Claude-Code
git checkout arena/019fcd29-cross-claude-code
npm install
npm run seed     # loads example gigs so it isn't empty
npm run dev
```

### 3. Open it
Go to **<http://localhost:3001>** in your browser.

That's the dashboard. The pages are:

| Page | What it's for |
|---|---|
| <http://localhost:3001> | All gigs, ranked. Paste a new one into the box at the top. |
| <http://localhost:3001/profile> | **← this is "/profile"** — rates, EVG details, upload the PDFs |
| <http://localhost:3001/sources> | Which feeds are switched on |

**To upload the licence and bank statement:** go to `/profile`, top section
says *"Import from documents"*, choose the two PDFs, click **Read files**,
check what it found, then **Save these values**.

Stop the app any time with `Ctrl + C`. Start it again with `npm run dev`.

---

## Option B — put it online so alerts reach her phone (20 minutes)

Free on Vercel.

1. Go to <https://vercel.com>, sign up with GitHub.
2. **Add New → Project**, pick `Cross-Claude-Code`, set the branch to
   `arena/019fcd29-cross-claude-code`, click **Deploy**.
3. You get a URL like `https://gigradar.vercel.app`. Open it on her phone,
   then **Share → Add to Home Screen**. It behaves like a real app.

Then add the alert settings under **Settings → Environment Variables**
(see the next section), and redeploy.

> One caveat: Vercel's filesystem resets on each deploy, so the SQLite database
> won't persist there. For a permanent setup use a Postgres add-on (Neon or
> Vercel Postgres) — `src/lib/db.ts` is the only file that needs changing.
> Running locally (Option A) persists fine.

---

## Alerts: WhatsApp + email (not Telegram)

You said she lives in WhatsApp, Instagram and email. Here's the honest position
on each:

### ✅ WhatsApp — the main channel
Uses Meta's official WhatsApp Cloud API.

1. Go to <https://developers.facebook.com> → **Create App** → **Business**.
2. Add the **WhatsApp** product. Meta gives you a test number free.
3. Copy the **temporary access token** and the **Phone number ID**.
4. Add her number as a recipient in the WhatsApp panel and verify it.
5. Set these environment variables:

```
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_ID=123456789012345
WHATSAPP_TO=971506607743
```

⚠️ Two real constraints, so you aren't surprised:
- The test token expires every 24 hours. For production, create a **System
  User** in Business Settings and issue a permanent token.
- Meta only allows free-form messages within **24 hours** of her last reply to
  the number. Outside that window you need an approved **message template**
  (a day or two to approve). Once you have one, set `WHATSAPP_TEMPLATE` to its
  name. Practical workaround in the meantime: if she replies to any alert, the
  window reopens for 24h.

### ✅ Email — easiest, works immediately
1. Sign up at <https://resend.com> (free tier is plenty).
2. Create an API key.

```
RESEND_API_KEY=re_...
ALERT_EMAIL_TO=admin@emyvisiongroup.com,mannaiiman1@gmail.com
```

### ❌ Instagram — not possible, and I won't fake it
Meta does **not** permit sending unsolicited DMs to your own account through
the API. Any service claiming to do this uses unofficial automation that
routinely gets Instagram accounts restricted or banned. Her account is a
business asset — not worth the risk.

**What we do instead:** Instagram is still one of the best *sources* of gigs.
Gigs found there are alerted over WhatsApp/email, with a one-tap link straight
into the Instagram thread so she can reply in the app as normal.

---

## What she'll actually receive

```
URGENT GIG (100/100)

Cove Beach
Saturday 14 September · Dubai Marina
2.0h · peak slot

Ask AED 8,750  (target 7,000, floor 5,000)
They said AED 6,500

Via Dubai Promoters Group

WhatsApp the booker: https://wa.me/971504421188?text=Hi%20Karim...
View original post: https://instagram.com/p/...
Full deal + contract: https://your-app.vercel.app/gig/abc123
```

Tapping "WhatsApp the booker" opens WhatsApp with the pitch already written,
addressed to the right person. She reads it, adjusts if she wants, hits send.

Overnight gigs (02:00–09:00 Dubai) are held and sent as one morning briefing,
unless they're urgent.

---

## If you get stuck

- `npm: command not found` → Node.js isn't installed, redo step 1.
- Port already in use → something else is on 3000; run `npm run dev -- -p 3001`
  and use <http://localhost:3001>.
- Page won't load → make sure the terminal still shows the app running; it
  stops when you close the window.
