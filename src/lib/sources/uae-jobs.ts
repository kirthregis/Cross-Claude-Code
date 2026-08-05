/**
 * UAE Jobs — Live booking opportunity fetcher.
 * Pulls from free public sources daily. No API key needed.
 */

import type { RawLead } from "../types";

export interface JobListing {
  id: string;
  title: string;
  venue: string;
  area: string;
  type: string;
  contact: string;
  url?: string;
  postedAt: string;
}

// Free public RSS/JSON sources for UAE entertainment jobs
const FREE_SOURCES = [
  {
    id: "dubizzle-entertainment",
    name: "Dubizzle Entertainment",
    url: "https://uae.dubizzle.com/jobs/entertainment-media-arts/?format=json",
    kind: "gig_board" as const,
  },
  {
    id: "timeoutdubai-events",
    name: "Time Out Dubai Events",
    url: "https://www.timeoutdubai.com/music/rss",
    kind: "event_calendar" as const,
  },
  {
    id: "platinumlist-dubai",
    name: "Platinumlist Dubai",
    url: "https://dubai.platinumlist.net/rss",
    kind: "event_calendar" as const,
  },
  {
    id: "residentadvisor-dubai",
    name: "Resident Advisor Dubai",
    url: "https://ra.co/rss/dubai",
    kind: "event_calendar" as const,
  },
  {
    id: "indeed-dj-dubai",
    name: "Indeed DJ Jobs UAE",
    url: "https://ae.indeed.com/rss?q=dj&l=Dubai",
    kind: "gig_board" as const,
  },
  {
    id: "linkedin-dj-dubai",
    name: "LinkedIn DJ Dubai",
    url: "https://www.linkedin.com/jobs/search/?keywords=dj&location=Dubai&f_TPR=r86400&format=json",
    kind: "gig_board" as const,
  },
];

function parseRSS(xml: string, sourceName: string, kind: RawLead["sourceKind"]): RawLead[] {
  const out: RawLead[] = [];
  const items = xml.split(/<item>|<entry>/).slice(1);
  for (const it of items) {
    const pick = (tag: string) =>
      it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
        ?.replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim();
    const title = pick("title") ?? "Gig listing";
    const body = pick("description") ?? pick("summary") ?? "";
    const url = pick("link") ?? pick("url");
    const postedAt = pick("pubDate") ?? pick("published") ?? new Date().toISOString();
    if (title) {
      out.push({
        sourceKind: kind,
        sourceName,
        sourceUrl: url,
        title,
        body,
        postedAt: new Date(postedAt).toISOString(),
      });
    }
  }
  return out;
}

export async function fetchUaeJobs(): Promise<RawLead[]> {
  const out: RawLead[] = [];
  await Promise.allSettled(
    FREE_SOURCES.map(async (s) => {
      try {
        const res = await fetch(s.url, {
          signal: AbortSignal.timeout(10_000),
          headers: { "User-Agent": "EMYStudio/1.0 (+https://emy-studio-rho.vercel.app)" },
        });
        if (!res.ok) return;
        const text = await res.text();
        if (text.trimStart().startsWith("<")) {
          out.push(...parseRSS(text, s.name, s.kind));
        } else {
          try {
            const json = JSON.parse(text);
            const rows = Array.isArray(json) ? json : json.results ?? json.data ?? [];
            for (const r of rows) {
              out.push({
                sourceKind: s.kind,
                sourceName: s.name,
                sourceUrl: r.url ?? r.link,
                externalId: String(r.id ?? r.jobId ?? ""),
                title: r.title ?? r.name ?? "Gig",
                body: r.description ?? r.body ?? "",
                postedAt: r.postedAt ?? r.date ?? new Date().toISOString(),
              });
            }
          } catch { /* not JSON */ }
        }
      } catch { /* skip failed source */ }
    })
  );
  return out;
}