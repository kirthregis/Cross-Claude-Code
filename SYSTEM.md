# EMY STUDIO - COMPLETE SYSTEM LEDGER
# Last Updated: August 2026 - Phase 10

## LIVE URL
https://emy-studio-rho.vercel.app/studio

## GIT REPOSITORY
https://github.com/kirthregis/Cross-Claude-Code

## LATEST COMMITS
- 93bc37c Fix: sweep returns gigs in response and UI saves them to localStorage
- 7c5e430 Phase 10b: Fix ingest loop, sweep result detail, sources tab shows built-in feeds
- c372514 Phase 10: Massively expand GigRadar to 40+ free public internet sources
- fce4a9c Cleanup: permanently ignore .py files
- efd9b60 Fix contract: CDJ-3000 and DJM-900NXS2 now explicit in tech rider clause
- 35a63a0 Phase 9: Full engine rebuild - outreach, contract, profile-store, notify all correct
- 12b879c Phase 8: Full protection - ErrorBoundary + SW v9 + store fix + logo + vercel headers

---

## CORE FILES MAP

### App Pages (src/app/)
- studio/page.tsx (10387 bytes) - Studio home, project list, navigation hub
- studio/p/[id]/page.tsx (502 bytes) - Project page wrapper with Suspense
- studio/p/[id]/client.tsx (9465 bytes) - Project editor, all tabs
- studio/gigradar/page.tsx (29218 bytes) - GigRadar full UI
- studio/planner/page.tsx (28900 bytes) - Rider, stage, setlist, contract, revenue
- studio/settings/page.tsx (25847 bytes) - All settings and API keys
- studio/analytics/page.tsx (16954 bytes) - YouTube and Spotify analytics
- studio/distribute/page.tsx (17131 bytes) - Smart links, royalty splits
- studio/community/page.tsx (14564 bytes) - MENA artist network
- studio/library/page.tsx (15705 bytes) - Music library, Archive.org search
- studio/epk/page.tsx (8734 bytes) - Electronic press kit
- studio/admin/page.tsx (2830 bytes) - Admin panel
- studio/guide/page.tsx (4823 bytes) - Studio guide
- studio/layout.tsx (613 bytes) - Studio layout wrapper
- layout.tsx (1265 bytes) - Root layout with ErrorBoundary, PWA, GlobalAssistant
- page.tsx (1084 bytes) - Root redirect page
- gig/[id]/page.tsx (3417 bytes) - Public gig page
- profile/page.tsx (1352 bytes) - Artist profile page
- sources/page.tsx (2391 bytes) - Sources management page

### API Routes (src/app/api/)
- sweep/route.ts (661 bytes) - Main sweep endpoint, returns gigs in response
- gigradar/route.ts (284 bytes) - Source status
- gigs/route.ts (2020 bytes) - Gig CRUD
- gigs/[id]/route.ts (1148 bytes) - Single gig
- gigs/[id]/pack/route.ts (1100 bytes) - Deal pack generation
- gigs/[id]/stage/route.ts (770 bytes) - Stage update
- ingest/manual/route.ts (1166 bytes) - Manual lead ingestion
- ingest/email/route.ts (1239 bytes) - Email webhook
- ingest/whatsapp/route.ts (1306 bytes) - WhatsApp webhook
- digest/route.ts (881 bytes) - Morning digest
- notifications/route.ts (1339 bytes) - Push notifications
- profile/route.ts (750 bytes) - Profile API
- profile/import/route.ts (2685 bytes) - Document import
- sources/route.ts (303 bytes) - Sources list
- studio/ai/text/route.ts (2593 bytes) - Gemini text
- studio/ai/image/route.ts (6142 bytes) - Gemini/fal image
- studio/feedback/route.ts (779 bytes) - Feedback submission
- studio/feedback/admin/route.ts (324 bytes) - Feedback admin list
- studio/feedback/admin/[id]/route.ts (1206 bytes) - Feedback admin item
- studio/notify/route.ts (758 bytes) - Studio notifications
- studio/status/route.ts (855 bytes) - AI status check

