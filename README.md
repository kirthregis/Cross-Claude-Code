# EMY Studio - DJ Emy Production and Booking Intelligence System

Live at: https://emy-studio-rho.vercel.app/studio

## What This Is

A complete professional studio and booking intelligence system built exclusively for DJ Emy (Imen Mannai), managed by Emy Vision Group FZC. Built as a PWA - works offline, installable on phone and laptop.

## System Status - Phase 10 Complete

Last updated: August 2026

### LIVE AND WORKING

#### Core Studio
- Project system: create, edit, delete projects. localStorage with self-healing and error boundary
- Master panel: in-browser EQ, compression, limiting, BS.1770-4 loudness targeting, WAV export (16/24-bit)
- Artwork panel: AI cover generation via Gemini and fal.ai, offline templates, 3000x3000 export
- Release panel: YouTube title, description, tags, compliance checks against platform rules
- Check panel: full compliance audit with pass/warn/fail per requirement
- Assistant: voice + text, navigates the app, creates projects, Gemini AI integration
- EPK: press kit, portrait upload, bio, download
- Settings: all API keys, artist profile, theme, audio output device
- PWA: installable, offline shell, update banner, self-healing storage
- Error boundary: catches all crashes, heals storage, shows recovery screen
- Service worker v9: caches all routes, offline fallback page

#### GigRadar - Booking Intelligence
- 40+ free public sources: Indeed x3, Bayt x2, GulfTalent, NaukriGulf, Hozpitality, Dubizzle, Monster, Reddit x4, Twitter/X via Nitter x5, Eventbrite x3, Meetup, Time Out Dubai x2, Resident Advisor Dubai and Doha, Platinumlist x2, Visit Dubai, Dubai Calendar, What's On UAE, Gulf News, Khaleej Times, Arabian Business, Esquire ME, Hospitality Net, Caterer, Total Jobs
- Auto-sweep: runs on page load if last sweep was 6+ hours ago. Vercel cron at 09:00 and 21:00 Dubai time
- Live sorted list: gigs sorted by score descending, appear immediately after sweep
- Verified contacts: phone, email, WhatsApp, Instagram extracted directly from advert text with one-tap action buttons
- Gig scoring engine: budget vs ask, venue tier, slot, genre match, contact quality, urgency, age
- AI pitch generator: EVG-branded WhatsApp and email pitches, FIFA credentials, bilingual positioning
- Negotiation playbook: 7 counters including FIFA credential anchor and going-rate reframe
- Contact strategy: sorted by decision power, entertainment manager fallback
- UAE venue database: 23 venues with booking contacts, pay rates, genre preferences
- Stage management: new to pitched to booked to paid
- Revenue tracker: per-gig fee tracking, paid/pending status, total pipeline

#### Business Suite (in Planner)
- Tech rider: editable, downloadable as TXT
- Stage plot: drag-and-drop layout builder
- Setlist builder: create, reorder, download per gig
- Contract generator: full legal document - DJ PERFORMANCE AGREEMENT, IP clause, Force Majeure, Dubai Courts, NON-CIRCUMVENTION, CDJ-3000 and DJM-900NXS2 rider
- Invoice generator: EVG bank details, IBAN AE060330000019102008190, SWIFT BOMLAEAD, VAT, print to PDF
- Revenue and invoice: BusinessSuite component with full finance calculations

#### Content and Analytics
- Analytics page: YouTube stats, Spotify metrics (needs API keys in Settings)
- Distribution page: smart links, royalty splits
- MENA Community: artist network, opportunities board, connection messages
- Music library: import files and folders, Archive.org search, playback with DJ controller routing
- Document parser: reads IBAN, SWIFT, trade licence, legal name from uploaded PDFs

### ARTIST AND COMPANY DETAILS ON FILE

- Artist: Imen Mannai professionally known as DJ Emy
- Company: Emy Vision Group FZC
- Trade Licence: 4427087.01 - Sharjah Publishing City Free Zone
- AED IBAN: AE060330000019102008190
- GBP IBAN: AE760330000019102008191
- USD IBAN: AE490330000019102008192
- EUR IBAN: AE220330000019102008193
- SWIFT: BOMLAEAD
- Bank: Mashreqbank PSC (Mashreq NEO BIZ)
- Management contact: Kirth - admin@emyvisiongroup.com - +971 50 344 3281
- Instagram: @dj_emy_ / @evgroup2026

### WHAT NEEDS API KEYS TO FULLY WORK

- Gemini AI: add GEMINI_API_KEY in Settings for AI artwork and text generation
- YouTube Analytics: add YouTube API key in Settings
- Spotify: add Spotify Client ID and Secret in Settings
- WhatsApp alerts: set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TO in Vercel env vars
- Email alerts: set RESEND_API_KEY in Vercel env vars

### INCOMPLETE - NEXT PRIORITIES

1. Real Instagram scraping - needs IG_SCRAPER_URL env var (use Apify or similar free tier)
2. Booking close flow - mark gig as booked, auto-generate invoice, track payment
3. Push notification backend - phone alerts when high-score gig lands
4. Spotify OAuth - one-click connect for live streaming stats
5. YouTube live stats - populated when API key added in Settings

## Architecture

- Framework: Next.js 14 App Router
- Deployment: Vercel (https://emy-studio-rho.vercel.app)
- Storage: localStorage (projects, settings, gigs) + IndexedDB (artwork blobs)
- AI: Gemini API (optional) + server-side fallbacks
- PWA: Service worker v9, manifest, offline shell
- Protection: ErrorBoundary, self-healing storage, 40+ second cron

## File Count

93 TypeScript and TSX files across src/
