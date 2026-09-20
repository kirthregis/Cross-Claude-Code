/**
 * Finds a venue's own published contact channel — a real events/booking email
 * or phone number pulled live from the venue's official website. Never
 * guesses a pattern (no "info@venuename.com"); returns null when nothing is
 * actually found on a real page, same rule as every other source in this app.
 *
 * Finding the site itself does NOT use a search engine. Verified live from
 * this app's own Vercel deployment on 2026-09-20: DuckDuckGo (html + lite),
 * Bing, Google, Startpage, Yandex, Brave, Ecosia, Mojeek and six public
 * SearXNG instances are all either blocked outright or return content that
 * can't be parsed without running JavaScript, from Vercel's serverless IP
 * range specifically (all worked fine from a home connection) — search-engine
 * scraping only ever looked like it worked in local testing.
 *
 * Instead: guess the venue's domain straight from its own name (its most
 * distinctive word, plus the full name as one word, on .com/.ae) and fetch
 * each candidate directly — a plain HTTPS request, nothing to block. A
 * candidate is only accepted if the fetched page's own content confirms it's
 * really about this venue, which is where almost all of the risk lives: a
 * short, dictionary-word brand name (e.g. "Act Restaurant" guessing act.com)
 * can land on a real, unrelated company that just happens to own that word.
 * See isSpecificEnoughMatch() for the rule that guards against exactly that.
 */
import type { Contact } from "../types";

const UA = "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0; +https://emy-studio-rho.vercel.app)";

async function fetchText(url: string, timeoutMs: number): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { "User-Agent": UA }, redirect: "follow" });
    if (!res.ok) return null;
    return { html: await res.text(), finalUrl: res.url };
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

// Pure grammatical filler — never part of a brand name, but still fine to
// drop from candidate words entirely (no venue is meaningfully "and.com").
const STOPWORDS = new Set(["and", "the", "for", "with", "at"]);

// Short/common English words that are also real, unrelated brand names — a
// domain guess built from just ONE of these proves nothing on its own
// (act.com is a real company, not the Dubai restaurant "Act"). Extend this
// list as new false positives turn up rather than lowering the length
// threshold below it.
const AMBIGUOUS_SHORT_WORDS = new Set(["act", "base", "club", "play", "live", "home", "park", "city", "cafe", "view", "edge"]);

function venueWords(venueName: string): string[] {
  return venueName
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

interface Candidate {
  url: string;
  /** The word(s) this URL was built from — what a match on this URL must confirm. */
  words: string[];
}

/**
 * Guesses at the venue's domain from its own name: its first word alone
 * (e.g. "nammos"), its first two words joined (e.g. "actrestaurant" — this is
 * usually the real pattern for a "Brand + venue-type" name), and the full
 * name as one word, each on .com and .ae.
 */
function domainCandidates(words: string[]): Candidate[] {
  if (!words.length) return [];
  const groupings: string[][] = [[words[0]]];
  if (words.length > 1) groupings.push([words[0], words[1]]);
  if (words.length > 2) groupings.push(words);

  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const group of groupings) {
    const base = group.join("");
    for (const tld of ["com", "ae"]) {
      for (const url of [`https://www.${base}.${tld}`, `https://${base}.${tld}`]) {
        if (seen.has(url)) continue;
        seen.add(url);
        out.push({ url, words: group });
      }
    }
  }
  return out;
}

/**
 * The false-positive guard. A candidate built from two or more words (e.g.
 * "act" + "restaurant") is accepted once the page confirms ALL of them —
 * a real, unrelated company sharing that exact word combination is
 * vanishingly unlikely. A candidate built from a SINGLE word is only
 * trusted when that word is confirmed AND isn't a short, common English
 * word a real unrelated company could equally own.
 */
function isSpecificEnoughMatch(html: string, candidateWords: string[]): boolean {
  const lower = html.toLowerCase();
  const confirmed = candidateWords.every((w) => lower.includes(w));
  if (!confirmed) return false;
  if (candidateWords.length >= 2) return true;
  const [word] = candidateWords;
  return word.length >= 4 && !AMBIGUOUS_SHORT_WORDS.has(word);
}

async function findOfficialSite(venueName: string): Promise<string | null> {
  const words = venueWords(venueName);
  if (!words.length) return null;
  const candidates = domainCandidates(words);

  const fetched = await Promise.all(candidates.map((c) => fetchText(c.url, 5000)));
  for (let i = 0; i < fetched.length; i++) {
    const f = fetched[i];
    if (!f) continue;
    if (isSpecificEnoughMatch(f.html, candidates[i].words)) {
      return f.finalUrl || candidates[i].url;
    }
  }
  return null;
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
 * Looks up a venue's own published contact info: guesses its domain from its
 * name, confirms the guess against the fetched page's own content, then
 * reads its real email/phone. Returns null rather than a fabricated fallback
 * when nothing verifiable turns up, or when the domain guess can't be
 * confirmed specifically enough to trust.
 */
export async function findVenueContact(venueName: string): Promise<Contact | null> {
  const site = await findOfficialSite(venueName);
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
    const fetched = await fetchText(page, 6000);
    if (!fetched) continue;
    const decoded = decodeEntities(fetched.html);
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
