# EMY STUDIO - STATUS LEDGER
Last Updated: 2026-08-06 Phase 11

## LIVE ACCESS
- Live App: https://emy-studio-rho.vercel.app/studio
- This Ledger (live, always accessible): https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/STATUS_LEDGER.md
- GitHub Repo: https://github.com/kirthregis/Cross-Claude-Code
- Branch: main
- Local: C:\\Users\\kirth\\Cross-Claude-Code\\Cross-Claude-Code

## CREDENTIALS
- Admin Password: Emy1912@
- AI Keys: Gemini and Fal.ai stored in Studio Settings

## SYSTEM STATE - PHASE 11 COMPLETE

### Core Studio - LIVE AND VERIFIED
- Project system: create, edit, delete. localStorage self-healing. Error boundary.
- Master panel: BS.1770-4 loudness, EQ, compression, WAV 16/24-bit export
- Artwork panel: Gemini AI, fal.ai, offline templates, 3000x3000
- Release panel: YouTube title, description, tags, compliance checks
- Assistant: voice + text, Gemini AI, project navigation
- EPK: press kit, portrait, bio, download
- Settings: all API keys, artist profile, theme, audio routing
- PWA: installable, offline shell, update banner, self-healing storage
- Error boundary: catches all crashes, heals corrupt localStorage
- Service worker v9: caches all routes, offline fallback

### GigRadar - LIVE AND VERIFIED
- 40+ free public sources always active (no API key needed)
- Auto-sweep: on page load if 6+ hours since last sweep
- Vercel cron: 09:00 Dubai (05:00 UTC) and 21:00 Dubai (17:00 UTC) daily
- Live sorted list: gigs by score, appear immediately after sweep
- Verified contacts: phone, email, WhatsApp, Instagram from advert text, one-tap buttons
- Scoring engine: budget, venue tier, slot, genre, contacts, urgency
- AI pitch: EVG-branded WhatsApp and email, FIFA credentials
- Negotiation playbook: 7 counters with FIFA anchor
- UAE venue database: 23 venues with contacts, rates, genres
- Stage management: new to paid pipeline
- Revenue tracker: per-gig, paid/pending, total pipeline

### Business Suite - LIVE AND VERIFIED
- Tech rider: editable, download TXT
- Stage plot: drag-and-drop
- Setlist builder: create, reorder, download
- Contract: full legal - DJ PERFORMANCE AGREEMENT, IP, Force Majeure, Dubai Courts, NON-CIRCUMVENTION, CDJ-3000, DJM-900NXS2
- Invoice: EVG bank details, IBAN AE060330000019102008190, SWIFT BOMLAEAD, VAT, print PDF
- Revenue: BusinessSuite finance calculations

### Content and Analytics
- Analytics: YouTube and Spotify (needs API keys in Settings)
- Distribution: smart links, royalty splits
- MENA Community: artist network, opportunities, messages
- Library: import, Archive.org search, DJ controller routing
- Document parser: reads IBAN, SWIFT, trade licence from PDFs

## COMPANY DETAILS ON FILE
- Artist: Imen Mannai known as DJ Emy
- Company: Emy Vision Group FZC
- Trade Licence: 4427087.01 - Sharjah Publishing City Free Zone
- AED IBAN: AE060330000019102008190
- GBP IBAN: AE760330000019102008191
- USD IBAN: AE490330000019102008192
- EUR IBAN: AE220330000019102008193
- SWIFT: BOMLAEAD
- Bank: Mashreqbank PSC (Mashreq NEO BIZ)
- Contact: Kirth - admin@emyvisiongroup.com - +971 50 344 3281
- Artist Instagram: @dj_emy_ / Management: @evgroup2026

## PROTECTION LAYERS
1. ErrorBoundary: catches crashes, heals storage, reload button
2. PwaRegister: heals corrupt JSON on every boot
3. Store: memoised cache, no re-render loops
4. Service worker v9: offline shell, clears stale caches
5. vercel.json: Cache-Control prevents stale SW
6. ingest.ts: suppressed gigs never stored, always marked alerted

## WHAT NEEDS API KEYS
- Gemini AI: GEMINI_API_KEY in Settings
- YouTube stats: YouTube API key in Settings
- Spotify: Spotify Client ID and Secret in Settings
- WhatsApp alerts: WHATSAPP_TOKEN + WHATSAPP_PHONE_ID + WHATSAPP_TO in Vercel
- Email alerts: RESEND_API_KEY in Vercel
- Instagram scraping: IG_SCRAPER_URL + IG_WATCH_HANDLES in Vercel
- Secure sweep: CRON_KEY in Vercel

## RECOVERY - CLONE TO ANY MACHINE
1. git clone https://github.com/kirthregis/Cross-Claude-Code
2. cd Cross-Claude-Code/Cross-Claude-Code
3. npm install
4. npm run dev
5. Open http://localhost:3000/studio

## NEXT PRIORITIES
1. Instagram scraping - Apify free tier, set IG_SCRAPER_URL
2. Booking close flow - confirm gig, auto-invoice, payment tracking
3. WhatsApp push alerts - set env vars in Vercel dashboard
4. Spotify OAuth - one-click streaming stats
5. YouTube API - guide in Settings

## LIVE LEDGER LINKS (accessible from any browser or Google)
- Raw ledger: https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/STATUS_LEDGER.md
- GitHub view: https://github.com/kirthregis/Cross-Claude-Code/blob/main/STATUS_LEDGER.md
- Live app: https://emy-studio-rho.vercel.app/studio
- GigRadar: https://emy-studio-rho.vercel.app/studio/gigradar
