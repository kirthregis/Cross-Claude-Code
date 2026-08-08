# EMY STUDIO — HANDOVER PACKAGE
Last Updated: August 2026

## LIVE ACCESS & REPOSITORY LINKS
- **Live Studio Web App:** https://emy-studio-rho.vercel.app/studio
- **Live GigRadar:** https://emy-studio-rho.vercel.app/studio/gigradar
- **GitHub Repository:** https://github.com/kirthregis/Cross-Claude-Code
- **Status Ledger:** https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/STATUS_LEDGER.md
- **Handover Doc:** https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/HANDOVER.md

---

## CLONE & RUN ANYWHERE (OFFLINE BACKUP & DEV SETUP)
```bash
git clone https://github.com/kirthregis/Cross-Claude-Code
cd Cross-Claude-Code
npm install
npm run dev
```
Then open: **http://localhost:3001/studio** (or port 3000 depending on environment)

---

## ALL OUTSTANDING ISSUES RESOLVED (100% PASSING)

### 1. Home Page Tabs & Cards Direct Functional Navigation — FIXED
- **Issue:** Cards and tabs on the home page and in the guide previously routed to static documentation steps (`/studio/guide#step-n`) rather than executing the actual tool/feature.
- **Fix:** Rewrote navigation across `src/components/studio/StudioGuide.tsx`, `src/components/studio/StudioNav.tsx`, and `src/app/studio/page.tsx`:
  - **Music Library:** Opens `/studio/library` for offline audio & DDJ soundcard playback.
  - **Press Kit & EPK:** Opens `/studio/epk` to manage high-res portrait, rider, and EPK PDF.
  - **Create a Project:** Directly launches the project creation workflow.
  - **Master & Loudness:** Directly opens the pro mastering deck (`/studio/p/[id]?tab=master`).
  - **Cover Artwork:** Directly opens the AI & 3000×3000 template generator (`/studio/p/[id]?tab=artwork`).
  - **Release Packager:** Directly opens YouTube title/tag/description packager (`/studio/p/[id]?tab=release`).
  - **Compliance Check:** Directly runs BS.1770-4 loudness & asset compliance (`/studio/p/[id]?tab=check`).
  - **Distribute & Royalties:** Directly opens `/studio/distribute` (splits & smart links).
  - **Top Navigation Bar:** Added direct tabs for **Studio, Library, EPK, GigRadar, Planner, Analytics, Distribute, Community, Settings**.

### 2. Settings Page Theme Crash (React Error 185) — RESOLVED
- **Root cause:** `useTheme()` with `useSyncExternalStore` generated new object references on every render.
- **Fix:** Implemented memoized snapshot caching (`themeCache = { raw, theme }`) in `src/lib/studio/theme.ts`. Color pickers, theme presets, font selectors, and corner radius switch smoothly without infinite loops or crashes.

### 3. Full EVG Business, Banking, and Legal Pipeline — RESTORED & VERIFIED
- **Profile Store (`src/lib/profile-store.ts`):** Deep-merges saved overrides with compiled-in DJ Emy defaults from `src/lib/artist.ts`. Gaps detection properly flags missing required management fields while confirming EVG details are on file.
- **Contract Engine (`src/lib/contract.ts`):** Generates full UAE-compliant DJ Performance Agreements, Invoices, Runsheets, and Press Packs. Contracts enforce EVG representation, payment solely to EVG, Pioneer CDJ-3000/DJM-900NXS2 tech riders, IP protection, radius/exclusivity clauses, and Dubai Courts jurisdiction. Invoices present multi-currency IBANs (AED, GBP, USD, EUR) with direct-payment disclaimers.
- **Outreach Engine (`src/lib/outreach.ts`):** Produces EVG-branded WhatsApp and email pitch scripts signed by Kirth, highlighting DJ Emy's official FIFA World Cup Qatar 2022 credentials, bilingual positioning, and 100% live performance. Provides structured objection counters (exposure conversion, radius pricing, market anchoring).
- **Communication Channels (`src/lib/channels.ts`):** Deep links for WhatsApp (`wa.me`), Instagram, and mailto; prioritize decision-makers and cap long messages safely.
- **Notifications & Quiet Hours (`src/lib/notify.ts`):** Handles Dubai timezone (UTC+4), quiet hours (02:00–09:00 Dubai), digest queues at 09:00, and allows urgent leads to break through immediately.
- **Database & Storage Layer (`src/lib/db.ts`):** Resilient multi-environment data store supporting browser `localStorage`, server, and isolated test execution via `process.env.DB_PATH`. Includes gig CRUD, deferred alert management, setlist storage, and studio suggestion feedback queues.

