# EMY Studio — DJ Emy's production studio

> The whole post-mixing pipeline in one app: **master the mix → design the
> cover → package the release → pass the platform checks → hand off to
> YouTube**. Runs on her laptop **and** her phone, **offline and online**, and
> she can talk to it instead of clicking around.

Open it at **`/studio`** after starting the app, or from the phone:
**Add to Home Screen** (Chrome/Edge/Safari) → it installs like a real app,
with its own icon and offline support.

---

## The flow (matches how she already works)

```
finished mix (mp3/wav/m4a…)
        │
        ▼  Master tab        ← EQ, compression, limiting, loudness to -14 LUFS,
        │                       rendered ON THIS DEVICE (works with no internet)
        ▼  Export WAV        ← 48 kHz, 16/24-bit, tags embedded, loudness-normalized
        │
        ▼  Artwork tab       ← Gemini-designed cover (online) or offline templates
        │                       3000×3000, platform-perfect
        ▼  Release tab       ← title, description, tags, category — all platform limits baked in
        │
        ▼  Check tab         ← PASS/WARN/FAIL report for YouTube, Instagram, or a label
        │
        ▼  Handoff           ← export WAV + cover, open YouTube Studio, paste, upload
```

Nothing leaves her device: audio is processed in the browser, artwork is
stored on the device, her Gemini key stays on the device.

---

## Talk to the studio from anywhere + her identity

- **Global voice assistant**: a floating 🎙 button sits on EVERY page (gigs,
  studio, library, EPK, settings). She taps it anywhere, says what she needs
  ("open the library", "master my mix", "open my EPK") and it navigates her —
  no need to be on the home screen.
- **Home cards are live**: Master / Cover art / Release-ready open the right
  tab of her most recent project (or prompt to create one).
- **Cover engine choice**: the Artwork tab shows Gemini vs fal.ai as two clear
  options with connection status. fal.ai runs through her API key — the cover
  generates without ever logging into the fal.ai website.
- **EPK tab** (`/studio/epk`): she uploads her own press kit — EPK file
  (PDF/text/image) + portrait photo — stored on-device, view/download/replace
  anytime, plus optional quick notes. Her real EPK is the file she uploads
  (nothing hardcoded).
- **Identity in artwork**: a "Desert Gold" template (crescent over dunes) and
  the AI cover prompt weaves in her heritage (Tunisia → Qatar, desert gold,
  geometric North African patterns).

## Style & Branding — make it hers

Settings → **Style & branding** lets her re-skin the whole app with no code:
- **Preset themes** (Midnight, Desert Gold, Rose, Emerald, Ocean, Violet,
  Sunset, Mono) or fully **custom colors** — brand gradient (primary →
  accent), background (custom + 8 dark presets).
- **Font**: Inter, Poppins, Montserrat, Space Grotesk, Playfair, system or
  mono — Google Fonts load when online, fall back gracefully offline.
- **Corners**: sharp / soft / pill. **Logo**: upload her own (replaces the
  "E" mark in the nav), remove anytime. **Live preview** + reset to default.
- Applied instantly app-wide via CSS variables (buttons, nav, headings, mic,
  cards, sliders) and stored on-device.

## Music library, DJ-controller audio & one-tap sharing

- **Library tab** (`/studio/library`): import her tracks (files or whole
  folders — Chrome/Edge), stored on-device in IndexedDB, play them with a
  built-in player. Free legal sources are built in: Internet Archive
  netlabels (searchable right in the page, studio-quality CC electronic
  music), Free Music Archive, Bandcamp pay-what-you-want, SoundCloud
  downloads, Hypeddit + LabelRadar DJ promos. No ripping tools — latest
  commercial tracks "for free" isn't legal, and the app doesn't fake it.
- **Audio output** (Settings → Audio output): route playback (library +
  master A/B preview) to any device, e.g. the DDJ-800's sound card when
  plugged in via USB. Full deck mixing (jog wheels) is Rekordbox's job —
  the studio can't replace that, but listening/previewing through the
  controller works.
- **Share row** in the Release tab: one-tap buttons to YouTube (Studio),
  Instagram, TikTok, Snapchat and Threads.

## GigRadar is in the same app

The gig engine (find → score → price → pitch → contract → invoice) is the
app's home page `/`; the nav has a **💼 Gigs** button and the studio home
links to it. Data is shared (same SQLite DB), so bookings and releases live
side by side. Restore any milestone via the git tags in **SNAPSHOT.md**.

## Developer setup — what's actually yours

**`DEV-SETUP.md`** is the complete list: **2 required items** (a free Gemini
key + an admin token) and a few optional ones. Run `npm run devcheck` after
each step — it prints exactly what's left. The app works fully for her even
before that (mastering, templates, release pack, checks, voice commands,
distribute); the key and token unlock AI chat/artwork and your back end.

Two ways the app can run:

### A) Developer mode — hand her a finished app (recommended)

You configure everything **once on the server** (env vars), and the app is
fully functional the moment she opens it — she never pastes a key or sees a
setting she doesn't need. Keys live **server-side only** (proxy routes in
`src/app/api/studio/ai/*`) — they never ship in the browser bundle. Set them
in Vercel → Settings → Environment Variables (or `.env.local` on her laptop)
and redeploy.

