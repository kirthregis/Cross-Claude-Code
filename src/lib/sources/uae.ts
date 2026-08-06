/**
 * UAE Live Booking Sources - DJ and entertainment gigs.
 */
import type { RawLead } from "../types";

const DJ_KEYWORDS = [
  "dj", "disc jockey", "deejay",
  "booking", "book a", "looking for", "need a", "wanted",
  "required", "hiring", "hire", "residency", "resident",
  "set", "slot", "night", "gig", "opportunity",
  "performance", "entertainment", "music booking", "performer",
  "nightclub", "club", "beach club", "lounge", "rooftop",
  "afro house", "house music", "techno", "electronic",
  "brunch", "event", "party", "venue", "promoter",
  "dubai dj", "dj dubai", "uae dj", "dj uae",
];

function isRelevant(title: string, body: string): boolean {
  const text = (title + " " + body).toLowerCase();
  // Must mention DJ directly OR be a booking/entertainment lead in Dubai/UAE
  const hasDj = text.includes("dj") || text.includes("disc jockey") || text.includes("deejay");
  const hasBooking = ["booking", "looking for", "need a", "wanted", "hiring", "residency"].some(k => text.includes(k));
  const hasVenue = ["nightclub", "beach club", "lounge", "rooftop", "brunch", "afro house", "house music", "techno", "electronic"].some(k => text.includes(k));
  const hasDubai = ["dubai", "uae", "abu dhabi", "sharjah", "doha", "qatar"].some(k => text.includes(k));
  // Pass if: has DJ word, OR (has booking signal AND has Dubai/UAE AND has venue type)
  return hasDj || (hasBooking && hasDubai && hasVenue);
}

async function fetchFeed(url: string, name: string, kind: RawLead["sourceKind"]): Promise<RawLead[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EMY-GigRadar/1.0)" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items = text.split(/<item>|<entry>/).slice(1);
    const leads: RawLead[] = [];
    for (const item of items.slice(0, 30)) {
      const pick = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
          ?.replace(/<![CDATA[|]]>/g, "")
          ?.replace(/<[^>]+>/g, "")
          ?.trim();
      const title = pick("title") ?? "";
      const body = pick("description") ?? pick("summary") ?? pick("content") ?? "";
      const link = pick("link") ?? "";
      const pubDate = pick("pubDate") ?? pick("published") ?? "";
      if (!isRelevant(title, body)) continue;
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
  { url: "https://ae.indeed.com/rss?q=dj&l=Dubai&sort=date", name: "Indeed DJ Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj+booking&l=Dubai&sort=date", name: "Indeed DJ Booking Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=entertainment+performer&l=Dubai&sort=date", name: "Indeed Performer Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=nightclub+entertainment&l=Dubai&sort=date", name: "Indeed Nightclub Dubai", kind: "gig_board" },
  { url: "https://hozpitality.com/rss/jobs.xml", name: "Hozpitality UAE", kind: "gig_board" },
  { url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment", name: "GulfTalent Entertainment", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=dj", name: "Bayt DJ UAE", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=entertainment+booking", name: "Bayt Entertainment UAE", kind: "gig_board" },
  { url: "https://www.dubizzle.com/rss/jobs/?category=entertainment", name: "Dubizzle Entertainment", kind: "gig_board" },
  { url: "https://ra.co/xml/feed.xml?area=62", name: "Resident Advisor Dubai", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=398", name: "Resident Advisor Doha", kind: "event_calendar" },
  { url: "https://platinumlist.net/rss", name: "Platinumlist Dubai", kind: "event_calendar" },
  { url: "https://www.timeoutdubai.com/music/rss", name: "Time Out Dubai Music", kind: "event_calendar" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=booking+UAE+Dubai&sort=new", name: "Reddit DJs UAE", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=afro+house+gig&sort=new", name: "Reddit Afro House", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=dj+wanted&sort=new", name: "Reddit DJ Wanted", kind: "gig_board" },
  { url: "https://www.reddit.com/r/dubai/search.rss?q=dj+booking+event&sort=new", name: "Reddit Dubai Events", kind: "gig_board" },
  { url: "https://nitter.net/search/rss?q=DJ+booking+Dubai&f=tweets", name: "Twitter DJ Booking Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+wanted+Dubai&f=tweets", name: "Twitter DJ Wanted Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=Afro+House+DJ+Dubai&f=tweets", name: "Twitter Afro House Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=looking+for+DJ+Dubai&f=tweets", name: "Twitter Looking For DJ", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+residency+Dubai&f=tweets", name: "Twitter DJ Residency Dubai", kind: "instagram" },
  { url: "https://www.eventbrite.com/d/ae--dubai/dj/rss/", name: "Eventbrite Dubai DJ", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/electronic-music/rss/", name: "Eventbrite Electronic Dubai", kind: "event_calendar" },
  { url: "https://whatson.ae/feed/", name: "WhatsOn UAE", kind: "event_calendar" },
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