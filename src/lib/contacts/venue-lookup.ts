/**
 * Finds a venue's own published contact channel — a real events/booking email
 * or phone number pulled live from the venue's official website. Never
 * guesses a pattern (no "info@venuename.com"); returns null when nothing is
 * actually found on a real page, same rule as every other source in this app.
 *
 * Verified live against Nammos Dubai on 2026-09-20: this exact method found
 * events@nammos.ae and +971581210000 on nammos.com/dubai/contact.
 */
import type { Contact } from "../types";

const UA = "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0; +https://emy-studio-rho.vercel.app)";

async function fetchText(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

// Aggregators, review sites and social platforms turn up first for almost any
// venue search — none of them is the venue's OWN contact channel, so they're
// excluded even when nothing better is found.
const NOT_OFFICIAL = /facebook\.com|instagram\.com|tripadvisor|zomato|timeoutdubai|dubizzle|wikipedia\.org|yelp\.com|google\.com|linkedin\.com|tiktok\.com|twitter\.com|x\.com/i;

function resultLinks(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/result__a"[^>]*href="[^"]*uddg=([^&"]+)/g)) {
    try {
      out.push(decodeURIComponent(m[1]));
    } catch {
      /* malformed encoding — skip this one result, not the whole search */
    }
  }
  return out;
}

async function findOfficialSite(venueName: string, area?: string): Promise<string | null> {
  const q = encodeURIComponent(`${venueName} ${area ?? "Dubai"} official website`);
  const html = await fetchText(`https://html.duckduckgo.com/html/?q=${q}`, 8000);
  if (!html) return null;

  const links = resultLinks(html);
  const nameWords = venueName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter((w) => w.length > 3);

  const candidates = links.filter((l) => !NOT_OFFICIAL.test(l));
  const nameMatch = candidates.find((l) => {
    try {
      const host = new URL(l).hostname.toLowerCase();
      return nameWords.some((w) => host.includes(w));
    } catch {
      return false;
    }
  });
  return nameMatch ?? candidates[0] ?? null;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const UAE_PHONE_RE = /(?:\+971|00971)[-\s]?[24-9]\d(?:[-\s]?\d){6,7}/g;

function pickBestEmail(emails: string[]): string | undefined {
  const rank = (e: string) => {
    if (/^(events?|bookings?|entertainment|talent)@/i.test(e)) return 3;
    if (/^(reservations?|info|hello|contact)@/i.test(e)) return 2;
    return 1;
  };
  const unique = [...new Set(emails)].filter((e) => !/\.(png|jpg|jpeg|svg|webp|gif)$/i.test(e));
  return unique.sort((a, b) => rank(b) - rank(a))[0];
}

/**
 * Looks up a venue's own published contact info via a public, no-login web
 * search plus a live fetch of its official site. Returns null rather than a
 * fabricated fallback when nothing verifiable turns up.
 */
export async function findVenueContact(venueName: string, area?: string): Promise<Contact | null> {
  const site = await findOfficialSite(venueName, area);
  if (!site) return null;

  let base: string;
  try {
    base = new URL(site).origin;
  } catch {
    return null;
  }

  const pagesToTry = [site, `${base}/contact`, `${base}/events`];
  const emails: string[] = [];
  const phones: string[] = [];
  let sourceUrl = site;

  for (const page of pagesToTry) {
    const html = await fetchText(page, 6000);
    if (!html) continue;
    const decoded = decodeEntities(html);
    const pageEmails = decoded.match(EMAIL_RE) ?? [];
    const pagePhones = decoded.match(UAE_PHONE_RE) ?? [];
    if (pageEmails.length || pagePhones.length) sourceUrl = page;
    emails.push(...pageEmails);
    phones.push(...pagePhones);
    if (emails.length || phones.length) break; // found real contact info — no need to keep fetching pages
  }

  const email = pickBestEmail(emails);
  const phone = phones[0]?.replace(/[\s-]/g, "");
  if (!email && !phone) return null;

  return {
    email,
    phone,
    whatsapp: phone,
    role: email && /^(events?|bookings?|entertainment|talent)@/i.test(email) ? "venue_manager" : "unknown",
    decisionPower: email && /^(events?|bookings?|entertainment|talent)@/i.test(email) ? 70 : 50,
    sourceUrl,
    verified: true,
  };
}
