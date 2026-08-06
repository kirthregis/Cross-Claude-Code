/**
 * Source adapters -- the radar antennae.
 * UAE is always priority 1. Registry expands globally.
 * Every free public internet source is wired here.
 */
import type { RawLead } from "../types";
import { getRegistry } from "./registry";
import { fetchUAELeads } from "./uae";

export interface Source {
  id: string;
  label: string;
  kind: RawLead["sourceKind"];
  setup: string;
  configured(): boolean;
  fetch(): Promise<RawLead[]>;
}

const env = (k: string) => process.env[k]?.trim() || undefined;

// Inbound buffers for webhook sources
const whatsappBuffer: RawLead[] = [];
export function pushWhatsappLead(lead: RawLead) { whatsappBuffer.push(lead); }

const emailBuffer: RawLead[] = [];
export function pushEmailLead(lead: RawLead) { emailBuffer.push(lead); }

// UAE -- 40+ free public sources, always active
export const uaeSource: Source = {
  id: "uae",
  label: "UAE Live Feeds (40+ sources: job boards, event calendars, Reddit, Twitter, Eventbrite, Meetup, publications)",
  kind: "event_calendar",
  setup: "No setup needed. Always active.",
  configured: () => true,
  fetch: fetchUAELeads,
};

// Registry feeds (user-added countries)
export const registrySource: Source = {
  id: "registry",
  label: "Country Registry Feeds",
  kind: "event_calendar",
  setup: "Add countries in GigRadar -> Sources tab.",
  configured: () => true,
  async fetch() {
    const feeds = getRegistry()
      .filter(c => c.active)
      .flatMap(c => c.feeds.filter(f => f.active));
    const leads: RawLead[] = [];
    for (const feed of feeds) {
      try {
        const res = await fetch(feed.url, { signal: AbortSignal.timeout(10000) });
        if (!res.ok) continue;
        const text = await res.text();
        if (text.trimStart().startsWith("<")) {
          const items = text.split(/<item>|<entry>/).slice(1);
          for (const item of items) {
            const pick = (tag: string) =>
              item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
                ?.replace(/<!\[CDATA\[|\]\]>/g, "")
                ?.replace(/<[^>]+>/g, "")
                ?.trim();
            leads.push({
              sourceKind: "event_calendar",
              sourceName: feed.label,
              sourceUrl: pick("link"),
              title: pick("title") ?? "Event listing",
              body: pick("description") ?? pick("summary") ?? "",
              postedAt: pick("pubDate") ? new Date(pick("pubDate")!).toISOString() : new Date().toISOString(),
            });
          }
        }
      } catch { /* skip bad feed */ }
    }
    return leads;
  },
};

// WhatsApp webhook buffer
export const whatsappSource: Source = {
  id: "whatsapp",
  label: "WhatsApp promoter groups (webhook)",
  kind: "whatsapp",
  setup: "Forward WhatsApp group messages to POST /api/ingest/whatsapp with header x-ingest-key.",
  configured: () => !!env("INGEST_KEY"),
  async fetch() { return whatsappBuffer.splice(0, whatsappBuffer.length); },
};

// Email webhook buffer
export const emailSource: Source = {
  id: "email",
  label: "Booking inbox (webhook)",
  kind: "email",
  setup: "Forward bookings@ email to POST /api/ingest/email with header x-ingest-key.",
  configured: () => !!env("INGEST_KEY"),
  async fetch() { return emailBuffer.splice(0, emailBuffer.length); },
};

// Instagram (requires scraper service)
export const instagramSource: Source = {
  id: "instagram",
  label: "Instagram promoters and venues",
  kind: "instagram",
  setup: "Set IG_SCRAPER_URL and IG_WATCH_HANDLES env vars.",
  configured: () => !!env("IG_SCRAPER_URL") && !!env("IG_WATCH_HANDLES"),
  async fetch() {
    const url = env("IG_SCRAPER_URL");
    const handles = env("IG_WATCH_HANDLES")?.split(",").map(h => h.trim()).filter(Boolean) ?? [];
    if (!url || !handles.length) return [];
    const out: RawLead[] = [];
    for (const handle of handles) {
      try {
        const res = await fetch(`${url}?handle=${encodeURIComponent(handle)}`, {
          headers: env("IG_SCRAPER_KEY") ? { Authorization: `Bearer ${env("IG_SCRAPER_KEY")}` } : {},
          signal: AbortSignal.timeout(15000),
        });
        if (!res.ok) continue;
        const posts = await res.json() as Array<{ id: string; caption?: string; permalink?: string; timestamp?: string }>;
        for (const p of posts) {
          out.push({
            sourceKind: "instagram",
            sourceName: `@${handle}`,
            sourceUrl: p.permalink,
            externalId: p.id,
            title: `Instagram post from @${handle}`,
            body: p.caption ?? "",
            postedAt: p.timestamp ?? new Date().toISOString(),
          });
        }
      } catch { /* skip */ }
    }
    return out;
  },
};

// Custom gig boards (env-configured JSON endpoints)
export const gigBoardSource: Source = {
  id: "boards",
  label: "Custom gig boards (JSON endpoints)",
  kind: "gig_board",
  setup: "Set BOARD_FEEDS to comma-separated JSON endpoints.",
  configured: () => !!env("BOARD_FEEDS"),
  async fetch() {
    const feeds = env("BOARD_FEEDS")?.split(",").map(f => f.trim()).filter(Boolean) ?? [];
    const out: RawLead[] = [];
    for (const feed of feeds) {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const rows = await res.json() as Array<Record<string, string>>;
        for (const r of rows) {
          out.push({
            sourceKind: "gig_board",
            sourceName: new URL(feed).hostname,
            sourceUrl: r.url,
            externalId: r.id,
            title: r.title ?? "Gig listing",
            body: r.description ?? "",
            postedAt: r.postedAt ?? new Date().toISOString(),
          });
        }
      } catch { /* skip */ }
    }
    return out;
  },
};

export const ALL_SOURCES: Source[] = [
  uaeSource,
  registrySource,
  whatsappSource,
  emailSource,
  instagramSource,
  gigBoardSource,
];

export function sourceStatus() {
  return ALL_SOURCES.map(s => ({
    id: s.id,
    label: s.label,
    kind: s.kind,
    setup: s.setup,
    configured: s.configured(),
  }));
}
