/**
 * Profile store � runtime overrides on top of the compiled DJ_EMY defaults.
 *
 * The UI at /profile writes patches here. Everything else reads via
 * activeProfile() which resolves the merged result.
 */

import { DJ_EMY, type ArtistProfile } from "./artist";
import { setProfileLoader, invalidateProfileCache } from "./active-profile";
import { db } from "./db";

const PROFILE_KEY = "emy-artist-profile-v2";

// -- Deep merge helper ---------------------------------------------------------

function deepMerge<T>(base: T, patch: Partial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

// -- Public API ----------------------------------------------------------------

export function getProfile(): ArtistProfile {
  const saved = db.get(PROFILE_KEY);
  if (!saved) return DJ_EMY;
  return deepMerge(DJ_EMY, saved as Partial<ArtistProfile>);
}

export function saveProfile(patch: Partial<ArtistProfile>): void {
  const current = db.get(PROFILE_KEY) as Partial<ArtistProfile> | null;
  const merged = current ? deepMerge(current, patch) : patch;
  db.set(PROFILE_KEY, merged);
  invalidateProfileCache();
}

export function profileGaps(): string[] {
  const p = getProfile();
  const gaps: string[] = [];
  if (!p.management?.tradeLicenceNo) gaps.push("Trade licence number missing � required for contracts");
  if (!p.management?.bank?.iban) gaps.push("Bank IBAN missing � required for invoices");
  if (!p.management?.bank?.swift) gaps.push("Bank SWIFT missing � required for international payments");
  if (!p.management?.bank?.accountName) gaps.push("Bank account name missing");
  return gaps;
}

export function ratesAreEstimates(): boolean {
  const saved = db.get(PROFILE_KEY) as Partial<ArtistProfile> | null;
  // If no overrides saved, the compiled-in rates are estimates.
  return !saved?.baseRatesAed;
}

/**
 * Wire the profile loader into the active-profile cache.
 * Call once at app startup (already called from ingest.ts).
 */
export function registerProfileLoader(): void {
  setProfileLoader(getProfile);
}
