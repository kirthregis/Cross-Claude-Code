/**
 * UAE Live Booking Sources.
 *
 * Every RSS URL previously here — Time Out Dubai, Resident Advisor,
 * Platinumlist, Visit Dubai, Hozpitality — is dead: 404, 405, or a redirect
 * to an HTML page, none of them actual feeds. Verified by hand on 2026-09-19
 * (see the sweep that reported "0 leads" against every one of them). They
 * read as plausible feed URLs but nobody had checked they still resolved.
 *
 * Replaced with careersingulf.com, a WP-Job-Manager-based board that is
 * actually reachable (no bot-block) and returns real, structured listings
 * — verified against real DJ/entertainment postings before wiring this in.
 * It's HTML, not RSS, so this scrapes a known-stable list markup pattern
 * rather than parsing feed XML; it degrades to nothing (not to fake data)
 * if that markup changes.
 */
import type { RawLead } from "../types";

// Deliberately tight. "entertainment", "music", "club", "sound" and similar
// broad words were tried first and, verified against a live fetch, matched
// unrelated corporate roles at Majid Al Futtaim Entertainment (a cinema/ski
// operator, not a nightlife venue) purely because "Entertainment" sits in
// every one of that company's job titles — false positives, not fabricated
// data, but the same failure mode: something that looks relevant but isn't.
const DJ_RE = /\b(dj|disc jockey|resident dj|nightclub|beach club|beach bar|afro house|house music|techno dj|party dj|festival dj)\b/i;
const NON_RE = /\b(real estate|villa for sale|puppy|puppies|used car|maid|driver needed|cleaner|credit card|loan|mortgage|engineer|technician|director of technical|cinema|finance executive|graphic designer|data privacy|it systems|customer service|sales coordinator|sales manager)\b/i;

const CATEGORY_PAGES = [
  { url: "https://careersingulf.com/category/hospitality-jobs.html", label: "CareersInGulf — Hospitality" },
  { url: "https://careersingulf.com/category/entertainment-jobs.html", label: "CareersInGulf — Entertainment" },
];

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchCareersInGulf(pageUrl: string, sourceName: string): Promise<RawLead[]> {
  try {
    const res = await fetch(pageUrl, {
      signal: AbortSignal.timeout(12000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; EMYStudioGigRadar/1.0; +https://emy-studio-rho.vercel.app)" },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const rows = html.split(/<tr bgcolor=/).slice(1);
    const leads: RawLead[] = [];
    for (const row of rows) {
      const titleMatch = row.match(/<a class="job_list_title" href="([^"]+)"[^>]*>([^<]+)<\/a>/);
      if (!titleMatch) continue;
      const url = titleMatch[1];
      const title = decodeEntities(titleMatch[2]).trim();
      const employerMatch = row.match(/Job Posted By:<\/b>\s*<a[^>]*><i>([^<]+)<\/i>/);
      const employer = employerMatch ? decodeEntities(employerMatch[1]).trim() : undefined;
      const combined = `${title} ${employer ?? ""}`;
      if (!DJ_RE.test(combined) || NON_RE.test(combined)) continue;
      leads.push({
        sourceKind: "gig_board",
        sourceName,
        sourceUrl: url,
        title,
        body: employer ? `Posted by ${employer} on CareersInGulf.` : "Listed on CareersInGulf.",
        postedAt: new Date().toISOString(),
      });
    }
    return leads;
  } catch {
    return [];
  }
}

export async function fetchUAELeads(): Promise<RawLead[]> {
  const results = await Promise.allSettled(CATEGORY_PAGES.map((p) => fetchCareersInGulf(p.url, p.label)));
  const leads: RawLead[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value);
  }
  return leads;
}
