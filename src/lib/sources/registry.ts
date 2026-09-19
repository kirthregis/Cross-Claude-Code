/**
 * EMY GigRadar — Country & Source Registry
 * Self-expanding. Add countries here or via the UI.
 * Each country has automated feeds + manual lead support.
 */

export interface FeedConfig {
  id: string;
  label: string;
  url: string;
  kind: "rss" | "json" | "html";
  active: boolean;
}

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  currency: string;
  priority: number; // 1 = highest
  active: boolean;
  feeds: FeedConfig[];
}

const REGISTRY_KEY = "emy-source-registry";

// Every feed below was checked by hand on 2026-09-19: all return 404, 405, or
// a redirect to an HTML page — none of them are live RSS anymore (if they
// ever were; the URLs read as plausible guesses that were never verified).
// That was the actual reason the sweep always reported "0 leads": not a bug
// in the fetch/parse code, dead sources it never questioned. Left here,
// `active: false`, as real entries someone can flip back on if a working
// replacement URL is found — not deleted, since the Sources UI already
// supports editing a feed's URL and re-enabling it. The one live UAE source
// right now is CareersInGulf, wired up in uae.ts.
export const DEFAULT_COUNTRIES: CountryConfig[] = [
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    priority: 1,
    active: true,
    feeds: [
      {
        id: "platinumlist",
        label: "Platinumlist Dubai — confirmed dead 2026-09-19 (redirect, no feed)",
        url: "https://platinumlist.net/rss",
        kind: "rss",
        active: false,
      },
      {
        id: "timeout-dubai",
        label: "Time Out Dubai Events — confirmed dead 2026-09-19 (405)",
        url: "https://www.timeoutdubai.com/rss/whats-on",
        kind: "rss",
        active: false,
      },
      {
        id: "ra-dubai",
        label: "Resident Advisor Dubai — confirmed dead 2026-09-19 (404, RA retired this feed format)",
        url: "https://ra.co/xml/feed.xml?area=62",
        kind: "rss",
        active: false,
      },
      {
        id: "hozpitality",
        label: "Hozpitality UAE Jobs — confirmed dead 2026-09-19 (200 but HTML, not XML)",
        url: "https://hozpitality.com/rss/jobs.xml",
        kind: "rss",
        active: false,
      },
      {
        id: "dubai-calendar",
        label: "Dubai Calendar — confirmed dead 2026-09-19 (200 but HTML, not XML)",
        url: "https://www.visitdubai.com/en/whats-on/rss",
        kind: "rss",
        active: false,
      },
      {
        id: "gulftalent",
        label: "Gulf Talent Entertainment — confirmed dead 2026-09-19 (404)",
        url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment",
        kind: "rss",
        active: false,
      },
    ],
  },
  {
    code: "QA",
    name: "Qatar",
    flag: "🇶🇦",
    currency: "QAR",
    priority: 2,
    active: true,
    feeds: [
      {
        id: "qatar-events",
        label: "Qatar Tourism Events — confirmed dead 2026-09-19 (404)",
        url: "https://www.visitqatar.qa/rss/events",
        kind: "rss",
        active: false,
      },
      {
        id: "ra-doha",
        label: "Resident Advisor Doha — confirmed dead 2026-09-19 (404, RA retired this feed format)",
        url: "https://ra.co/xml/feed.xml?area=398",
        kind: "rss",
        active: false,
      },
    ],
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    currency: "SAR",
    priority: 3,
    active: false,
    feeds: [
      {
        id: "mdlbeast",
        label: "MDL Beast Events — confirmed dead 2026-09-19 (404)",
        url: "https://mdlbeast.com/rss",
        kind: "rss",
        active: false,
      },
    ],
  },
  {
    code: "BH",
    name: "Bahrain",
    flag: "🇧🇭",
    currency: "BHD",
    priority: 4,
    active: false,
    feeds: [],
  },
  {
    code: "KW",
    name: "Kuwait",
    flag: "🇰🇼",
    currency: "KWD",
    priority: 5,
    active: false,
    feeds: [],
  },
  {
    code: "OM",
    name: "Oman",
    flag: "🇴🇲",
    currency: "OMR",
    priority: 6,
    active: false,
    feeds: [],
  },
];

export function getRegistry(): CountryConfig[] {
  if (typeof window === "undefined") return DEFAULT_COUNTRIES;
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return DEFAULT_COUNTRIES;
    const saved = JSON.parse(raw) as CountryConfig[];
    // Merge saved with defaults — new default countries appear automatically
    const merged = DEFAULT_COUNTRIES.map(def => {
      const found = saved.find(s => s.code === def.code);
      return found ? { ...def, ...found, feeds: def.feeds.map(df => {
        const ff = found.feeds?.find(f => f.id === df.id);
        return ff ? { ...df, ...ff } : df;
      })} : def;
    });
    // Add any user-added countries not in defaults
    const extra = saved.filter(s => !DEFAULT_COUNTRIES.find(d => d.code === s.code));
    return [...merged, ...extra];
  } catch {
    return DEFAULT_COUNTRIES;
  }
}

export function saveRegistry(countries: CountryConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(countries));
  } catch {}
}

export function getActiveFeeds(): FeedConfig[] {
  return getRegistry()
    .filter(c => c.active)
    .flatMap(c => c.feeds.filter(f => f.active));
}