/**
 * GigRadar on Cloudflare Workers.
 *
 * This is the always-on half that a static page can't do:
 *   - cron sweep every 5 minutes
 *   - inbound webhooks for WhatsApp / email / manual leads
 *   - Web Push to her phone WITH THE APP CLOSED
 *   - serves feed.json to the installed app
 *
 * The scoring, pricing and pitch logic is the same code as the main app —
 * imported from ../../src/lib so there is one source of truth.
 */

import { normalise } from "../../src/lib/extract";
import { scoreGig } from "../../src/lib/score";
import { quote } from "../../src/lib/pricing";
import type { Gig, RawLead } from "../../src/lib/types";
import { sendPush, type PushSubscription } from "./push";

export interface Env {
  GIGS: KVNamespace;
  VAPID_PUBLIC: string;
  VAPID_PRIVATE: string;
  VAPID_SUBJECT: string;
  INGEST_KEY?: string;
  RESEND_API_KEY?: string;
  ALERT_EMAIL_TO?: string;
  CALENDAR_FEEDS?: string;
  BOARD_FEEDS?: string;
}

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, x-ingest-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

/* ------------------------------------------------------------------ *
 * Storage helpers
 * ------------------------------------------------------------------ */

async function subscriptions(env: Env): Promise<Record<string, PushSubscription>> {
  return (await env.GIGS.get("subs", "json")) ?? {};
}

async function saveSubs(env: Env, subs: Record<string, PushSubscription>) {
  await env.GIGS.put("subs", JSON.stringify(subs));
}

interface FeedGig {
  id: string;
  venue?: string;
  date?: string;
  fee?: number;
  score: number;
  tier: string;
  source: string;
  body: string;
  contact?: string;
  channel: "whatsapp" | "email" | "instagram";
  at: string;
}

async function feed(env: Env): Promise<FeedGig[]> {
  return (await env.GIGS.get("feed", "json")) ?? [];
}

/* ------------------------------------------------------------------ *
 * Core: turn raw text into a scored, priced gig and alert if worthwhile
 * ------------------------------------------------------------------ */

async function ingest(env: Env, leads: RawLead[]): Promise<{ added: number; pushed: number }> {
  const existing = await feed(env);
  const seen = new Set(
    (await env.GIGS.get<string[]>("fingerprints", "json")) ?? []
  );

  const fresh: { gig: Gig; feed: FeedGig }[] = [];

  for (const lead of leads) {
    let base;
    try {
      base = normalise(lead);
    } catch {
      continue;
    }
    if (seen.has(base.fingerprint)) continue;      // already alerted on this
    seen.add(base.fingerprint);

    const s = scoreGig(base);
    if (s.tier === "suppress") continue;           // not worth interrupting her

    const id = base.fingerprint.slice(0, 10);
    const gig: Gig = { ...base, id, score: s.score, stage: "new" };
    const q = quote({
      venueTier: gig.venueTier,
      eventDate: gig.eventDate,
      setLengthMins: gig.setLengthMins ?? 120,
      slot: gig.slot ?? "unknown",
      exclusivity: !!gig.exclusivity,
      travelRequired: !!gig.travelRequired,
      recurring: !!gig.recurring,
      budgetStatedAed: gig.budgetStatedAed,
    });

    const best = [...gig.contacts].sort((a, b) => b.decisionPower - a.decisionPower)[0];
    const channel: FeedGig["channel"] =
      best?.whatsapp || best?.phone ? "whatsapp" : best?.email ? "email" : "instagram";

    fresh.push({
      gig,
      feed: {
        id,
        venue: gig.venueName,
        date: gig.eventDate,
        fee: Math.max(q.askAed, gig.budgetStatedAed ?? 0),
        score: s.score,
        tier: s.tier,
        source: gig.sourceName,
        body: gig.body.slice(0, 1200),
        contact: best?.whatsapp ?? best?.phone ?? best?.email ?? best?.instagram,
        channel,
        at: new Date().toISOString(),
      },
    });
  }

  if (!fresh.length) return { added: 0, pushed: 0 };

  // Newest and best first; keep the feed bounded.
  const merged = [...fresh.map((f) => f.feed), ...existing]
    .sort((a, b) => b.score - a.score || b.at.localeCompare(a.at))
    .slice(0, 100);

  await env.GIGS.put("feed", JSON.stringify(merged));
  await env.GIGS.put("fingerprints", JSON.stringify([...seen].slice(-2000)));

  // Quiet hours: only urgent gigs may wake her (02:00–09:00 Dubai, UTC+4).
  const dubaiHour = (new Date().getUTCHours() + 4) % 24;
  const quiet = dubaiHour >= 2 && dubaiHour < 9;
  const toPush = fresh.filter((f) => !quiet || f.feed.tier === "urgent");

  let pushed = 0;
  if (toPush.length) {
    const subs = await subscriptions(env);
    const dead: string[] = [];

    for (const [key, sub] of Object.entries(subs)) {
      for (const f of toPush.slice(0, 3)) {
        const payload = JSON.stringify({
          title: `${f.feed.tier === "urgent" ? "🚨 URGENT" : "🎧 New"} gig — ${f.feed.venue ?? f.feed.source}`,
          body: [
            f.feed.date,
            f.feed.fee ? `AED ${f.feed.fee.toLocaleString()}` : null,
            `${f.feed.score}/100`,
          ].filter(Boolean).join(" · "),
          id: f.feed.id,
        });
        try {
          const r = await sendPush(sub, payload, env);
          if (r.gone) dead.push(key);
          else if (r.ok) pushed++;
        } catch {
          /* one bad endpoint must not stop the rest */
        }
      }
    }

    if (dead.length) {
      for (const k of dead) delete subs[k];
      await saveSubs(env, subs);
    }
  }

  return { added: fresh.length, pushed };
}

