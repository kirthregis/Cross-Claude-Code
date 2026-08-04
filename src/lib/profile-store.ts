/**
 * Runtime overrides for the artist profile.
 *
 * `src/lib/artist.ts` holds the compiled-in defaults. This layer lets Emy (or
 * her manager) correct rates, contact details and rider from the /profile
 * screen without a code deploy.
 *
 * Storage is async (SQLite locally, Postgres in production). The sync
 * `activeProfile()` loader is fed from an in-memory cache populated once from
 * storage, so pure logic modules (pricing, scoring) stay storage-free and
 * testable.
 */

import { getStorage } from "./storage";
import { DJ_EMY, type ArtistProfile } from "./artist";
import { invalidateProfileCache, setProfileLoader } from "./active-profile";

/** In-memory cache backing the sync loader. */
let _cache: ArtistProfile = DJ_EMY;
let _loaderReady = false;

/** Always reads fresh from storage (used by API routes). */
export async function getProfile(): Promise<ArtistProfile> {
  const s = await getStorage();
  _cache = await s.getProfile();
  _loaderReady = true;
  return _cache;
}

export async function saveProfile(patch: Partial<ArtistProfile>): Promise<ArtistProfile> {
  const s = await getStorage();
  _cache = await s.saveProfile(patch);
  _loaderReady = true;
  invalidateProfileCache();
  return _cache;
}

/** Which PLACEHOLDER fields still need real data before production use. */
export function profileGaps(p: ArtistProfile = _cache): string[] {
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
export function ratesAreEstimates(p: ArtistProfile = _cache): boolean {
  return (["superclub", "beach_club", "brand_activation"] as const)
    .every((k) => p.baseRatesAed[k] === DJ_EMY.baseRatesAed[k]);
}

/**
 * Activates the sync loader backed by the in-memory cache. Loads from storage
 * once. Called from server entry points only (API routes, CLI scripts) — never
 * from pure logic modules.
 */
export async function registerProfileLoader(): Promise<void> {
  if (!_loaderReady) await getProfile();
  setProfileLoader(() => _cache);
}