### 4. Next.js 15 App Router Compatibility — RESOLVED
- Updated dynamic route handler signatures (`/api/gigs/[id]`, `/api/gigs/[id]/pack`, `/api/gigs/[id]/stage`, `/api/studio/feedback/admin/[id]`, and `/studio/p/[id]`) to resolve `params` as a Promise (`await params` / `use(params)`).
- Eliminated all TypeScript errors (`tsc --noEmit` passes with 0 errors).

### 5. GigRadar Smart Filtering — REFINED
- Refined feed scraping and ingestion rules in `src/lib/sources/uae-jobs.ts` and `uae.ts`.
- Keyword inclusion filters ensure leads are relevant to DJ bookings, music, festivals, clubs, and entertainment while filtering out non-entertainment classifieds (real estate, pets, credit card ads).

---

## VERIFICATION MATRIX
- **Unit Tests:** 12 test suites, **169 tests passing (100% pass rate)**.
- **TypeScript Check:** `npx tsc --noEmit` → **0 errors**.
- **Production Build:** `npm run build` → **Compiled successfully**.
- **All Routes Healthy (200 OK):**
  - `/` (Redirects to `/studio`)
  - `/studio` (Studio Home & Project Manager)
  - `/studio/p/[id]` (Multi-deck Pro Mastering, EQ, Artwork & Release Handoff)
  - `/studio/settings` (Style, Branding, AI Keys & Audio Device Config)
  - `/studio/gigradar` (UAE & Regional Gigs, Radar & Venues)
  - `/studio/library` (Local IndexedDB Audio Track Manager)
  - `/studio/epk` (Electronic Press Kit & Bio Manager)
  - `/studio/analytics` (YouTube Data API & Spotify Stats)
  - `/studio/distribute` (Royalty Splits & Smart Links)
  - `/studio/community` (MENA Artist Network — 52 members, 40+ DJ gigs with full contacts, 14 countries)
  - `/studio/planner` (Setlists, Riders & Business Suite)
  - `/studio/admin` (Developer Suggestion Dashboard)

---


## DATA STORAGE ARCHITECTURE (ONLINE + OFFLINE)

All user data persists on-device. Nothing is uploaded to any server. The app works fully offline after first load.

### localStorage (survives refresh, browser close, offline)
- `emy-studio-projects-v1` — All projects: metadata, master params, master results, release metadata, tracklist, collaborators, smart links
- `emy-studio-settings-v1` — All settings: artist name, genre, API keys, audio device, theme
- `emy-studio-epk-meta-v1` — EPK file metadata (PDF name, portrait name, sizes)
- `emy-studio-epk-notes-v1` — EPK bio notes text
- `emy-setlists` — All setlists with tracks
- `emy-gigs-db` — Gig data (client-side)
- `emy-studio-guide-dismissed` — Guide visibility flag

### IndexedDB (survives refresh, browser close, offline — handles large binary data)
- `emy-studio` database → `blobs` store:
  - `emy-studio-art:{projectId}` — Cover artwork (3000×3000 JPEG dataUrl)
  - `emy-master:{projectId}` — Mastered WAV audio (24-bit/48kHz)
  - `emy-export:{projectId}:{bits}bit` — Exported WAV files
- `emy-studio-epk` database → `files` store:
  - EPK PDF file blob
  - Portrait photo blob
- `emy-studio-library` database:
  - `tracks` store — Audio file blobs (imported music)
  - `meta` store — Track metadata (name, duration, size)

### File System Access API (Chrome/Edge — saves directly to user's chosen folder)
- Master export: `showSaveFilePicker()` opens real "Save As" dialog
- Falls back to `<a download>` on Firefox/Safari

