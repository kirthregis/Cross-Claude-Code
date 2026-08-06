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
        label: "Platinumlist Dubai",
        url: "https://platinumlist.net/rss",
        kind: "rss",
        active: true,
      },
      {
        id: "timeout-dubai",
        label: "Time Out Dubai Events",
        url: "https://www.timeoutdubai.com/rss/whats-on",
        kind: "rss",
        active: true,
      },
      {
        id: "ra-dubai",
        label: "Resident Advisor Dubai",
        url: "https://ra.co/xml/feed.xml?area=62",
        kind: "rss",
        active: true,
      },
      {
        id: "hozpitality",
        label: "Hozpitality UAE Jobs",
        url: "https://hozpitality.com/rss/jobs.xml",
        kind: "rss",
        active: true,
      },
      {
        id: "dubai-calendar",
        label: "Dubai Calendar",
        url: "https://www.visitdubai.com/en/whats-on/rss",
        kind: "rss",
        active: true,
      },
      {
        id: "gulftalent",
        label: "Gulf Talent Entertainment",
        url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment",
        kind: "rss",
        active: true,
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
        label: "Qatar Tourism Events",
        url: "https://www.visitqatar.qa/rss/events",
        kind: "rss",
        active: true,
      },
      {
        id: "ra-doha",
        label: "Resident Advisor Doha",
        url: "https://ra.co/xml/feed.xml?area=398",
        kind: "rss",
        active: true,
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
        label: "MDL Beast Events",
        url: "https://mdlbeast.com/rss",
        kind: "rss",
        active: true,
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