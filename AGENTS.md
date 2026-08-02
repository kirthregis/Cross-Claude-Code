# Agent notes — GigRadar

## Commands
- `npm run dev` · `npm run build` · `npm test` (vitest, 58 tests) · `npm run lint`
- `npm run seed` — realistic Dubai sample leads into SQLite
- `npm run sweep` — one ingest sweep from the CLI

## Conventions
- All domain logic lives in `src/lib/` and is pure + unit-tested. Routes and
  components stay thin.
- `src/lib/artist.ts` is the single source of truth for rates, rider and
  contract terms. Never hardcode a fee or a clause anywhere else.
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

## Placeholders that must be replaced before production
Everything marked `PLACEHOLDER` in `src/lib/artist.ts` (legal name, real rates,
contact details, bank details) and `RAMADAN_WINDOWS` in `src/lib/pricing.ts`.
