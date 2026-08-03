/**
 * Where UAE DJ gigs actually get posted.
 *
 * Curated from live research rather than guessed. Each entry is a real,
 * publicly fetchable listing surface that carries DJ work reachable from the
 * UAE. Sources that require login, or that forbid scraping, are deliberately
 * excluded — see NOT_COVERED at the bottom for the honest gaps.
 */

export interface FeedSource {
  id: string;
  label: string;
  url: string;
  kind: "rss" | "json" | "html";
  /** Only keep items matching this — most boards are general job sites. */
  match?: RegExp;
  /** Skip obvious noise (nurse jobs on a generic "dj" keyword search, etc). */
  reject?: RegExp;
}

const DJ_TERMS = /\b(dj|disc jockey|deejay|resident dj|selector|turntab)/i;

const NOISE = /\b(nurse|endocrinolog|neonatolog|teacher|driver|accountant|receptionist|sharaf dj|massage|cleaner|security guard|sales executive|warehouse|technician)\b/i;

/**
 * Jooble aggregates most UAE job boards (Bayt, GulfTalent, Indeed AE and
 * others) and exposes RSS per keyword — one fetch covers many boards.
 */
const jooble = (q: string) =>
  `https://ae.jooble.org/rss/${encodeURIComponent(q)}`;

export const DEFAULT_FEEDS: FeedSource[] = [
  // --- Aggregated job boards (widest net, one request each)
  { id: "jooble-dj-dubai", label: "Jooble — DJ, Dubai", kind: "rss",
    url: jooble("dj/Dubai"), match: DJ_TERMS, reject: NOISE },
  { id: "jooble-dj-uae", label: "Jooble — DJ, UAE", kind: "rss",
    url: jooble("dj"), match: DJ_TERMS, reject: NOISE },
  { id: "jooble-resident-dj", label: "Jooble — resident DJ", kind: "rss",
    url: jooble("resident dj"), match: DJ_TERMS, reject: NOISE },
  { id: "jooble-djs-wanted", label: "Jooble — DJs wanted", kind: "rss",
    url: jooble("djs wanted"), match: DJ_TERMS, reject: NOISE },
  { id: "jooble-entertainment", label: "Jooble — entertainment, Dubai", kind: "rss",
    url: jooble("entertainment dj/Dubai"), match: DJ_TERMS, reject: NOISE },

  // --- Entertainment-specific boards
  { id: "ewj-dj-uae", label: "Entertainers Worldwide — DJ, UAE", kind: "html",
    url: "https://www.entertainersworldwidejobs.com/dj-jobs/ae", match: DJ_TERMS },
  { id: "ewj-dj-all", label: "Entertainers Worldwide — DJ jobs", kind: "html",
    url: "https://www.entertainersworldwidejobs.com/dj-jobs", match: /\b(uae|dubai|abu dhabi|qatar|doha|gulf|gcc)\b/i },
  { id: "djagency", label: "DJ Agency — DJ jobs", kind: "html",
    url: "https://djagency.co/dj-jobs/", match: /\b(uae|dubai|abu dhabi|qatar|doha|gulf)\b/i },

  // --- Gulf hospitality (hotels programme most resident slots)
  { id: "careersingulf", label: "Careers in Gulf — entertainment", kind: "html",
    url: "https://careersingulf.com/jobs/hospitality", match: DJ_TERMS, reject: NOISE },
  { id: "gulftalent", label: "GulfTalent — DJ", kind: "html",
    url: "https://www.gulftalent.com/uae/jobs/search?q=dj", match: DJ_TERMS, reject: NOISE },
];

/**
 * Being straight about what CANNOT be automated, so nobody is sold a promise
 * the tool can't keep:
 *
 * - Instagram / TikTok: no API returns other accounts' posts, stories or DMs.
 *   Third-party scrapers violate the terms and get accounts banned. This is
 *   where a lot of Dubai nightlife booking starts, and it must be pasted in.
 *   The app's "New gig" tab makes that a single paste.
 *
 * - WhatsApp promoter groups: no read API exists. A self-hosted bridge can
 *   forward messages to /ingest/whatsapp, which is supported — but it is a
 *   deliberate setup step, not something that happens automatically.
 *
 * - Private agency mailouts: these arrive by email. Cloudflare Email Routing
 *   can forward the booking inbox to /ingest/email, which covers them fully.
 *
 * "Every gig on the UAE internet" is not achievable by anyone — the highest
 * value bookings never get posted publicly at all. What IS achievable:
 * every PUBLIC listing, plus every email, plus one-tap capture of anything
 * she spots herself.
 */
export const NOT_COVERED = [
  "Instagram & TikTok posts/stories (no API; scrapers get accounts banned)",
  "WhatsApp groups (needs a self-hosted bridge to /ingest/whatsapp)",
  "Word-of-mouth and direct promoter calls",
] as const;
