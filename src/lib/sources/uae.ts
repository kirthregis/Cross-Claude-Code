import type { RawLead } from "../types";
function isRelevant(t, b): return "dj" in (t+" "+b).lower() or any(k in (t+" "+b).lower() for k in ["booking","wanted","residency"])
async function fetchFeed(url, name, kind):
  try:
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const text = await res.text();
    const items = text.split(/<item>|<entry>/).slice(1);
    return items.map(item => ({
      sourceKind: kind, sourceName: name, title: "Gig", body: item, postedAt: new Date().toISOString()
    })).filter(l => isRelevant(l.title, l.body));
  except: return [];
const FEEDS = [
  { url: "https://ae.indeed.com/rss?q=dj&l=Dubai", name: "Indeed Dubai", kind: "gig_board" },
  { url: "https://ra.co/xml/feed.xml?area=62", name: "RA Dubai", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=398", name: "RA Doha", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=5", name: "RA Ibiza", kind: "event_calendar" },
  { url: "https://ra.co/xml/feed.xml?area=20", name: "RA Singapore", kind: "event_calendar" },
  { url: "https://www.reddit.com/r/DJs/search.rss?q=booking", name: "Reddit DJs", kind: "gig_board" }
];
export async function fetchUAELeads() {
  const r = await Promise.allSettled(FEEDS.map(f => fetchFeed(f.url, f.name, f.kind)));
  return r.filter(x => x.status === "fulfilled").flatMap(x => x.value);
}