### Components (src/components/)
- ErrorBoundary.tsx (2077 bytes) - Catches all crashes, heals storage
- PwaRegister.tsx (1516 bytes) - SW registration, update banner, storage healing
- GigCard.tsx (590 bytes) - Gig card component
- studio/ArtworkPanel.tsx (14457 bytes) - AI and template artwork
- studio/AssistantPanel.tsx (11020 bytes) - Per-project assistant
- studio/GlobalAssistant.tsx (10256 bytes) - Floating assistant all pages
- studio/ReleasePanel.tsx (11517 bytes) - Release metadata and handoff
- studio/MasterPanel.tsx (6677 bytes) - Audio mastering UI
- studio/CheckPanel.tsx (6153 bytes) - Compliance checks
- studio/FeedbackBox.tsx (6750 bytes) - Feedback submission
- studio/BusinessSuite.tsx (6746 bytes) - Revenue and invoice
- studio/theme.ts (6950 bytes) - Theme system
- studio/NotificationBell.tsx (4446 bytes) - Notification UI
- studio/StudioGuide.tsx (4212 bytes) - Onboarding guide
- studio/DeckUI.tsx (4879 bytes) - DJ deck UI
- studio/speech.ts (5482 bytes) - Voice recognition and TTS
- studio/ui.tsx (4806 bytes) - Design system components
- studio/Waveform.tsx (2159 bytes) - Audio waveform display
- studio/GlobalVoice.tsx (2664 bytes) - Voice control
- studio/StudioNav.tsx (1655 bytes) - Studio navigation
- studio/ThemeProvider.tsx (1226 bytes) - Theme application
- studio/ArabicToggle.tsx (1304 bytes) - Arabic mode toggle
- studio/ProjectCard.tsx (2549 bytes) - Project card

### Core Libraries (src/lib/)
- artist.ts (10231 bytes) - DJ_EMY profile, all rates, tech rider, management, bank details
- active-profile.ts (1287 bytes) - Runtime profile resolver with cache
- profile-store.ts (2543 bytes) - Profile overrides, deep merge, gaps check
- contract.ts (13151 bytes) - Full legal documents: contract, runsheet, invoice, press pack
- outreach.ts (9862 bytes) - Pitch generator, quoteFor, pitchFee, negotiation playbook, contact strategy
- pricing.ts (7562 bytes) - Full pricing engine with multipliers
- score.ts (3986 bytes) - Gig scoring and tier assignment
- extract.ts (11396 bytes) - Lead normalisation, all field extraction
- ingest.ts (3066 bytes) - Sweep pipeline, processLeads, suppress handling
- notify.ts (4041 bytes) - Dubai timezone alerts, quiet hours, digest, buildPlainMessage
- channels.ts (1160 bytes) - WhatsApp and email channel wrappers
- db.ts (8282 bytes) - localStorage database: gigs, alerts, deferred, feedback, setlists
- docparse.ts (7897 bytes) - PDF and document field extraction
- types.ts (2172 bytes) - All shared TypeScript types
- dates.ts (496 bytes) - daysUntil helper
- useFetch.ts (949 bytes) - Fetch hook

### Sources (src/lib/sources/)
- uae.ts (9033 bytes) - 40+ free public feeds
- index.ts (6292 bytes) - All source adapters
- registry.ts (4289 bytes) - Country registry with UAE, Qatar, Saudi, Bahrain, Kuwait, Oman
- uae-jobs.ts (3673 bytes) - UAE job board fetcher

### Studio Libraries (src/lib/studio/)
- dsp.ts (11755 bytes) - Full audio DSP: BS.1770-4 loudness, true peak, biquad, WAV encode
- release.ts (10401 bytes) - Release packaging, compliance checks
- artwork.ts (12641 bytes) - Artwork generation and templates
- assistant.ts (9250 bytes) - Assistant intent routing and replies
- gigradar-ai.ts (11208 bytes) - UAE venue database, pitch email, revenue tracking
- gemini.ts (4508 bytes) - Gemini AI integration
- fal.ts (4933 bytes) - fal.ai image generation
- store.ts (3921 bytes) - Project and settings localStorage store
- types.ts (4893 bytes) - Studio-specific types
- wav.ts (4801 bytes) - WAV file encoder with RIFF metadata
- notifications.ts (5913 bytes) - In-app notifications
- improve.ts (5404 bytes) - Suggestion analysis
- library-store.ts (5023 bytes) - Music library IndexedDB
- epk-store.ts (4453 bytes) - EPK storage
- analytics.ts (8498 bytes) - YouTube and Spotify analytics
- server-ai.ts (2252 bytes) - Server-side AI calls
- server-email.ts (1480 bytes) - Server-side email
- guide.ts (4622 bytes) - Guide content
- business.ts (1207 bytes) - Business calculations
- audio.ts (1605 bytes) - Audio file handling
- speech.ts (5482 bytes) - Speech recognition and synthesis
- id.ts (503 bytes) - ID generation
- store-server.ts (333 bytes) - Server-side store
- admin-auth.ts (741 bytes) - Admin authentication

