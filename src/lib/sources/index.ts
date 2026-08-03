/**
 * Source adapters — the radar's antennae.
 *
 * Every source implements the same tiny interface, so adding a new one is a
 * single file. Adapters that need credentials degrade gracefully: if the env
 * var is missing they return [] and report `configured: false` so the UI can
 * show Emy exactly which feeds are live and which need setup.
 */

import type { RawLead } from "../types";

export interface Source {
  id: string;
  label: string;
  kind: RawLead["sourceKind"];
  /** Human note on what it takes to switch this on. */
  setup: string;
  configured(): boolean;
  fetch(): Promise<RawLead[]>;
}

const env = (k: string) => process.env[k]?.trim() || undefined;

/* ------------------------------------------------------------------ *
 * Instagram — promoter & venue accounts.
 * Two viable paths: the official Graph API (needs a Business account +
 * app review) or a third-party scraping API. We support a generic
 * webhook/pull endpoint so you can swap providers without code changes.
 * ------------------------------------------------------------------ */
export const instagramSource: Source = {
  id: "instagram",
  label: "Instagram promoters & venues",
  kind: "instagram",
  setup: "Set IG_SCRAPER_URL + IG_SCRAPER_KEY, and list handles in IG_WATCH_HANDLES (comma separated).",
  configured: () => !!env("IG_SCRAPER_URL") && !!env("IG_WATCH_HANDLES"),
  async fetch() {
    const url = env("IG_SCRAPER_URL");
    const handles = env("IG_WATCH_HANDLES")?.split(",").map((h) => h.trim()).filter(Boolean) ?? [];
    if (!url || !handles.length) return [];
    const out: RawLead[] = [];
    for (const handle of handles) {
      try {
        const res = await fetch(`${url}?handle=${encodeURIComponent(handle)}`, {
          headers: env("IG_SCRAPER_KEY") ? { Authorization: `Bearer ${env("IG_SCRAPER_KEY")}` } : {},
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) continue;
        const posts = (await res.json()) as Array<{ id: string; caption?: string; permalink?: string; timestamp?: string }>;
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
      } catch { /* one bad handle must not kill the sweep */ }
    }
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * WhatsApp — promoter groups. Inbound only, via webhook.
 * Messages arrive at /api/ingest/whatsapp and are buffered; this adapter
 * just drains the buffer so everything flows through one pipeline.
 * ------------------------------------------------------------------ */
const whatsappBuffer: RawLead[] = [];
export function pushWhatsappLead(lead: RawLead) { whatsappBuffer.push(lead); }

export const whatsappSource: Source = {
  id: "whatsapp",
  label: "WhatsApp promoter groups",
  kind: "whatsapp",
  setup: "Point a WhatsApp Business webhook (or Baileys bridge) at POST /api/ingest/whatsapp with header x-ingest-key = INGEST_KEY.",
  configured: () => !!env("INGEST_KEY"),
  async fetch() { return whatsappBuffer.splice(0, whatsappBuffer.length); },
};

/* ------------------------------------------------------------------ *
 * Event calendars — Platinumlist, Resident Advisor, Skiddle, Time Out.
 * Public listings tell us WHO is programming WHAT: a venue announcing a
 * season of parties is a venue that needs DJs.
 * ------------------------------------------------------------------ */
export const eventCalendarSource: Source = {
  id: "calendars",
  label: "Dubai event calendars (Platinumlist / RA / Time Out)",
  kind: "event_calendar",
  setup: "Set CALENDAR_FEEDS to a comma-separated list of JSON or RSS endpoints.",
  configured: () => !!env("CALENDAR_FEEDS"),
  async fetch() {
    const feeds = env("CALENDAR_FEEDS")?.split(",").map((f) => f.trim()).filter(Boolean) ?? [];
    const out: RawLead[] = [];
    for (const feed of feeds) {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) continue;
        const text = await res.text();
        if (text.trimStart().startsWith("<")) {
          // Minimal RSS/Atom handling — no XML dependency needed.
          const items = text.split(/<item>|<entry>/).slice(1);
          for (const it of items) {
            const pick = (tag: string) =>
              it.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]
                ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
            out.push({
              sourceKind: "event_calendar",
              sourceName: new URL(feed).hostname,
              sourceUrl: pick("link"),
              title: pick("title") ?? "Event listing",
              body: pick("description") ?? pick("summary") ?? "",
              postedAt: pick("pubDate") ? new Date(pick("pubDate")!).toISOString() : new Date().toISOString(),
            });
          }
        } else {
          const json = JSON.parse(text) as Array<Record<string, string>>;
          for (const e of json) {
            out.push({
              sourceKind: "event_calendar",
              sourceName: new URL(feed).hostname,
              sourceUrl: e.url ?? e.link,
              externalId: e.id,
              title: e.title ?? e.name ?? "Event",
              body: `${e.description ?? ""} ${e.venue ?? ""} ${e.date ?? ""}`.trim(),
              postedAt: e.published ?? new Date().toISOString(),
            });
          }
        }
      } catch { /* skip bad feed */ }
    }
    return out;
  },
};

/* ------------------------------------------------------------------ *
 * Email — agency mailouts, hotel RFPs, inbound booking enquiries.
 * The highest-value, lowest-noise source. IMAP or a forwarding webhook.
 * ------------------------------------------------------------------ */
const emailBuffer: RawLead[] = [];
export function pushEmailLead(lead: RawLead) { emailBuffer.push(lead); }

export const emailSource: Source = {
  id: "email",
  label: "Booking inbox & agency mailouts",
  kind: "email",
  setup: "Forward bookings@ to the Cloudflare/SendGrid parse hook at POST /api/ingest/email (header x-ingest-key).",
  configured: () => !!env("INGEST_KEY"),
  async fetch() { return emailBuffer.splice(0, emailBuffer.length); },
};

/* ------------------------------------------------------------------ *
 * Gig boards & agency rosters — generic HTML/JSON pollers.
 * ------------------------------------------------------------------ */
export const gigBoardSource: Source = {
  id: "boards",
  label: "Gig boards & agency roster calls",
  kind: "gig_board",
  setup: "Set BOARD_FEEDS to comma-separated JSON endpoints returning {title, description, url, postedAt}[].",
  configured: () => !!env("BOARD_FEEDS"),
  async fetch() {
    const feeds = env("BOARD_FEEDS")?.split(",").map((f) => f.trim()).filter(Boolean) ?? [];
    const out: RawLead[] = [];
    for (const feed of feeds) {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(15_000) });
        if (!res.ok) continue;
        const rows = (await res.json()) as Array<Record<string, string>>;
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
  instagramSource,
  whatsappSource,
  emailSource,
  eventCalendarSource,
  gigBoardSource,
];

export function sourceStatus() {
  return ALL_SOURCES.map((s) => ({
    id: s.id, label: s.label, kind: s.kind, setup: s.setup, configured: s.configured(),
  }));
}
