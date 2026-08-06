import { db } from "./db";

export interface ArtistProfile {
  name: string;
  genres: string[];
  rateAed: number;
  ratesAreEstimated: boolean;
  bio: string;
  instagram?: string;
  soundcloud?: string;
  email?: string;
  phone?: string;
  preferredVenues?: string[];
  blacklistedVenues?: string[];
}

const PROFILE_KEY = "emy-artist-profile";

const DEFAULT_PROFILE: ArtistProfile = {
  name: "Emy",
  genres: ["Afro House", "Afro Tech", "Tribal"],
  rateAed: 3000,
  ratesAreEstimated: true,
  bio: "Dubai-based DJ and performer specialising in Afro House.",
};

export function getProfile(): ArtistProfile {
  const saved = db.get(PROFILE_KEY);
  return saved ? { ...DEFAULT_PROFILE, ...saved } : DEFAULT_PROFILE;
}

export function saveProfile(profile: Partial<ArtistProfile>) {
  const current = getProfile();
  db.set(PROFILE_KEY, { ...current, ...profile });
}

export function profileGaps(): string[] {
  const p = getProfile();
  const gaps: string[] = [];
  if (!p.instagram) gaps.push("Instagram handle missing");
  if (!p.email) gaps.push("Email missing");
  if (!p.bio || p.bio.length < 20) gaps.push("Bio too short");
  if (p.ratesAreEstimated) gaps.push("Rate is estimated — confirm your real rate");
  return gaps;
}

export function ratesAreEstimates(): boolean {
  return getProfile().ratesAreEstimated;
}

export function registerProfileLoader() {
  const profile = getProfile();
  return profile;
}