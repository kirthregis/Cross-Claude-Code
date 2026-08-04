# EMY Studio — reset points

Every milestone gets a **git tag** on the `arena/019fcd29-cross-claude-code`
branch (pushed to GitHub) plus a source zip in this repo's parent folder
(`/home/user/EMY-STUDIO-<milestone>-<date>.zip`). Any developer or any chat
can restore any point in seconds.

## How to restore a reset point

```bash
git fetch origin --tags
git checkout studio-v1-reset        # (or any tag below)
npm install --ignore-scripts
npm run dev                         # → http://localhost:3001/studio
```

Or just download the matching zip and unzip it anywhere.

## Reset points

| Tag | Date | What's in it |
|---|---|---|
| `studio-v1-reset` | 2026-08-05 | EMY Studio core: mastering (offline DSP, LUFS), artwork (Gemini + fal.ai + templates), release pack, checks, voice assistant (male voice), suggestion loop → dev inbox (`npm run inbox`) + admin back end, distribute page, PWA, dev setup (`npm run devcheck`). All 161 tests pass. |
| `studio-v2-library` | 2026-08-05 | Adds: Music Library tab (import files/folders, on-device player, free legal sources + Archive.org netlabel search), Audio output routing to a DJ controller sound card (Settings), one-tap social share buttons (Release tab), GigRadar linked in the nav + home, port 3001 fixed. All 161 tests pass. |
| `studio-v3-identity` | 2026-08-05 | Adds: floating voice assistant on EVERY page (global mic button, navigates her anywhere); home feature cards live (open the right project tab); clearer Gemini/fal.ai engine choice in Artwork (fal.ai via key = no website login); EPK tab (bio, highlights, press quotes, socials, rider, management, portrait upload, print/PDF + copy); identity-aware covers (Desert Gold template, heritage woven into the AI prompt); identity strip on studio home. 161 tests pass. |

## What was deliberately NOT built (read before adding)

- **No music-ripping / stream-download tools.** The free-music sources in the
  app are legitimate (Creative Commons, netlabels, pay-what-you-want, DJ
  promos). "Free latest commercial tracks" is piracy — do not add it.
- **No DJ-deck replacement.** The app routes audio to a DJ controller's sound
  card (Settings → Audio output) and plays the library through it, but jog
  wheels/mixing require Rekordbox. Do not claim otherwise.
- **No YouTube auto-upload yet** (planned; needs Google OAuth).

## Where the reset file lives for the user

- GitHub tag (reachable by any chat): `git fetch origin --tags`
- Local zip: `/home/user/EMY-STUDIO-v1-reset-2026-08-05.zip`

## Habit going forward

After every completed build: `git commit` + `git tag studio-<n>` + push tag +
`git archive` a fresh zip. Update this table each time.
