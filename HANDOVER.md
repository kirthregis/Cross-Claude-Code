# EMY STUDIO - HANDOVER PACKAGE
Last Updated: August 2026

## LIVE URL
https://emy-studio-rho.vercel.app/studio

## SOURCE CODE
- GitHub: https://github.com/kirthregis/Cross-Claude-Code
- Branch: main
- Local folder: C:\Users\kirth\Cross-Claude-Code\Cross-Claude-Code

## DOWNLOAD SOURCE CODE (offline backup)
Run this on any machine to get the full source:
  git clone https://github.com/kirthregis/Cross-Claude-Code
  cd Cross-Claude-Code/Cross-Claude-Code
  npm install
  npm run dev
Then open: http://localhost:3000/studio

## CURRENT STATE - Phase 6 Restored
The system was restored to commit aaf8630 (Phase 6) because subsequent
changes broke navigation, settings, and the studio home page.

## WHAT WORKS (verified at Phase 6)
- Studio home page: project list, new project form, EPK link
- Project editor: Master, Artwork, Release, Check, Assistant tabs
- Mastering engine: BS.1770-4 loudness, EQ, WAV export
- Artwork panel: Gemini AI, fal.ai, offline templates
- Release panel: YouTube metadata, compliance checks
- EPK: press kit, portrait, bio, download
- Settings: all API keys, artist profile
- PWA: installable, offline shell
- Error boundary: catches crashes, heals storage
- Service worker v10: API routes not cached (fixes sweep)
- GigRadar: sweep button, 60+ global sources, DJ filter
- GigRadar: verified contacts extracted from adverts
- GigRadar: auto-sweep on load if 6+ hours since last
- Vercel cron: 09:00 and 21:00 Dubai time daily
- Contract engine: full legal documents with EVG details
- Outreach engine: EVG-branded pitches, negotiation playbook
- Invoice: EVG bank details, IBAN, SWIFT, print PDF
- Profile store: deep merge, DJ_EMY defaults
- Notify: Dubai timezone, quiet hours, digest

## WHAT IS BROKEN OR INCOMPLETE
1. Settings page - color buttons cause crash (infinite re-render loop)
   Root cause: useTheme() with useSyncExternalStore returns new object
   every render causing loop. Multiple fix attempts all failed.
   Workaround: clear site data in browser if crash occurs.

2. GigRadar - gigs show but include non-DJ content
   Root cause: filter is either too tight (0 results) or too loose
   (pets, real estate, credit cards pass through).
   Status: DJ keyword filter applied at source and ingest level
   but some feeds return mixed content.

3. Navigation buttons on studio home
   Root cause: StudioGuide component was intercepting clicks.
   Status: restored to Phase 6 where it worked.

4. Settings page - Save Changes button
   Status: added draft state and Save button but crash persists.
   The theme store (useSyncExternalStore) fires on every color
   change and causes React error 185 infinite loop.

5. GigRadar sweep - 0 sources sometimes
   Root cause: many RSS feeds return 403 or timeout from Vercel.
   Indeed, Reddit, Nitter all block server-side scrapers.
   Only RA.co and Platinumlist reliably return data.

## KNOWN TECHNICAL DEBT
- store.ts was rewritten multiple times - current version uses
  window.dispatchEvent storage approach which may conflict
  with PwaRegister also listening to storage events
- theme.ts useSyncExternalStore causes infinite loops when
  settings page is open - needs complete architectural rethink
- Service worker version is v10 - cache busting works
- .gitignore has *.py to prevent script files being committed
  but scripts keep being recreated and committed accidentally

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

## CREDENTIALS
- Admin Password: Emy1912@
- Live URL: https://emy-studio-rho.vercel.app/studio
- GitHub: https://github.com/kirthregis/Cross-Claude-Code

## HANDOVER INSTRUCTIONS FOR NEXT AI
1. Clone the repo: git clone https://github.com/kirthregis/Cross-Claude-Code
2. Read HANDOVER.md (this file) first
3. Read STATUS_LEDGER.md for live links
4. Read SYSTEM.md for full file map (if present)
5. Current commit is Phase 6 restored - aaf8630 baseline
6. Do NOT touch store.ts or theme.ts without understanding
   the useSyncExternalStore memoisation pattern
7. Do NOT use em-dashes or non-ASCII in Python scripts
8. Always use lines.append() method for writing TSX files
9. Always audit before pushing - never say something works
   without verifying with grep/Select-String first
10. The settings crash (React error 185 on color change) is
    the most urgent unfixed bug - fix this first

## PRIORITY FIXES FOR NEXT SESSION
1. Fix settings page color crash - isolate useTheme completely
2. Fix GigRadar to show only real DJ booking leads
3. Re-add the improvements from Phase 7-13 that were lost
   in the restore (GigRadar auto-sweep, verified contacts,
   SW v10, global sources, outreach/contract engine fixes)
4. Add Instagram scraping via Apify free tier
5. Add booking close flow - confirm gig, auto-invoice
6. Add WhatsApp push alerts via Vercel env vars

## LEDGER LINKS
- Raw ledger: https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/HANDOVER.md
- GitHub view: https://github.com/kirthregis/Cross-Claude-Code/blob/main/HANDOVER.md
- Live app: https://emy-studio-rho.vercel.app/studio
- GigRadar: https://emy-studio-rho.vercel.app/studio/gigradar
