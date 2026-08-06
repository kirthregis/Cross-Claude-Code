import { DJ_EMY, type ArtistProfile } from "./artist";
import { db } from "./db";
import { setProfileLoader, invalidateProfileCache } from "./active-profile";

const PROFILE_KEY = "emy-artist-profile-v2";

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (!isObject(base) || !isObject(patch)) return (patch !== undefined ? patch : base) as T;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(patch)) {
    const patchVal = patch[key];
    const baseVal = result[key];
    if (patchVal === undefined) continue;
    if (isObject(baseVal) && isObject(patchVal)) {
      result[key] = deepMerge(baseVal, patchVal);
    } else {
      result[key] = patchVal;
    }
  }
  return result as T;
}

export function getProfile(): ArtistProfile {
  const saved = db.get(PROFILE_KEY);
  if (!saved || typeof saved !== "object") return DJ_EMY;
  return deepMerge<ArtistProfile>(DJ_EMY, saved);
}

export function saveProfile(patch: Partial<ArtistProfile>): void {
  const current = getProfile();
  const updated = deepMerge<ArtistProfile>(current, patch);
  db.set(PROFILE_KEY, updated);
  invalidateProfileCache();
}

export function profileGaps(): string[] {
  const p = getProfile();
  const gaps: string[] = [];

  if (!p.name) gaps.push("Artist name missing");
  if (!p.legalName) gaps.push("Artist full legal name missing");
  if (!p.email) gaps.push("Email missing");
  if (!p.phone) gaps.push("Phone missing");
  if (!p.management?.company) gaps.push("Management company missing");
  if (!p.management?.tradeLicenceNo) gaps.push("EVG trade licence number missing");
  if (!p.management?.bank?.iban) gaps.push("Bank IBAN missing");
  if (!p.management?.bank?.swift) gaps.push("Bank SWIFT missing");

  return gaps;
}

export function ratesAreEstimates(): boolean {
  return false;
}

export function registerProfileLoader(): () => ArtistProfile {
  setProfileLoader(getProfile);
  return getProfile;
}

// Auto-register on import
setProfileLoader(getProfile);
