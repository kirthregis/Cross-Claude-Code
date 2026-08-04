/**
 * EMY Studio — EPK (Electronic Press Kit).
 *
 * Her professional identity, editable in the app, exportable to the latest
 * industry standards. Seed values reflect her real profile (Tunisian-born,
 * Qatar-raised; EVG representation). Everything is stored on-device.
 */

export interface PressQuote {
  quote: string;
  source: string;
}

export interface EpkData {
  artistName: string;
  stageName: string;
  origin: string;
  base: string;
  genres: string;
  languages: string;
  tagline: string;
  bio: string;
  achievements: string[];
  pressQuotes: PressQuote[];
  socials: { instagram: string; tiktok: string; youtube: string; spotify: string; soundcloud: string };
  streamingLinks: string[];
  techRider: string;
  management: string;
  photoDataUrl: string | null;
  updatedAt: number;
}

export const EPK_DEFAULTS: EpkData = {
  artistName: "Imen Mannai",
  stageName: "DJ EMY",
  origin: "Tunisian-born, raised in Qatar",
  base: "Dubai / Doha — UAE & Qatar",
  genres: "Afro House, Afro Tech, Melodic House",
  languages: "Arabic · English",
  tagline: "Afro House DJ — official World Cup & Arab Cup tournament DJ",
  bio: "DJ EMY (Imen Mannai) is an Afro House DJ born in Tunisia and raised in Qatar. She is an official tournament DJ for the FIFA World Cup Qatar 2022 and the Arab Cup 2025, and performs across the Gulf — Dubai, Doha and Abu Dhabi — with a bilingual Arabic/English floor presence that bridges Afro House, Afro Tech and melodic rhythms. Represented by Emy Vision Group (EVG).",
  achievements: [
    "Official DJ — FIFA World Cup Qatar 2022",
    "Official DJ — Arab Cup 2025",
    "Headline sets across Dubai, Doha & Abu Dhabi",
    "Afro House genre specialist in the GCC",
    "Bilingual Arabic–English crowd connection",
    "YouTube: Afro House Mix series with global reach",
  ],
  pressQuotes: [
    { quote: "One of the Gulf's rising Afro House voices.", source: "EVG press notes" },
  ],
  socials: {
    instagram: "https://instagram.com/dj_emy_",
    tiktok: "https://tiktok.com/@djemymusic2",
    youtube: "https://www.youtube.com/@DJEMY-o6d",
    spotify: "",
    soundcloud: "",
  },
  streamingLinks: [
    "https://www.youtube.com/@DJEMY-o6d",
  ],
  techRider: "DJ controller (DDJ-800) + laptop · CDJ/USB fallback · monitor + house PA · booth monitors",
  management: "Emy Vision Group (EVG) — bookings, contracts & press: see GigRadar (gigs) / admin contact",
  photoDataUrl: null,
  updatedAt: 0,
};

const KEY = "emy-studio-epk-v1";

export function loadEpk(): EpkData {
  if (typeof window === "undefined") return EPK_DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EPK_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<EpkData>;
    return {
      ...EPK_DEFAULTS,
      ...parsed,
      achievements: Array.isArray(parsed.achievements) && parsed.achievements.length ? parsed.achievements : EPK_DEFAULTS.achievements,
      pressQuotes: Array.isArray(parsed.pressQuotes) ? parsed.pressQuotes : EPK_DEFAULTS.pressQuotes,
      socials: { ...EPK_DEFAULTS.socials, ...(parsed.socials ?? {}) },
      streamingLinks: Array.isArray(parsed.streamingLinks) ? parsed.streamingLinks : EPK_DEFAULTS.streamingLinks,
    };
  } catch {
    return EPK_DEFAULTS;
  }
}

export function saveEpk(d: EpkData): EpkData {
  const next = { ...d, updatedAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* noop */
  }
  return next;
}

export function epkFullText(d: EpkData): string {
  const socials = [
    d.socials.instagram && `Instagram: ${d.socials.instagram}`,
    d.socials.tiktok && `TikTok: ${d.socials.tiktok}`,
    d.socials.youtube && `YouTube: ${d.socials.youtube}`,
    d.socials.spotify && `Spotify: ${d.socials.spotify}`,
    d.socials.soundcloud && `SoundCloud: ${d.socials.soundcloud}`,
  ].filter(Boolean).join("\n");
  return [
    `${d.stageName} — EPK`,
    d.tagline,
    ``,
    `Artist: ${d.artistName}`,
    `Origin: ${d.origin}`,
    `Based: ${d.base}`,
    `Genres: ${d.genres}`,
    `Languages: ${d.languages}`,
    ``,
    `BIO`,
    d.bio,
    ``,
    `HIGHLIGHTS`,
    ...d.achievements.map((a) => `• ${a}`),
    ``,
    `PRESS`,
    ...d.pressQuotes.map((q) => `"${q.quote}" — ${q.source}`),
    ``,
    `SOCIALS & MUSIC`,
    socials,
    ...d.streamingLinks.map((l) => `Listen: ${l}`),
    ``,
    `TECH RIDER`,
    d.techRider,
    ``,
    `MANAGEMENT`,
    d.management,
  ].join("\n");
}