---

## GIGRADAR SOURCES (40+ FREE, NO API KEY)

### Event Calendars
- Time Out Dubai (whats-on and music RSS)
- Resident Advisor Dubai and Doha
- Platinumlist Dubai x2
- Visit Dubai Official
- Dubai Calendar
- Eventbrite Dubai (DJ, Electronic, Nightlife)
- Meetup Dubai DJ Events

### Job Boards (Booking Intent)
- Indeed DJ Booking Dubai
- Indeed Performer Dubai
- Indeed Nightclub Dubai
- Hozpitality UAE
- GulfTalent Entertainment
- NaukriGulf DJ UAE
- Bayt DJ Booking UAE
- Bayt Entertainment UAE
- Dubizzle DJ Jobs
- Monster DJ Dubai

### Social and Communities
- Nitter/Twitter: DJ booking Dubai, DJ wanted Dubai, looking for DJ Dubai, Afro House DJ Dubai, DJ booking UAE
- Reddit r/DJs: booking UAE Dubai, Afro House gigs
- Reddit r/dubai: dj booking event
- Reddit r/electronicmusic: DJ booking Middle East

### Publications
- What's On UAE
- Esquire ME Entertainment
- Arabian Business Entertainment
- Gulf News Entertainment
- Khaleej Times Entertainment

### Hospitality Industry
- Hospitality Net Middle East
- Caterer Entertainment Dubai
- Total Jobs DJ Dubai

---

## AUTO-SWEEP SCHEDULE

- On page load: if last sweep was more than 6 hours ago
- Vercel cron 1: 05:00 UTC = 09:00 Dubai
- Vercel cron 2: 17:00 UTC = 21:00 Dubai

---

## PROTECTION LAYERS

1. ErrorBoundary: catches React crashes, heals localStorage, shows reload button
2. PwaRegister: heals corrupt JSON in localStorage on every boot
3. Store: memoised cache prevents infinite re-render loops
4. Service worker v9: caches all routes, serves offline shell, clears old caches on activate
5. vercel.json: Cache-Control headers prevent stale SW delivery
6. ingest.ts: suppressed gigs never stored, every gig marked alerted after first sweep

---

## WHAT NEEDS SETUP TO UNLOCK

| Feature | What to set |
|---------|------------|
| AI artwork | GEMINI_API_KEY in Settings |
| AI pitch | GEMINI_API_KEY in Settings |
| YouTube stats | YouTube API key in Settings |
| Spotify stats | Spotify Client ID and Secret in Settings |
| WhatsApp alerts | WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + WHATSAPP_TO in Vercel env |
| Email alerts | RESEND_API_KEY in Vercel env |
| Instagram scraping | IG_SCRAPER_URL + IG_WATCH_HANDLES in Vercel env |
| Secure sweep | CRON_KEY in Vercel env |

---

## COMPANY DETAILS

- Artist: Imen Mannai professionally known as DJ Emy
- Company: Emy Vision Group FZC
- Trade Licence: 4427087.01 - Sharjah Publishing City Free Zone
- Address: Business Centre, Sharjah Publishing City Free Zone, Sharjah, UAE
- AED IBAN: AE060330000019102008190
- GBP IBAN: AE760330000019102008191
- USD IBAN: AE490330000019102008192
- EUR IBAN: AE220330000019102008193
- SWIFT: BOMLAEAD
- Bank: Mashreqbank PSC (Mashreq NEO BIZ)
- Management: Kirth - Business Development
- Email: admin@emyvisiongroup.com
- Phone: +971 50 344 3281
- Artist Instagram: @dj_emy_
- Management Instagram: @evgroup2026
- EPK: emyvisiongroup.com

---

## NEXT PRIORITIES

1. Real Instagram scraping - use Apify free tier, set IG_SCRAPER_URL
2. Booking close flow - confirm gig, auto-invoice, payment tracking
3. WhatsApp push alerts - set env vars in Vercel dashboard
4. Spotify OAuth connect - one-click streaming stats
5. YouTube API onboarding - guide in settings

---

END OF SYSTEM LEDGER

## KEY FUNCTIONS
- extractContacts: extracts phone, email, WhatsApp, Instagram directly from advert text
- runSweep: auto-sweep with 6-hour interval, saves gigs to localStorage
- AUTO_SWEEP_INTERVAL_MS: 6 hours between automatic sweeps