### B) Personal mode — she pastes her own key

If she runs it on her own laptop without a server config, she can paste a
free Gemini key in **Studio → Settings**. Keys are stored only on that
device. Everything else works identically.

### Either way, once:

- **Install as an app** on the phone: open the app in Chrome → menu →
  **Add to Home Screen**. On the laptop: the install button in Settings.
- Email ping (if wanted) needs the two `RESEND_*` vars — without it, the
  in-app ping and phone notification still fire.

---

## How to use it — the 6 steps (also shown in the app)

The home screen opens with a **"How to use EMY Studio"** card, and the full
walkthrough lives at **`/studio/guide`** (nav → How to):

1. **Create a project** — name it, pick Mix or Track (or say it to the assistant).
2. **Import & master** — drop the finished mix into the Master tab, pick a target
   (-14 LUFS for YouTube/Spotify), hit Master. It pings when done; export the 48 kHz WAV.
3. **Make the cover** — AI (Gemini or fal.ai) or offline templates, always 3000×3000.
4. **Build the release pack** — one tap writes title/description/tags within platform limits.
5. **Check it's ready** — PASS/WARN/FAIL report like a label would run.
6. **Get it out there** — the Distribute page lists every free site to push it.

Each step shows the voice command that jumps straight to it, and the assistant
sits on the home screen to set each one up.

## Suggest an improvement — she speaks, the app plans, you build

There's a **"Make EMY Studio better"** box at the bottom of the studio home:

- She types or **speaks** a suggestion (voice button included).
- The app logs it, categorises it (feature / bug / design / content), drafts an
  implementation plan — AI-written if `GEMINI_API_KEY` is set, smart fallback
  otherwise — and replies with a confirmation that includes the plan.
- She sees her suggestions with a status: **Received → Planned → Done**.
- **You see everything**: every suggestion lands in the SQLite database and is
  visible at **`/studio/admin`** (locked by `STUDIO_ADMIN_TOKEN` — set it in env
  or the page stays locked). From there you mark items planned/done/dismissed,
  and her device shows the new status. Optionally you also get an **email per
  suggestion** with the AI plan (set `DEV_FEEDBACK_TO`).