/* ------------------------------------------------------------------ *
 * Sources polled on the cron
 * ------------------------------------------------------------------ */

async function pollFeeds(env: Env): Promise<RawLead[]> {
  const urls = [
    ...(env.CALENDAR_FEEDS?.split(",") ?? []),
    ...(env.BOARD_FEEDS?.split(",") ?? []),
  ].map((u) => u.trim()).filter(Boolean);

  const out: RawLead[] = [];
  await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) return;
      const text = await res.text();
      const host = new URL(url).hostname;

      if (text.trimStart().startsWith("<")) {
        for (const item of text.split(/<item>|<entry>/).slice(1)) {
          const pick = (tag: string) =>
            item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`))?.[1]
              ?.replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim();
          out.push({
            sourceKind: "event_calendar", sourceName: host,
            sourceUrl: pick("link"), title: pick("title") ?? "Listing",
            body: pick("description") ?? "", postedAt: new Date().toISOString(),
          });
        }
      } else {
        for (const r of JSON.parse(text) as Record<string, string>[]) {
          out.push({
            sourceKind: "gig_board", sourceName: host, sourceUrl: r.url,
            title: r.title ?? "Listing", body: r.description ?? "",
            postedAt: r.postedAt ?? new Date().toISOString(),
          });
        }
      }
    } catch { /* skip a bad feed */ }
  }));

  return out;
}

/* ------------------------------------------------------------------ *
 * HTTP
 * ------------------------------------------------------------------ */

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (req.method === "OPTIONS") return new Response(null, { headers: JSON_HEADERS });

    // The installed app polls this.
    if (path === "/feed.json" || path === "/feed") {
      return json({ updated: new Date().toISOString(), gigs: await feed(env) });
    }

    // App fetches the key it needs to subscribe to push.
    if (path === "/vapid") return json({ key: env.VAPID_PUBLIC });

    if (path === "/subscribe" && req.method === "POST") {
      const sub = (await req.json()) as PushSubscription;
      if (!sub?.endpoint || !sub.keys?.p256dh) return json({ error: "bad subscription" }, 400);
      const subs = await subscriptions(env);
      subs[sub.endpoint] = sub;
      await saveSubs(env, subs);
      await sendPush(sub, JSON.stringify({
        title: "Alerts are on",
        body: "New gigs will ping this phone, even with the app closed.",
      }), env).catch(() => {});
      return json({ ok: true, count: Object.keys(subs).length });
    }

    if (path === "/unsubscribe" && req.method === "POST") {
      const { endpoint } = (await req.json()) as { endpoint: string };
      const subs = await subscriptions(env);
      delete subs[endpoint];
      await saveSubs(env, subs);
      return json({ ok: true });
    }

    // Inbound leads: WhatsApp bridge, email forwarder, or manual paste.
    if (path.startsWith("/ingest") && req.method === "POST") {
      if (env.INGEST_KEY && req.headers.get("x-ingest-key") !== env.INGEST_KEY) {
        return json({ error: "unauthorized" }, 401);
      }
      const b = (await req.json()) as { text?: string; from?: string; subject?: string; source?: string };
      if (!b.text?.trim()) return json({ error: "text required" }, 400);

      const kind = path.includes("email") ? "email" : path.includes("whatsapp") ? "whatsapp" : "manual";
      const r = await ingest(env, [{
        sourceKind: kind as RawLead["sourceKind"],
        sourceName: b.from ?? b.source ?? kind,
        title: b.subject ?? "Inbound lead",
        body: b.from ? `${b.text}\nFrom: ${b.from}` : b.text,
        postedAt: new Date().toISOString(),
      }]);
      return json(r);
    }

    // Manual sweep trigger, useful for testing.
    if (path === "/sweep") {
      const leads = await pollFeeds(env);
      return json(await ingest(env, leads));
    }

    return json({
      service: "GigRadar",
      endpoints: ["/feed.json", "/vapid", "/subscribe", "/ingest/whatsapp", "/ingest/email", "/ingest/manual", "/sweep"],
    });
  },

  // The radar.
  async scheduled(_evt: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const leads = await pollFeeds(env);
      if (leads.length) await ingest(env, leads);
    })());
  },
};
