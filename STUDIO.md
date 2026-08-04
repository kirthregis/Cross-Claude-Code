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

## First-time setup (5 minutes, one time)

1. **Add a free Gemini key** (optional but recommended)
   - Go to <https://aistudio.google.com/apikey> with her Google account.
   - Create an API key (free tier, no card).
   - Paste it in **Studio → Settings → AI — Gemini** and hit **Test connection**.
   - This unlocks: AI cover design, open-ended assistant answers, AI writing.
   - Without a key everything else still works (voice commands, mastering,
     templates, release pack, checks).

2. **Fill in her handles** in Settings (Instagram, TikTok, YouTube, artist name)
   — used in every release title/description/file name. Pre-filled with her
   real ones, so this is just a check.

3. **Install as an app** on the phone: open the app in Chrome → menu →
   **Add to Home Screen**. On the laptop: the install button in Settings.

4. **Email ping (optional):** when a master finishes, the studio can email her.
   Needs two environment variables (see "Email pings" below). Without it, the
   in-app ping and phone notification still fire.

---

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

- **AI cover** (needs Gemini key): the prompt is pre-filled from the project's
  name/genre/mood — tweak it, press Generate, preview, save. Output is
  re-framed to exactly **3000×3000**.
- **Offline templates** (no internet needed): Afro Heat, Midnight Gold, Neon
  Bloom, Deep Teal, Vinyl Classic — rendered at full 3000×3000 with her title
  and name set in, downloadable as JPEG or PNG.
- Everything saves to the project and appears in the release check.

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
npm run dev      # open http://localhost:3000/studio
npm test         # 154 tests, incl. the studio suite
npm run build
```

Deploy free on Vercel (the app is a Next.js PWA; see the main README).

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
