# Agent notes — GigRadar + EMY Studio

## EMY Studio domain rules (src/lib/studio/)
- **All DSP is pure and DOM-free** (`dsp.ts`, `wav.ts`) so it runs in the
  browser AND unit tests. Never import `window`/`document` there.
- `audio.ts` does the browser-only work: decode, realtime A/B chain,
  chunked OfflineAudioContext render (8-min chunks → bounded memory),
  WAV export with tags.
- **Never mutate a decoded AudioBuffer** — `loudnessWindows()` must work on a
  copy (regression: measuring used to K-weight the source in place and
  destroyed the preview audio). Tests cover this.
- Loudness is measured per-chunk via `loudnessWindows()` and merged with
  `loudnessFromWindows()` (global gating) — keep both in sync.
- Release numbers live in `release.ts` and match YouTube Help as of 2026:
  -14 LUFS (YouTube/Spotify), -16 (Apple), title ≤ 100, desc ≤ 5000,
  tags ≤ 500 chars total, cover 3000×3000 (min 1280), true peak ≤ -1 dBTP.
- The assistant must work **without any API key**: `routeCommand()` +
  `replyForIntent()` are the offline brain; Gemini only extends it. Never
  require Gemini for a core flow.
- User settings (Gemini key, handles) are device-local; never log or send
  them anywhere. The email ping goes through `src/app/api/studio/notify`
  with the Resend key server-side only.
- 24-bit WAV writes bytes individually (setInt32 at 3-byte offsets overflows
  the last sample — regression covered by tests).
- UI lives in `src/components/studio/`; pages are thin shells. Store reads go
  through `useProjects()` / `useSettings()` (useSyncExternalStore).

## Commands
- `npm run dev` · `npm run build` · `npm test` (vitest, 154 tests) · `npm run lint`
- `npm run seed` — realistic Dubai sample leads into SQLite
- `npm run sweep` — one ingest sweep from the CLI

## Conventions
- All domain logic lives in `src/lib/` and is pure + unit-tested. Routes and
  components stay thin.
- `src/lib/artist.ts` holds compiled-in defaults for rates, rider and contract
  terms. Never hardcode a fee or a clause anywhere else.
- Read the profile via `activeProfile()` from `src/lib/active-profile.ts`, never
  import `DJ_EMY` directly outside artist.ts — that bypasses the /profile
  overrides. Server entry points call `registerProfileLoader()` once to wire in
  the DB-backed loader; pure logic modules stay storage-free and testable.
- Adding a source = one new file in `src/lib/sources/` implementing `Source`,
  exported from `ALL_SOURCES`. It MUST return `[]` and report
  `configured: false` when its env vars are absent — never throw.
- Money is always integer AED, rounded to the nearest 50 via the `AED()` helper.
- Use `daysUntil()` from `src/lib/dates.ts` for any "how far away is this gig"
  logic. Comparing raw timestamps treats a gig happening tonight as expired.

## Gotchas already fixed (don't regress — tests cover these)
- Budget regex number groups must start with a digit; bare `[\d,]+` matches a
  lone comma and swallows real amounts.
- Venue tier matching is two-pass: specific phrases before generic words, or
  "beach club" gets captured by "club" and mispriced by thousands.
- Never pitch below a budget the client already stated — use `pitchFee()`.
- Scripts using top-level await must be `.mts`.

## Domain rules that are easy to get wrong
- Bookings are contracted through Emy Vision Group, never artist-direct. Pitches
  are signed by EVG; contracts name EVG as the party furnishing the Artist;
  invoices are payable to EVG. Don't "simplify" this back to first-person.
- Home markets (UAE + Qatar) carry NO travel premium — see `detectTravel()`.
  She is GCC-based, not Dubai-only.
- Regex stems: never put a trailing `\b` after a partial stem. `\bexclusiv\b`
  matches nothing; use `\bexclusiv\w*`.

## Document import
- `src/lib/docparse.ts` extracts entity/licence/bank fields from PDFs and text.
  Pure and unit-tested; `extractText()` is the only part touching pdf-parse.
- pdf.js needs its worker resolved from the installed package — Next does not
  emit `pdf.worker.mjs` into the server chunks. `serverExternalPackages:
  ["pdf-parse"]` in next.config.ts plus `PDFParse.setWorker()` handles this.
  Unit tests do NOT catch a regression here; test an actual HTTP upload.
- Uploads are parsed in memory only. Never persist the file, never log the
  extracted values, never echo more than the bounded `preview`.

## Placeholders that must be replaced before production
- Artist legal name is set: **Imen Mannai**. Still needed: EVG's registered
  entity name, trade licence number and bank details — the contract is not
  enforceable, and invoices are unpayable, without them.
- Bank details and licence number are SENSITIVE: stored only in the local
  SQLite DB (git-ignored), rendered only on the invoice. Never log them, never
  send them to a third party, never commit them.
- `baseRatesAed` are market estimates for her positioning, not her real fees.
  The /profile screen warns while they're still defaults.
- EVG bank details in the invoice template.
- `RAMADAN_WINDOWS` in `src/lib/pricing.ts`.
