/**
 * Runtime overrides for the artist profile.
 *
 * `src/lib/artist.ts` holds the compiled-in defaults. This layer lets Emy (or
 * her manager) correct rates, contact details and rider from the /profile
 * screen without a code deploy — which matters because the pricing model is
 * only as good as the rates behind it.
 */

import { db } from "./db";
import { DJ_EMY, type ArtistProfile } from "./artist";
import { invalidateProfileCache, setProfileLoader } from "./active-profile";

function ensure() {
  db().exec(`CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);
}

/** Deep-merge overrides over the compiled defaults. */
function merge<T>(base: T, over: unknown): T {
  if (over === null || over === undefined) return base;
  if (typeof base !== "object" || Array.isArray(base) || typeof over !== "object" || Array.isArray(over)) {
    return over as T;
  }
  const out = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = k in out ? merge((base as Record<string, unknown>)[k], v) : v;
  }
  return out as T;
}

export function getProfile(): ArtistProfile {
  ensure();
  const row = db().prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
  if (!row) return DJ_EMY;
  try {
    return merge(DJ_EMY, JSON.parse(row.data));
  } catch {
    return DJ_EMY;
  }
}

export function saveProfile(patch: Partial<ArtistProfile>): ArtistProfile {
  ensure();
  const row = db().prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
  const existing = row ? JSON.parse(row.data) : {};
  const next = merge(existing, patch);
  db().prepare(
    `INSERT INTO profile (id, data, updated_at) VALUES (1, @d, @t)
     ON CONFLICT(id) DO UPDATE SET data = @d, updated_at = @t`
  ).run({ d: JSON.stringify(next), t: new Date().toISOString() });
  invalidateProfileCache();
  return getProfile();
}

/** Which PLACEHOLDER fields still need real data before production use. */
export function profileGaps(p: ArtistProfile = getProfile()): string[] {
  const gaps: string[] = [];
  if (/PLACEHOLDER/i.test(p.legalName)) {
    gaps.push("Artist's full legal name — named as performer in every contract");
  }
  if (/PLACEHOLDER/i.test(p.management.legalName)) {
    gaps.push("EVG registered legal entity name — EVG is the contracting party, so this is what makes the agreement enforceable");
  }
  if (!p.management.tradeLicenceNo) {
    gaps.push("EVG trade licence number — goes on every contract (from the business licence)");
  }
  if (!p.management.bank?.iban) {
    gaps.push("EVG bank details (account name, bank, IBAN) — invoices can't be paid without them");
  }
  if (Object.values(p.baseRatesAed).some((v) => !v)) gaps.push("Base rates");
  return gaps;
}

/** Rates are still the market-estimate defaults, not her real numbers. */
export function ratesAreEstimates(p: ArtistProfile = getProfile()): boolean {
  return (["superclub", "beach_club", "brand_activation"] as const)
    .every((k) => p.baseRatesAed[k] === DJ_EMY.baseRatesAed[k]);
}

/**
 * Activates DB-backed overrides for the whole app. Called from server entry
 * points only (API routes, CLI scripts) — never from pure logic modules.
 */
export function registerProfileLoader() {
  setProfileLoader(getProfile);
}
