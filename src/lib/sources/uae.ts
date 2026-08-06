import type { RawLead } from "../types";

function isRelevant(title: string, body: string): boolean {
  const text = (title + " " + body).toLowerCase();
  const hasDj = text.includes("dj") || text.includes("disc jockey") || text.includes("deejay");
  const hasBooking = ["booking", "looking for", "need a", "wanted", "hiring", "hire", "residency", "resident", "gig", "performer", "entertainment"].some(k => text.includes(k));
  const hasMusic = ["afro house", "house music", "techno", "electronic", "nightclub", "beach club", "lounge", "rooftop", "brunch", "club night", "live music"].some(k => text.includes(k));
  return hasDj || (hasBooking && hasMusic);
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
          ?.replace(/<!\[CDATA\[|\]\]>/g, "")
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
  // GCC - UAE
  { url: "https://ae.indeed.com/rss?q=dj&l=Dubai&sort=date", name: "Indeed DJ Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj+booking&l=Dubai&sort=date", name: "Indeed DJ Booking Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=nightclub+entertainment&l=Dubai&sort=date", name: "Indeed Nightclub Dubai", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Abu+Dhabi&sort=date", name: "Indeed DJ Abu Dhabi", kind: "gig_board" },
  { url: "https://hozpitality.com/rss/jobs.xml", name: "Hozpitality UAE", kind: "gig_board" },
  { url: "https://www.gulftalent.com/rss/jobs.xml?category=entertainment", name: "GulfTalent Entertainment", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=dj", name: "Bayt DJ UAE", kind: "gig_board" },
  { url: "https://www.bayt.com/en/uae/jobs/rss/?q=entertainment+booking", name: "Bayt Entertainment UAE", kind: "gig_board" },
  { url: "https://www.dubizzle.com/rss/jobs/?category=entertainment", name: "Dubizzle Entertainment UAE", kind: "gig_board" },
  { url: "https://ra.co/xml/feed.xml?area=62", name: "Resident Advisor Dubai", kind: "event_calendar" },
  { url: "https://platinumlist.net/rss", name: "Platinumlist Dubai", kind: "event_calendar" },
  { url: "https://www.timeoutdubai.com/music/rss", name: "Time Out Dubai Music", kind: "event_calendar" },
  { url: "https://whatson.ae/feed/", name: "WhatsOn UAE", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/dj/rss/", name: "Eventbrite Dubai DJ", kind: "event_calendar" },
  { url: "https://www.eventbrite.com/d/ae--dubai/electronic-music/rss/", name: "Eventbrite Electronic Dubai", kind: "event_calendar" },
  // GCC - Qatar
  { url: "https://ra.co/xml/feed.xml?area=398", name: "Resident Advisor Doha", kind: "event_calendar" },
  { url: "https://www.bayt.com/en/qatar/jobs/rss/?q=dj", name: "Bayt DJ Qatar", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Qatar&sort=date", name: "Indeed DJ Qatar", kind: "gig_board" },
  // GCC - Saudi Arabia
  { url: "https://www.bayt.com/en/saudi-arabia/jobs/rss/?q=dj", name: "Bayt DJ Saudi Arabia", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Riyadh&sort=date", name: "Indeed DJ Riyadh", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Jeddah&sort=date", name: "Indeed DJ Jeddah", kind: "gig_board" },
  // GCC - Bahrain Kuwait Oman
  { url: "https://www.bayt.com/en/bahrain/jobs/rss/?q=dj", name: "Bayt DJ Bahrain", kind: "gig_board" },
  { url: "https://www.bayt.com/en/kuwait/jobs/rss/?q=dj", name: "Bayt DJ Kuwait", kind: "gig_board" },
  { url: "https://www.bayt.com/en/oman/jobs/rss/?q=dj", name: "Bayt DJ Oman", kind: "gig_board" },
  // Mediterranean - Turkey
  { url: "https://ra.co/xml/feed.xml?area=37", name: "Resident Advisor Istanbul", kind: "event_calendar" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Istanbul&sort=date", name: "Indeed DJ Istanbul", kind: "gig_board" },
  // Mediterranean - Greece
  { url: "https://ra.co/xml/feed.xml?area=45", name: "Resident Advisor Athens", kind: "event_calendar" },
  // Mediterranean - Spain Ibiza
  { url: "https://ra.co/xml/feed.xml?area=5", name: "Resident Advisor Ibiza", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=13", name: "Resident Advisor Barcelona", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=14", name: "Resident Advisor Madrid", kind: "event_calendar" },
  // Mediterranean - France Italy
  { url: "https://ra.co/xml/feed.xml?area=9", name: "Resident Advisor Paris", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=11", name: "Resident Advisor Milan", kind: "event_calendar" },
  // Mediterranean - Egypt Lebanon Morocco
  { url: "https://www.bayt.com/en/egypt/jobs/rss/?q=dj", name: "Bayt DJ Egypt", kind: "gig_board" },
  { url: "https://www.bayt.com/en/lebanon/jobs/rss/?q=dj", name: "Bayt DJ Lebanon", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Cairo&sort=date", name: "Indeed DJ Cairo", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Beirut&sort=date", name: "Indeed DJ Beirut", kind: "gig_board" },
  // Asia - Singapore Malaysia Thailand Indonesia
  { url: "https://ra.co/xml/feed.xml?area=20", name: "Resident Advisor Singapore", kind: "event_calendar" },
  { url: "https://sg.indeed.com/rss?q=dj&l=Singapore&sort=date", name: "Indeed DJ Singapore", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Bangkok&sort=date", name: "Indeed DJ Bangkok", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Kuala+Lumpur&sort=date", name: "Indeed DJ Kuala Lumpur", kind: "gig_board" },
  { url: "https://ae.indeed.com/rss?q=dj&l=Bali&sort=date", name: "Indeed DJ Bali", kind: "gig_board" },
  // Asia - India
  { url: "https://in.indeed.com/rss?q=dj+booking&l=Mumbai&sort=date", name: "Indeed DJ Mumbai", kind: "gig_board" },
  { url: "https://in.indeed.com/rss?q=dj+booking&l=Goa&sort=date", name: "Indeed DJ Goa", kind: "gig_board" },
  // Asia - Japan South Korea
  { url: "https://ra.co/xml/feed.xml?area=25", name: "Resident Advisor Tokyo", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=61", name: "Resident Advisor Seoul", kind: "event_calendar" },
  // UK
  { url: "https://ra.co/xml/feed.xml?area=2", name: "Resident Advisor London", kind: "event_calendar" },
  { url: "https://www.totaljobs.com/rss?keywords=dj+booking&location=London", name: "Total Jobs DJ London", kind: "gig_board" },
  // Community
  { url: "https://www.reddit.com/r/DJs/search.rss?q=booking+UAE+Dubai&sort=new", name: "Reddit DJs UAE", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=afro+house+gig&sort=new", name: "Reddit Afro House", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=dj+wanted+booking&sort=new", name: "Reddit DJ Wanted", kind: "gig_board" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=gig+middle+east&sort=new", name: "Reddit DJ Middle East", kind: "gig_board" },
  { url: "https://www.reddit.com/r/dubai/search.rss?q=dj+booking+event&sort=new", name: "Reddit Dubai DJ", kind: "gig_board" },
  { url: "https://nitter.net/search/rss?q=DJ+booking+Dubai&f=tweets", name: "Twitter DJ Booking Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+wanted+Dubai&f=tweets", name: "Twitter DJ Wanted Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=Afro+House+DJ+Dubai&f=tweets", name: "Twitter Afro House Dubai", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=DJ+booking+GCC&f=tweets", name: "Twitter DJ Booking GCC", kind: "instagram" },
  { url: "https://nitter.net/search/rss?q=looking+for+DJ+UAE&f=tweets", name: "Twitter Looking For DJ UAE", kind: "instagram" },
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