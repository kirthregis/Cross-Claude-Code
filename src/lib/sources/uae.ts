/**
 * UAE Live Booking Sources -- expanded to maximum free internet coverage.
 * Every source here is free, public, no API key required.
 * Pulls from job boards, event calendars, venue feeds, DJ communities,
 * Reddit, Nitter, Eventbrite, and direct venue RSS.
 */
import type { RawLead } from "../types";

const BOOKING_KEYWORDS = [
  "dj", "disc jockey", "performer", "entertainment", "booking",
  "live music", "night", "party", "event", "brunch", "sunset",
  "rooftop", "pool party", "beach club", "resident", "gig", "set",
  "afro house", "house music", "techno", "electronic", "afrobeats",
  "wanted", "looking for", "hiring", "vacancy", "opportunity",
  "open call", "audition", "residency", "casting",
];

const UAE_VENUES_LC = [
  "white dubai", "soho garden", "base dubai", "iris dubai", "cove beach",
  "zero gravity", "nikki beach", "drift beach", "billionaire", "odyssey",
  "atlantis", "burj al arab", "jumeirah", "five palm", "w dubai",
  "waldorf", "address hotel", "nobu", "coya", "zuma", "azure beach",
  "barasti", "nasimi", "nammos", "twiggy", "cielo", "toy room",
  "rixos", "amwaj", "zeus", "la mer", "city walk", "bluewaters",
  "palm jumeirah", "difc", "dubai marina", "jbr", "downtown dubai",
  "business bay", "deira", "bur dubai", "meydan", "festival city",
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  const hasDjWord = BOOKING_KEYWORDS.some(k => lower.includes(k));
  const hasUaeVenue = UAE_VENUES_LC.some(v => lower.includes(v));
  return hasDjWord || hasUaeVenue;
}

function extractVenue(text: string): string | undefined {
  const lower = text.toLowerCase();
  return UAE_VENUES_LC.find(v => lower.includes(v));
}

