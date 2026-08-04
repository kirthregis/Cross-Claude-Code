/**
 * Web scan — the "scour everything, 24/7" source.
 *
 * Unlike the fixed feed sources (which watch specific handles/boards), this one
 * actively searches the open web for anything that looks like a Dubai/UAE
 * entertainment or booking opportunity: news of venue openings and relaunches,
 * new music directors, residencies being announced, festivals and brand
 * activations, hotel entertainment hiring — surfaced BEFORE they get listed on
 * a promoter board. The goal is raw surface area: score + eyeballs filter.
 *
 * Two engines, both free and credential-free:
 *  1. Google News RSS search per keyword  — `news.google.com/rss/search?q=...`
 *  2. Any extra RSS/JSON feeds she lists in WEB_SEARCH_EXTRA_FEEDS.
 *
 * This runs on the same sweep the other sources use, so it is inherently
 * around-the-clock when the sweep runs 24/7 (Vercel/Cloudflare cron).
 */

import type { RawLead } from "../types";
import { parseRss } from "../rss";
import type { Source } from "./index";

const env = (k: string) => process.env[k]?.trim() || undefined;

/**
 * Sensible UAE defaults. Each becomes one Google News query. She can override
 * entirely via WEB_SEARCH_QUERIES (pipe "|" or comma separated) — e.g. add her
 * target venue names and the promoters she knows book premium slots.
 */
export const DEFAULT_WEB_QUERIES = [
  "Dubai DJ booking",
  "Dubai nightclub residency",
  "UAE event management company",
  "Dubai hotel entertainment",
  "Dubai beach club party",
  "Dubai brand activation event",
  "Dubai festival lineup",
  "Dubai rooftop bar launch",
  "Abu Dhabi event entertainment",
  "Dubai venue opening night",
  "Dubai private event entertainment",
  "Cove Beach OR Nikki Beach OR Soho Garden event",
  "UAE women DJ Afro house",
];

export const webSearchSource: Source = {
  id: "web",
  label: "Web scan — UAE entertainment & bookings",
  kind: "gig_board",
  setup:
    "FREE, no credentials. Scans Google News + your own feeds 24/7 for UAE " +
    "entertainment/booking opportunities. Customise with WEB_SEARCH_QUERIES " +
    "(pipe-separated) and WEB_SEARCH_EXTRA_FEEDS (RSS/JSON). Disable with " +
    "WEB_SEARCH_ON=false.",
  configured: () => env("WEB_SEARCH_ON") !== "false",
  async fetch() {
    const queries = (env("WEB_SEARCH_QUERIES") ?? DEFAULT_WEB_QUERIES.join("|"))
      .split(/[|,]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const extraFeeds = (env("WEB_SEARCH_EXTRA_FEEDS") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const leads: RawLead[] = [];
    const seen = new Set<string>();

    const push = (title: string, link: string | undefined, body: string, published: string) => {
      // Dedupe on a short title hash — Google News returns the same story across queries.
      const key = title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 56);
      if (seen.has(key)) return;
      seen.add(key);
      leads.push({
        sourceKind: "gig_board",
        sourceName: "Web scan",
        sourceUrl: link,
        title,
        body,
        postedAt: published,
      });
    };

    for (const q of queries) {
      try {
        const url =
          `https://news.google.com/rss/search?q=${encodeURIComponent(q)}` +
          `&hl=en-GB&gl=AE&ceid=AE:en`;
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) continue;
        const text = await res.text();
        for (const it of parseRss(text)) {
          push(it.title, it.link, `${q}\n${it.description ?? ""}`, it.published);
        }
      } catch {
        /* one query failing must not kill the sweep */
      }
    }

    for (const feed of extraFeeds) {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) continue;
        const text = await res.text();
        if (text.trimStart().startsWith("<")) {
          for (const it of parseRss(text)) push(it.title, it.link, it.description ?? "", it.published);
        } else {
          const json = JSON.parse(text) as Array<Record<string, string>>;
          for (const r of json) {
            const pub = r.published ?? r.pubDate ?? r.date ?? new Date().toISOString();
            push(r.title ?? r.name ?? "Web item", r.url ?? r.link, r.description ?? "", new Date(pub).toISOString());
          }
        }
      } catch {
        /* skip bad feed */
      }
    }

    return leads;
  },
};
