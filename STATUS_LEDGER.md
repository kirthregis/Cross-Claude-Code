# EMY STUDIO — STATUS LEDGER
Last Updated: August 2026

## LIVE ACCESS
- App: https://emy-studio-rho.vercel.app/studio
- Ledger: https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/STATUS_LEDGER.md
- Handover: https://raw.githubusercontent.com/kirthregis/Cross-Claude-Code/main/HANDOVER.md
- GitHub: https://github.com/kirthregis/Cross-Claude-Code

## CURRENT STATE — ALL SYSTEMS OPERATIONAL

### Storage Architecture (Online + Offline)

Every piece of data has a defined home. Nothing is RAM-only except the raw uploaded mix before mastering.

| Data | Storage | Survives Refresh |
|------|---------|------------------|
| Project metadata | localStorage `emy-studio-projects-v1` | ✅ |
| Settings | localStorage `emy-studio-settings-v1` | ✅ |
| Master params (EQ, comp, limiter) | localStorage (project object) | ✅ |
| Master result (LUFS, peak, gain) | localStorage (project object) | ✅ |
| Mastered WAV audio | IndexedDB `emy-studio` → `emy-master:{id}` + Library IndexedDB | ✅ |
| Exported WAV files | IndexedDB `emy-studio` → `emy-export:{id}:{bits}bit` + Library + user folder (File System Access API) | ✅ |
| Cover artwork 3000x3000 | IndexedDB `emy-studio` → `emy-studio-art:{id}` | ✅ |
| Release metadata | localStorage (project object) | ✅ |
| Tracklist | localStorage (project.tracklist) | ✅ |
| EPK files (PDF, portrait) | IndexedDB `emy-studio-epk` | ✅ |
| EPK notes | localStorage `emy-studio-epk-notes-v1` | ✅ |
| Library tracks | IndexedDB `emy-studio-library` | ✅ |
| Setlists | localStorage `emy-setlists` | ✅ |
| Collaborator splits | localStorage (project object) | ✅ |
| Smart links | localStorage (project object) | ✅ |
| Theme/branding | localStorage via CSS variables | ✅ |
| Raw uploaded mix (pre-master) | RAM only (AudioBuffer) | ❌ re-upload |

### Audio Device Routing
- MasteringPlayer: Web Audio API `AudioContext.setSinkId()` → user-selected device
- Library player: `<audio>.setSinkId()` → same device
- Device picker: Settings → Audio Output → DJ controller / monitors / headphones
- Works with Pioneer DDJ, Focusrite, any USB audio Chrome/Edge can see

### Button-by-Button Audit (All Tabs Verified)

**Master:** Upload → localStorage. Presets/EQ/Comp sliders → localStorage. Master → localStorage + IndexedDB + Library. Play → device. Export → File System API + IndexedDB + Library. Return → auto-reloads from IndexedDB.

**Tracklist:** Add/edit/move/remove → localStorage per keystroke. Copy → clipboard. Return → loads from project.tracklist.

**Artwork:** Generate → localStorage draft. Save & use → localStorage + IndexedDB. Download → browser. Return → loads from IndexedDB.

**Release:** Generate → localStorage. Every edit auto-saves → localStorage. Copy → clipboard. Return → loads from project.release.

**Check:** Read-only. Auto-runs on mount.

**Assistant:** Chat ephemeral. Stage cards switch tabs.

### Fixes Applied
1. createProject() auto-saves to localStorage — no unsaved project navigation
2. GlobalAssistant voice create saves before navigating
3. MasteringPlayer routes to selected audio device via setSinkId
4. Mastered WAV auto-saves to IndexedDB + Library
5. Master auto-reloads from IndexedDB on return
6. Export uses File System Access API (Chrome/Edge)
7. Release edits auto-save every change
8. Tracklist Builder tab added
9. Tracklist auto-included in release description
10. Compliance check verifies tracklist
11. MENA community: 52 members, 14 countries
12. 30 DJ gigs via MENA DJ Network sweep source
13. Logo: burnt orange, black circles (original)

## DESIGN RULES
1. DO NOT change logo, colors, fonts, or design unless explicitly requested
2. DO NOT create separate apps — everything is EMY Studio at /studio
3. DO NOT change navigation without approval
4. Logo: burnt orange (#c2410c), black concentric circles, no text
5. Dark theme (#0a0a0f, zinc, fuchsia accents) is permanent

## SELF-OPERATION
- /api/sweep cron daily 6am pulls DJ gigs
- Check tab audits every project
- STATUS_LEDGER.md updated every deployment
- Errors caught and surfaced

## CREDENTIALS
- Admin: Emy1912@
- Contact: Kirth - admin@emyvisiongroup.com - +971 50 344 3281

## CLONE TO ANY MACHINE
```bash
git clone https://github.com/kirthregis/Cross-Claude-Code
cd Cross-Claude-Code
npm install
npm run dev
```
Then open: http://localhost:3000/studio