async function fetchRSS(url: string, sourceName: string, kind: RawLead["sourceKind"] = "event_calendar"): Promise<RawLead[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EMY-GigRadar/1.0; +https://emy-studio-rho.vercel.app)",
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
      },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items = text.split(/<item>|<entry>/).slice(1);
    const leads: RawLead[] = [];
    for (const item of items.slice(0, 30)) {
      const pick = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
          ?.replace(/<!\[CDATA\[|\]\]>/g, "")
          ?.replace(/<[^>]+>/g, "")
          ?.trim();
      const title = pick("title") ?? "";
      const body = pick("description") ?? pick("summary") ?? pick("content") ?? "";
      const link = pick("link") ?? pick("url") ?? "";
      const pubDate = pick("pubDate") ?? pick("published") ?? pick("updated") ?? "";
      const combined = `${title} ${body}`;
      if (!isRelevant(combined)) continue;
      leads.push({
        sourceKind: kind,
        sourceName,
        sourceUrl: link || undefined,
        title: title || `Listing from ${sourceName}`,
        body: combined,
        postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
    return leads;
  } catch {
    return [];
  }
}

// All free public feeds -- no API key needed
const ALL_FEEDS: { url: string; name: string; kind: RawLead["sourceKind"] }[] = [
  // --- Event calendars ---
  { url: "https://www.timeoutdubai.com/rss/whats-on", name: "Time Out Dubai", kind: "event_calendar" },
  { url: "https://www.timeoutdubai.com/music/rss", name: "Time Out Dubai Music", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=62", name: "Resident Advisor Dubai", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=398", name: "Resident Advisor Doha", kind: "event_calendar" },
  { url: "https://platinumlist.net/rss", name: "Platinumlist Dubai", kind: "event_calendar" },
  { url: "https://dubai.platinumlist.net/rss", name: "Platinumlist Dubai 2", kind: "event_calendar" },
  { url: "https://www.visitdubai.com/en/whats-on/rss", name: "Visit Dubai Official", kind: "event_calendar" },
  { url: "https://www.dubaicalendar.com/events/rss.xml", name: "Dubai Calendar", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/dj/rss/", name: "Eventbrite Dubai DJ", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/electronic-music/rss/", name: "Eventbrite Dubai Electronic", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/nightlife/rss/", name: "Eventbrite Dubai Nightlife", kind: "event_calendar" },
  { url: "https://www.meetup.com/find/events/?allMeetups=true&keywords=dj+dubai&radius=25&userFreeform=Dubai&mcId=z1011011&mcName=Dubai%2C+AE&sort=default&format=rss", name: "Meetup Dubai DJ Events", kind: "event_calendar" },
  // --- Job boards (booking intent) ---
  { url: "https://ae.indeed.com/rss?q=dj+booking&l=Dubai&sort=date", name: "Indeed DJ Booking Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj+performer+entertainment&l=Dubai&sort=date", name: "Indeed Performer Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=nightclub+entertainment+manager&l=Dubai&sort=date", name: "Indeed Nightclub Dubai", kind: "gig_board" },
  { url: "https://hozpitality.com/rss/jobs.xml", name: "Hozpitality UAE", kind: "gig_board" },
  { url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment", name: "GulfTalent Entertainment", kind: "gig_board" },
  { url: "https://www.naukrigulf.com/rss/jobs-in-uae.xml?searchQuery=dj", name: "NaukriGulf DJ UAE", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=dj+booking", name: "Bayt DJ Booking UAE", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=entertainment+booking", name: "Bayt Entertainment UAE", kind: "gig_board" },
  { url: "https://www.dubizzle.com/rss/jobs/?category=entertainment&q=dj", name: "Dubizzle DJ Jobs", kind: "gig_board" },
  { url: "https://www.monster.com.au/rss/search/jobs/?q=dj&where=Dubai+UAE", name: "Monster DJ Dubai", kind: "gig_board" },
  // --- DJ communities and public social ---
  { url: "https://nitter.net/search/rss?q=DJ+booking+Dubai&f=tweets", name: "Twitter DJ Booking Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+wanted+Dubai&f=tweets", name: "Twitter DJ Wanted Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=looking+for+DJ+Dubai&f=tweets", name: "Twitter Looking For DJ Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=Afro+House+DJ+Dubai&f=tweets", name: "Twitter Afro House Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+booking+UAE&f=tweets", name: "Twitter DJ Booking UAE", kind: "instagram" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=booking+UAE+Dubai&sort=new", name: "Reddit DJs UAE", kind: "gig_board" },
  { url: "https://www.reddit.com/r/dubai/search.rss?q=dj+booking+event&sort=new", name: "Reddit Dubai Events", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=afro+house+gig&sort=new", name: "Reddit Afro House Gigs", kind: "gig_board" },
  { url: "https://www.reddit.com/r/electronicmusic/search.rss?q=DJ+booking+Middle+East&sort=new", name: "Reddit Electronic Dubai", kind: "gig_board" },
  // --- Entertainment and nightlife publications ---
  { url: "https://whatson.ae/feed/", name: "What's On UAE", kind: "event_calendar" },
  { url: "https://www.esquireme.com/feeds/articles.rss", name: "Esquire ME Entertainment", kind: "event_calendar" },
  { url: "https://www.arabianbusiness.com/rss/entertainment.rss", name: "Arabian Business Entertainment", kind: "event_calendar" },
  { url: "https://gulfnews.com/rss/entertainment", name: "Gulf News Entertainment", kind: "event_calendar" },
  { url: "https://www.khaleejtimes.com/rss/entertainment", name: "Khaleej Times Entertainment", kind: "event_calendar" },
  // --- Hospitality and F&B industry ---
  { url: "https://www.hospitalitynet.org/rss/feature.rss", name: "Hospitality Net Middle East", kind: "gig_board" },
  { url: "https://www.caterer.com/rss/jobs.aspx?keywords=entertainment+manager&location=Dubai", name: "Caterer Entertainment Dubai", kind: "gig_board" },
  { url: "https://www.totaljobs.com/rss?keywords=dj+booking&location=Dubai", name: "Total Jobs DJ Dubai", kind: "gig_board" },
];

export async function fetchUAELeads(): Promise<RawLead[]> {
  const results = await Promise.allSettled(
    ALL_FEEDS.map(f => fetchRSS(f.url, f.name, f.kind))
  );
  const leads: RawLead[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value);
  }
  // Dedupe by title similarity
  const seen = new Set<string>();
  return leads.filter(l => {
    const key = l.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
