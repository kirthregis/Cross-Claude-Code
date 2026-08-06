/**
 * UAE Live Booking Sources - DJ gigs only.
 * Every feed here is filtered for DJ booking signals before scoring.
 */
import type { RawLead } from "../types";

const DJ_KEYWORDS = [
  "dj", "disc jockey", "deejay", "d.j.",
  "dj booking", "dj wanted", "dj needed", "dj required", "dj hire",
  "dj set", "dj slot", "dj night", "dj gig", "dj residency",
  "resident dj", "book a dj", "need a dj", "looking for a dj",
  "afro house dj", "house dj", "techno dj", "dj performance",
  "entertainment booking", "music booking", "performer wanted",
  "dj opportunity", "nightclub dj", "club dj", "beach club dj",
];

function isDjContent(title: string, body: string): boolean {
  const text = (title + " " + body).toLowerCase();
  return DJ_KEYWORDS.some(k => text.includes(k));
}

async function fetchFeed(url: string, name: string, kind: RawLead["sourceKind"]): Promise<RawLead[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "EMY-GigRadar/1.0 (+https://emy-studio-rho.vercel.app)" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items = text.split(/<item>|<entry>/).slice(1);
    const leads: RawLead[] = [];
    for (const item of items.slice(0, 20)) {
      const pick = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
          ?.replace(/<![CDATA[|]]>/g, "")
          ?.replace(/<[^>]+>/g, "")
          ?.trim();
      const title = pick("title") ?? "";
      const body = pick("description") ?? pick("summary") ?? pick("content") ?? "";
      const link = pick("link") ?? "";
      const pubDate = pick("pubDate") ?? pick("published") ?? "";
      if (!isDjContent(title, body)) continue;
      leads.push({
        sourceKind: kind,
        sourceName: name,
        sourceUrl: link || undefined,
        title: title || `Listing from ${name}`,
        body: title + " " + body,
        postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
    return leads;
  } catch {
    return [];
  }
}

const FEEDS: { url: string; name: string; kind: RawLead["sourceKind"] }[] = [
  { url: "https://ae.indeed.com/rss?q=dj+booking&l=Dubai&sort=date", name: "Indeed DJ Booking Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj+performer+entertainment&l=Dubai&sort=date", name: "Indeed DJ Performer Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=nightclub+dj+dubai&sort=date", name: "Indeed Nightclub DJ Dubai", kind: "gig_board" },
  { url: "https://hozpitality.com/rss/jobs.xml", name: "Hozpitality UAE", kind: "gig_board" },
  { url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment", name: "GulfTalent Entertainment", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=dj+booking", name: "Bayt DJ Booking", kind: "gig_board" },
  { url: "https://ra.co/xml/feed.xml?area=62", name: "Resident Advisor Dubai", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=398", name: "Resident Advisor Doha", kind: "event_calendar" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=booking+UAE+Dubai&sort=new", name: "Reddit DJs UAE", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=afro+house+gig&sort=new", name: "Reddit Afro House", kind: "gig_board" },
  { url: "https://www.reddit.com/r/dubai/search.rss?q=dj+booking&sort=new", name: "Reddit Dubai DJ", kind: "gig_board" },
  { url: "https://nitter.net/search/rss?q=DJ+booking+Dubai&f=tweets", name: "Twitter DJ Booking Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+wanted+Dubai&f=tweets", name: "Twitter DJ Wanted Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=Afro+House+DJ+Dubai&f=tweets", name: "Twitter Afro House Dubai", kind: "instagram" },
  { url: "https://www.eventbrite.com/d/ae--dubai/dj/rss/", name: "Eventbrite Dubai DJ", kind: "event_calendar" },
];

export async function fetchUAELeads(): Promise<RawLead[]> {
  const results = await Promise.allSettled(FEEDS.map(f => fetchFeed(f.url, f.name, f.kind)));
  const leads: RawLead[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value);
  }
  const seen = new Set<string>();
  return leads.filter(l => {
    const key = l.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}