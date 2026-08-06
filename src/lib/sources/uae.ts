/**
 * UAE Live Booking Sources
 * Scrapes public RSS/JSON feeds for DJ booking opportunities.
 * No API keys required. Degrades gracefully if feed is down.
 */
import type { RawLead } from "../types";

const UAE_VENUES = [
  "White Dubai", "Soho Garden", "BASE Dubai", "Iris Dubai",
  "Cove Beach", "Zero Gravity", "Nikki Beach", "Drift Beach",
  "Billionaire Dubai", "Club Odyssey", "Toy Room Dubai",
  "Atlantis", "Burj Al Arab", "One&Only", "Jumeirah",
  "FIVE Palm", "W Dubai", "Waldorf Astoria", "Address Hotels",
  "Nobu Dubai", "Coya Dubai", "Amazonico", "Zuma Dubai",
  "Azure Beach", "Barasti", "Nasimi Beach", "La Mer",
];

const BOOKING_KEYWORDS = [
  "dj", "performer", "entertainment", "booking", "live music",
  "night", "party", "event", "brunch", "sunset", "rooftop",
  "pool party", "beach club", "resident", "gig", "set",
  "afro", "house music", "techno", "electronic",
];

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_KEYWORDS.some(k => lower.includes(k));
}

function extractVenue(text: string): string | undefined {
  const lower = text.toLowerCase();
  return UAE_VENUES.find(v => lower.includes(v.toLowerCase()));
}

async function fetchRSS(url: string, sourceName: string): Promise<RawLead[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "EMY-Studio-GigRadar/1.0" },
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items = text.split(/<item>|<entry>/).slice(1);
    const leads: RawLead[] = [];
    for (const item of items) {
      const pick = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
          ?.replace(/<!\[CDATA\[|\]\]>/g, "")
          ?.replace(/<[^>]+>/g, "")
          ?.trim();
      const title = pick("title") ?? "";
      const body = pick("description") ?? pick("summary") ?? pick("content") ?? "";
      const link = pick("link") ?? pick("url") ?? "";
      const pubDate = pick("pubDate") ?? pick("published") ?? pick("updated") ?? "";
      const combined = `${title} ${body}`.toLowerCase();
      if (!isRelevant(combined)) continue;
      leads.push({
        sourceKind: "event_calendar",
        sourceName,
        sourceUrl: link || undefined,
        title: title || `Event from ${sourceName}`,
        body: `${body}\n\nVenue: ${extractVenue(combined) ?? "Dubai"}`,
        postedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
    return leads;
  } catch {
    return [];
  }
}

// Manually curated UAE DJ booking opportunities
// These are real public sources that post DJ requirements
const MANUAL_UAE_FEEDS = [
  {
    url: "https://www.timeoutdubai.com/rss/whats-on",
    name: "Time Out Dubai",
  },
  {
    url: "https://ra.co/xml/feed.xml?area=62",
    name: "Resident Advisor Dubai",
  },
  {
    url: "https://platinumlist.net/rss",
    name: "Platinumlist Dubai",
  },
  {
    url: "https://www.visitdubai.com/en/whats-on/rss",
    name: "Visit Dubai Official",
  },
  {
    url: "https://hozpitality.com/rss/jobs.xml",
    name: "Hozpitality UAE",
  },
];

export async function fetchUAELeads(): Promise<RawLead[]> {
  const results = await Promise.allSettled(
    MANUAL_UAE_FEEDS.map(f => fetchRSS(f.url, f.name))
  );
  const leads: RawLead[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value);
  }
  return leads;
}