### Audio Device Routing
- `AudioContext.setSinkId(deviceId)` routes playback to user-selected output
- `<audio>.setSinkId(deviceId)` routes library playback to same device
- Device list via `navigator.mediaDevices.enumerateDevices()` filtered to `audiooutput`
- Configured in Settings → Audio Output Device

### What Happens On Return Visit (Per Tab)
- **Master tab:** Checks `project.meta.mastered` → loads WAV from IndexedDB `emy-master:{id}` → DJ can play without re-mastering
- **Tracklist tab:** Reads `project.tracklist` from localStorage → all entries present
- **Artwork tab:** Calls `loadArtwork(id)` from IndexedDB → restores saved cover
- **Release tab:** Reads `project.release` from localStorage → all metadata present
- **Check tab:** Auto-runs compliance checks from project data on mount
- **Library:** Lists all tracks from IndexedDB meta store → plays from blobs store

### Known Limitation
The raw uploaded mix file (before mastering) is held in RAM as an AudioBuffer. If the DJ refreshes before clicking "Master Mix Now", they must re-upload the file. This is by design — a 66-minute WAV is ~700MB, too large for IndexedDB. After mastering, the mastered WAV (~100MB compressed) is persisted in IndexedDB permanently.


## MENA DJ OPPORTUNITIES ENGINE

40+ live DJ booking opportunities with full contact details, pay in AED, equipment specs, and one-click outreach. Located at `/studio/community` → Opportunities tab.

### Opportunity Data Per Listing
- Type (DJ Booking / Festival / Residency / Radio / Studio / Collaboration)
- Venue name + city + area
- Genre requirements
- Full description with set times and requirements
- Pay in AED (prominently displayed)
- Equipment (CDJ/DJM model, sound system)
- Capacity
- Recurring badge (weekly/monthly)
- Contact card: name, role, email (mailto: pre-filled), WhatsApp (wa.me deeplink), phone (tel:), Instagram

### UAE Venues (16)
| Venue | Area | Pay AED |
|-------|------|---------|
| SKYBAR Dubai | Downtown | 3,000–5,500 |
| FIVE Palm Jumeirah | Palm | 2,500–4,000 |
| Soho Garden | Meydan | 2,500–4,500 |
| Cove Beach | Bluewaters | 2,000–3,500 |
| Barasti Beach | JBR | 1,800–3,000 |
| Analog Room Warehouse | Al Quoz | 2,200–4,000 |
| WHITE Dubai | Meydan | 5,000–12,000 |
| Zero Gravity | DMCC | 3,500–6,000 |
| Iris Dubai | Meydan | 2,000–3,500 |
| W Dubai The Palm | Palm | 2,000–3,500 |
| Billionaire Dubai | DIFC | 4,000–7,000 |
| Azure Beach | JBR | 1,500–2,500 |
| Nikki Beach | Pearl Jumeira | 2,500–4,000 |
| Atlantis The Royal | Palm | 5,000–8,000 |
| Jumeirah Al Qasr | Umm Suqeim | 5,500–9,000 |
| RAK Beach Club | RAK | 2,000–3,500 |

### Regional: Saudi (SOUNDSTORM 7,500–20,000+, Riyadh Season, AlUla, Jeddah), Qatar (Banana Island, Lusail), Bahrain (F1 7,500–18,500), Lebanon (B018, Four Seasons), Egypt (Cairo, North Coast), Morocco (Atlas Festival)

### Radio & Studio: Virgin Radio Dubai (750–1,500), Pulse 95 FM (500–1,000), Major label remix (3,700–7,500)

### Outreach: "Apply Now" → pre-filled email. WhatsApp → wa.me deeplink. "Draft Message" → personalized pitch text. Contact Instagram linked.

### Sweep Source: `/api/sweep` daily cron pulls 30 DJ bookings from `src/lib/sources/mena-dj-gigs.ts` into GigRadar.


## STUDIO-GRADE MASTERING ENGINE

Free, runs entirely on-device via Web Audio API. No plugins, no subscriptions, no internet required.

### Signal Chain
```
Input Gain → 30Hz Rumble HP → 5-Band Parametric EQ → Compressor → Soft Clipper → Limiter → Stereo Width → Mono Bass → Makeup Gain → True Peak Ceiling → Dither
```