**Routing to your workspace:** on local/dev runs (this repo's own database),
read and action everything right here:

```bash
npm run inbox                    # every suggestion, newest first
npm run inbox -- --status=new    # only unreviewed ones
npm run inbox -- --json          # machine-readable
npm run inbox -- --mark <id> done   # flip a status; her device updates live
```

The developer loop: she sends a suggestion → it lands in the database →
you run `npm run inbox`, pick it up, implement, mark it done → she sees
"Done ✓" in the app.

> Honest note: "the app improves itself" = the app captures, analyses and plans
> every request and routes it to you; you ship the change, and she watches it
> flip to Done. That's the loop — nothing writes code by itself.

## Talking to the studio (voice or text)

On any page, the **Assistant** panel is her engineer + designer + release
manager. Tap **🎙 Talk** (Chrome/Safari) or type:

| She says | It does |
|---|---|
| "Create a new mix project" | Starts a project |
| "Create a project called Summer Mix" | Starts it with that name |
| "Master my mix" | Opens the Master tab with instructions |
| "Make the cover art" | Opens the Artwork tab |
| "Build the release pack" | Writes title/description/tags |
| "Is it ready?" | Runs the full compliance check |
| "What's left to do?" | Summarises where the project stands |
| "Open my projects" | Goes to the project list |
| anything else | With a Gemini key it answers; without one it points her to a command |

The assistant **speaks back** (toggleable in Settings) and, when a master
finishes or an export is ready, **pings her** on-device and (if enabled) by
email — so she can walk away and come back when it's done.

---

## Mastering — what "the engineer" does

- Import her mix (drag & drop or tap). MP3, WAV, M4A, FLAC, AAC, AIFF.
- **A/B preview**: listen to Original vs Processed through the actual chain.
- Real controls she can touch, plus presets:
  - **YouTube/Spotify** → -14 LUFS (what her channel and the stores expect)
  - **Apple Music** → -16 LUFS
  - **Club/Label** → -9 LUFS, louder for a big system
  - **Gentle** → just normalise
- The chain: 30 Hz rumble filter → low shelf → mids → air shelf → compressor
  → soft-knee limiter → loudness normalise → true-peak ceiling (-1 dBTP).
- Renders on-device, in chunks, so even a 66-minute set works — a progress
  bar shows the way and she gets pinged when it's done.
- **Export**: 48 kHz WAV, 16-bit (smaller) or 24-bit (label-ready), with
  title/artist/genre **embedded in the file's tags**.

> 💡 One honest note: a full-length set is heavy. On a phone, very long mixes
> (60+ min) may be tight on memory; on a laptop it's comfortable. The app
> warns before it tries.

---

## Artwork — what "the designer" does

- **AI cover**: the prompt is pre-filled from the project's name/genre/mood —
  tweak it, press Generate, preview, save. Output is re-framed to exactly
  **3000×3000**. Two engines, switchable in the Artwork tab (and Settings):
  - **Gemini** — free tier (developer key or device key).
  - **fal.ai** — top open image models (Flux Dev, Flux Pro, Recraft V3 for
    text-heavy design, Ideogram V2) via a fal.ai key (pay-per-image, free
    credits on signup). Best quality for typography-heavy covers.
- **Offline templates** (no internet needed): Afro Heat, Midnight Gold, Neon
  Bloom, Deep Teal, Vinyl Classic — rendered at full 3000×3000 with her title
  and name set in, downloadable as JPEG or PNG.
- Everything saves to the project and appears in the release check.

## Get it out there — free

**`/studio/distribute`** in the app links the top free places to push music
(checked 2026): RouteNote / FreshTunes / ONErpm / UnitedMasters / SoundOn to
land on Spotify & Apple; SoundCloud / Mixcloud / HearThis / **1001Tracklists**
to host and discover mixes; **LabelRadar** to submit tracks to Afro House &
House labels for free; plus the social push. Full guide in **`DISTRIBUTION.md`**.

---

## Release pack — what "the manager" does

One tap writes:

- **Title** — e.g. `Afro House Mix 2026 | DJ EMY` (auto-truncated to
  YouTube's 100-char limit)
- **Description** — the same structure her channel already uses (genre line,
  like/comment/subscribe, Instagram + TikTok links)
- **Tags** — genre tag + her standard set, capped under 500 chars
- **Category** (Music), **Made for kids** (No), **Visibility** — all editable
- **File names** — `DJ_EMY_Afro_House_Mix_2026_48kHz_24bit.wav` style, so a
  label gets clean deliverables
- **Copy all for upload** → paste straight into YouTube Studio.

---

## Check — "is it ready?" before she uploads

Runs the same review a platform or label would:

- Audio loaded? Sample rate 48 kHz? Duration sane?
- Loudness at target (-14 LUFS for YouTube/Instagram, -16 Apple)?
- True peak under -1 dBTP (no clipping after YouTube re-encodes)?
- Artwork 3000×3000, under 20 MB?
- Title ≤ 100 chars, description ≤ 5000, tags ≤ 500?

Every FAIL tells her exactly what to fix and where. Green checkmarks = the
files are in the right format and will upload without friction.

---

## Handoff to YouTube (v1: upload-ready, not auto-upload)

Export the master WAV → download the cover → **Open YouTube Studio** →
paste title/description/tags → upload the WAV, set the thumbnail. Everything
is already in the format YouTube wants.

Real one-tap auto-upload (Google OAuth) is the planned next step — she
approves once and the studio publishes straight to her channel, then pings
her. It needs ~10 minutes of setup in Google Cloud for a client ID.

---

## Offline vs online — the honest breakdown

| Feature | Offline (no internet) | Online |
|---|---|---|
| Voice + text assistant commands | ✅ works (local brain) | ✅ + Gemini answers |
| Open-ended AI chat | — | ✅ with key |
| Mastering + WAV export | ✅ full | ✅ full |
| Artwork templates | ✅ full | ✅ full |
| AI cover generation | — | ✅ with key |
| Release pack + checks | ✅ full | ✅ full |
| Email ping when done | — | ✅ if configured |
| YouTube handoff | ✅ (open YouTube Studio when back online) | ✅ |

---

## Email pings (optional)

Add to `.env.local` (laptop) or Vercel env vars (hosted):

```env
RESEND_API_KEY=re_...
STUDIO_NOTIFY_TO=me@emyvisiongroup.com
RESEND_FROM=EMY Studio <studio@resend.dev>   # optional
```

Free at <https://resend.com>. Then tick **"Email me when a master / export is
ready"** in Settings. The key never touches the browser.

---

## Project data

- Projects, artwork and settings are stored **on her device** (localStorage +
  IndexedDB). Nothing is uploaded.
- The audio file itself is re-imported each session by design — the app
  processes it in memory and never duplicates a 66-minute file to disk.
- **Reset all studio data** lives in Settings → Danger zone.

---

## Running it

```bash
npm install
cp .env.example .env.local    # developer: set GEMINI_API_KEY / FAL_KEY / RESEND_*
npm run dev                   # open http://localhost:3001/studio
npm test                      # 161 tests, incl. the studio suite
npm run build
```

Deploy free on Vercel (the app is a Next.js PWA; see the main README) — put
the same env vars in Vercel → Settings → Environment Variables and redeploy.
That's the whole handoff: configure once, she opens the URL, it's done.

---

## Roadmap

1. **YouTube auto-upload** via Google OAuth (she approves once) + email/phone
   ping when it's live.
2. **Web Push** notifications so the ping works even when the tab is closed.
3. **Server-side render offload** for very long mixes on phones (browser
   stays free).
4. **Instagram/Reels export** (1080×1080 / 1080×1920 video from the artwork +
   mastered audio).
5. **Label distribution pack** (cover + WAV + metadata spreadsheet) for
   sending to distributors.
