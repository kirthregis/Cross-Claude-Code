# Agent notes — GigRadar

## Commands
- `npm run dev` · `npm run build` · `npm test` (vitest, 81 tests) · `npm run lint`
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

## Placeholders that must be replaced before production
- Artist's full legal name and EVG's registered entity + trade licence number
  (both marked `PLACEHOLDER` in `src/lib/artist.ts`) — the contract is not
  enforceable without the EVG entity.
- `baseRatesAed` are market estimates for her positioning, not her real fees.
  The /profile screen warns while they're still defaults.
- EVG bank details in the invoice template.
- `RAMADAN_WINDOWS` in `src/lib/pricing.ts`.
