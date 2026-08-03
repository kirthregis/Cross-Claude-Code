/**
 * Resolves the profile to use at runtime.
 *
 * `artist.ts` holds compiled-in defaults; the /profile screen writes overrides
 * to SQLite. This module picks the right one and caches briefly, so hot paths
 * (scoring every inbound lead) don't hit the database repeatedly.
 *
 * The loader is injected rather than imported so that pure logic modules
 * (pricing, scoring, extraction) carry no dependency on the storage layer —
 * they stay trivially unit-testable.
 */

import { DJ_EMY, type ArtistProfile } from "./artist";

type Loader = () => ArtistProfile;

let loader: Loader | null = null;
let cached: { at: number; value: ArtistProfile } | null = null;
const TTL_MS = 5_000;

/** Wired up once, server-side, by `registerProfileLoader` in profile-store. */
export function setProfileLoader(fn: Loader) {
  loader = fn;
  cached = null;
}

export function activeProfile(): ArtistProfile {
  if (!loader) return DJ_EMY;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  try {
    const value = loader();
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return DJ_EMY;
  }
}

/** Call after saving so the next read is fresh. */
export function invalidateProfileCache() {
  cached = null;
}