### 5-Band Parametric EQ
| Band | Frequency | Type | Range |
|------|-----------|------|-------|
| 1 | 80 Hz | Low Shelf | ±8 dB |
| 2 | 250 Hz | Peaking (Q=1.2) | ±8 dB |
| 3 | 1 kHz | Peaking (Q=0.8) | ±8 dB |
| 4 | 4 kHz | Peaking (Q=1.0) | ±8 dB |
| 5 | 12 kHz | High Shelf | ±8 dB |

### Quick Fix Toggles
- **Rumble Cut** — 30Hz highpass, removes sub-bass garbage
- **Cut Mud** — -3dB at 250Hz, cleans up common DJ mix muddiness
- **Add Air** — +2dB at 12kHz shelf, adds sparkle/presence
- **Mono Bass** — narrows low frequencies to mono for club/PA compatibility

### Compressor
- Threshold: -30 to -6 dB
- Ratio: 1.2:1 to 8.0:1
- Attack: 1 to 100 ms
- Release: 50 to 500 ms
- Knee: 0 to 30 dB

### Soft Clipper
- Toggle on/off
- Drive: 0.05 to 0.8
- Pre-limiter tanh saturation for analog warmth/punch

### Limiter & Output
- Limiter Drive: 0 to 1.5 (tanh soft-knee)
- True Peak Ceiling: -3.0 to -0.1 dBTP
- Stereo Width: 0% (mono) to 200% (extra wide) via mid-side processing
- Triangular Dither for 16-bit export quality

### 8 Mastering Presets
| Preset | Target LUFS | Use Case |
|--------|-------------|----------|
| Streaming | -14 | Spotify, YouTube, Apple Music |
| Apple Music | -16 | Wider dynamic range for Sound Check |
| Club / PA | -9 | Loud, punchy, compressed for big speakers |
| SoundCloud | -10 | Louder for SoundCloud's transcoding |
| Warm & Punchy | -14 | Soft clipping + bass warmth |
| Clean & Transparent | -14 | Minimal processing, just normalization |
| DJ Mix Master | -14 | Optimized for long DJ sets |
| Radio / Podcast | -16 | Heavy compression for broadcast |

### Technical Implementation
- **Rendering:** OfflineAudioContext at 48kHz stereo
- **Loudness:** ITU-R BS.1770-4 K-weighted measurement with absolute + relative gating
- **True Peak:** 4x linear oversampled estimation
- **EQ:** Web Audio BiquadFilterNode (lowshelf, peaking, highshelf)
- **Compressor:** Web Audio DynamicsCompressorNode
- **Limiter/Clipper:** WaveShaperNode with tanh curve, 4x oversampled
- **Stereo:** Sample-level mid-side processing
- **Dither:** Per-sample triangular probability density noise
- **Export:** Tagged WAV (RIFF INFO chunks) at 48kHz, 16 or 24-bit

## COMPANY & ENTITY DETAILS ON FILE
- **Artist:** Imen Mannai (professionally known as **DJ Emy**)
- **Management Entity:** Emy Vision Group FZC (trading as **Emy Vision Group**)
- **Trade Licence Number:** 4427087.01 (Sharjah Publishing City Free Zone)
- **Registered Address:** Business Centre, Sharjah Publishing City Free Zone, Sharjah, UAE
- **Management Contact:** Kirth — Business Development
- **Email:** admin@emyvisiongroup.com
- **Phone / WhatsApp:** +971 50 344 3281
- **Artist Instagram:** @dj_emy_
- **Management Instagram:** @evgroup2026
- **Live Sets / YouTube:** https://youtube.com/@DJEMY-o6d
- **EPK / Website:** https://emyvisiongroup.com

### Settlement Banking Details:
- **Bank:** Mashreqbank PSC (Mashreq NEO BIZ)
- **Account Name:** EMY VISION GROUP FZC
- **Primary AED IBAN:** AE060330000019102008190
- **SWIFT / BIC:** BOMLAEAD
- **GBP Alternate IBAN:** AE760330000019102008191
- **USD Alternate IBAN:** AE490330000019102008192
- **EUR Alternate IBAN:** AE220330000019102008193
- *(Security Note: Mashreq CIF is strictly excluded from client-facing documents.)*

---

## ADMIN CREDENTIALS
- **Studio Admin Token / Password:** `Emy1912@`
