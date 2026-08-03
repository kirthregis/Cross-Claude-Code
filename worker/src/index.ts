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
import { DEFAULT_FEEDS, NOT_COVERED, type FeedSource } from "./feeds";

export interface Env {
  /** Optional: /test works without it, everything else needs it. */
  GIGS?: KVNamespace;
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
  if (!env.GIGS) return {};
  return (await env.GIGS.get("subs", "json")) ?? {};
}

async function saveSubs(env: Env, subs: Record<string, PushSubscription>) {
  if (!env.GIGS) return;
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
  if (!env.GIGS) return [];
  return (await env.GIGS.get("feed", "json")) ?? [];
}

/* ------------------------------------------------------------------ *
 * Core: turn raw text into a scored, priced gig and alert if worthwhile
 * ------------------------------------------------------------------ */

async function ingest(env: Env, leads: RawLead[]): Promise<{ added: number; pushed: number }> {
  const existing = await feed(env);
  const seen = new Set(
    (env.GIGS ? await env.GIGS.get<string[]>("fingerprints", "json") : null) ?? []
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

  // Only write when something actually changed. The cron fires 288x/day and
  // the KV free tier allows 1,000 writes/day — writing on every empty sweep
  // would burn 58% of the daily budget for nothing.
  if (!fresh.length) return { added: 0, pushed: 0 };

  // Newest and best first; keep the feed bounded.
  const merged = [...fresh.map((f) => f.feed), ...existing]
    .sort((a, b) => b.score - a.score || b.at.localeCompare(a.at))
    .slice(0, 100);

  if (env.GIGS) {
    await env.GIGS.put("feed", JSON.stringify(merged));
    await env.GIGS.put("fingerprints", JSON.stringify([...seen].slice(-2000)));
  }

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

/** Strip tags and decode the handful of entities that matter. */
function textOf(x: string): string {
  return x
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#8217;|&rsquo;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface SourceReport { id: string; ok: boolean; items: number; kept: number; error?: string }

async function fetchSource(src: FeedSource): Promise<{ leads: RawLead[]; report: SourceReport }> {
  const report: SourceReport = { id: src.id, ok: false, items: 0, kept: 0 };
  const leads: RawLead[] = [];
  try {
    const res = await fetch(src.url, {
      headers: {
        // Identify honestly; many boards block blank agents.
        "User-Agent": "Mozilla/5.0 (compatible; GigRadar/1.0; +https://emyvisiongroup.com)",
        Accept: "application/rss+xml, application/xml, text/html;q=0.9, application/json;q=0.8",
      },
      signal: AbortSignal.timeout(12_000),
      cf: { cacheTtl: 240, cacheEverything: true },
    });
    if (!res.ok) { report.error = `HTTP ${res.status}`; return { leads, report }; }
    const body = await res.text();
    const host = new URL(src.url).hostname;

    const push = (title: string, desc: string, link?: string, when?: string) => {
      report.items++;
      const blob = `${title} ${desc}`;
      if (src.match && !src.match.test(blob)) return;
      if (src.reject && src.reject.test(blob)) return;
      report.kept++;
      leads.push({
        sourceKind: "gig_board",
        sourceName: src.label,
        sourceUrl: link,
        title: title.slice(0, 200),
        body: desc.slice(0, 2000),
        postedAt: when ? new Date(when).toISOString() : new Date().toISOString(),
      });
    };

    if (src.kind === "json" || body.trimStart().startsWith("[") || body.trimStart().startsWith("{")) {
      const rows = JSON.parse(body);
      for (const r of (Array.isArray(rows) ? rows : rows.jobs ?? rows.results ?? [])) {
        push(r.title ?? r.name ?? "Listing", r.description ?? r.snippet ?? "", r.url ?? r.link, r.updated ?? r.date);
      }
    } else if (body.includes("<item") || body.includes("<entry")) {
      for (const item of body.split(/<item[\s>]|<entry[\s>]/).slice(1)) {
        const pick = (t: string) => {
          const m = item.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`, "i"));
          return m ? textOf(m[1]) : "";
        };
        push(pick("title"), pick("description") || pick("summary") || pick("content"),
             pick("link") || item.match(/<link[^>]*href="([^"]+)"/i)?.[1], pick("pubDate") || pick("updated"));
      }
    } else {
      // HTML fallback: pull anchor text that mentions a DJ role, plus nearby copy.
      const seen = new Set<string>();
      const re = /<a[^>]+href="([^"]+)"[^>]*>([\s\S]{0,180}?)<\/a>/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body))) {
        const label = textOf(m[2]);
        if (label.length < 12 || seen.has(label)) continue;
        if (!/\b(dj|deejay|disc jockey|resident|entertain)/i.test(label)) continue;
        seen.add(label);
        const ctx = textOf(body.slice(m.index, m.index + 900));
        const href = m[1].startsWith("http") ? m[1] : new URL(m[1], src.url).toString();
        push(label, ctx, href);
        if (seen.size >= 40) break;
      }
    }
    report.ok = true;
  } catch (e) {
    report.error = e instanceof Error ? e.message : String(e);
  }
  return { leads, report };
}

async function pollFeeds(env: Env): Promise<{ leads: RawLead[]; reports: SourceReport[] }> {
  const extra: FeedSource[] = [
    ...(env.CALENDAR_FEEDS?.split(",") ?? []),
    ...(env.BOARD_FEEDS?.split(",") ?? []),
  ].map((u) => u.trim()).filter(Boolean).map((url, i) => ({
    id: `custom-${i}`, label: new URL(url).hostname, url, kind: "rss" as const,
  }));

  const all = [...DEFAULT_FEEDS, ...extra];
  const results = await Promise.all(all.map(fetchSource));
  return {
    leads: results.flatMap((r) => r.leads),
    reports: results.map((r) => r.report),
  };
}

/* ------------------------------------------------------------------ *
 * HTTP
 * ------------------------------------------------------------------ */

/** Self-contained page that runs /test and shows the result. */
const REPORT_PAGE = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>GigRadar — does it find gigs?</title>
<style>body{margin:0;background:#0a0a0f;color:#e4e4e7;font:15px/1.5 -apple-system,system-ui,sans-serif;padding:20px}
.w{max-width:720px;margin:0 auto}h1{font-size:20px}h1 span{color:#ef4444}
button{background:#dc2626;color:#fff;border:0;border-radius:10px;padding:14px 22px;font-size:15px;font-weight:600}
.big{font-size:34px;font-weight:700;color:#34d399;margin:14px 0 2px}
.card{background:#18181b;border:1px solid #27272a;border-radius:12px;padding:14px;margin:12px 0}
table{width:100%;border-collapse:collapse;font-size:13px}td,th{padding:6px;border-bottom:1px solid #27272a;text-align:left}
.g{color:#34d399}.r{color:#f87171}.m{color:#71717a}small{color:#71717a}</style></head><body><div class="w">
<h1>Gig<span>Radar</span> — live test</h1>
<p><small>Runs a real sweep of every source. Stores nothing, alerts nobody.</small></p>
<button onclick="go()">Run the test</button>
<div id="o"></div>
<script>
async function go(){
  var o=document.getElementById('o'); o.innerHTML='<p class="m">Checking every source…</p>';
  try{
    var d=await (await fetch('/test')).json();
    var rows=(d.sources||[]).map(function(s){return '<tr><td>'+s.id+'</td><td class="'+(s.ok?'g':'r')+'">'+(s.ok?'ok':'fail')+'</td><td>'+s.items+'</td><td>'+s.kept+'</td><td class="m">'+(s.error||'')+'</td></tr>'}).join('');
    var top=(d.top||[]).map(function(t){return '<tr><td>'+t.score+'</td><td>'+t.tier+'</td><td>'+t.title+'</td></tr>'}).join('');
    o.innerHTML='<div class="card"><div class="big">'+d.leadsFound+'</div><small>DJ listings found right now</small>'+
      '<div class="big">'+d.wouldAlert+'</div><small>worth alerting her about</small></div>'+
      '<div class="card"><b>Every source</b><table><tr><th>source</th><th></th><th>items</th><th>kept</th><th></th></tr>'+rows+'</table></div>'+
      (top?'<div class="card"><b>Top gigs found</b><table><tr><th>score</th><th>tier</th><th>listing</th></tr>'+top+'</table></div>':'')+
      '<div class="card"><b>Not covered — honestly</b><ul>'+(d.notCovered||[]).map(function(n){return '<li>'+n+'</li>'}).join('')+'</ul></div>';
  }catch(e){ o.innerHTML='<p class="r">Failed: '+e+'</p>' }
}
</script></div></body></html>`;

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
    // Run a sweep now and report exactly what each source returned. This is
    // the "does it actually find gigs?" endpoint — no claims, just counts.
    if (path === "/sweep") {
      const { leads, reports } = await pollFeeds(env);
      const result = await ingest(env, leads);
      return json({
        ...result,
        leadsFound: leads.length,
        sources: reports,
        notCovered: NOT_COVERED,
      });
    }

    // Dry run: what would we find, without storing or alerting?
    if (path === "/test") {
      const { leads, reports } = await pollFeeds(env);
      const scored = leads.map((l) => {
        try {
          const g = normalise(l);
          const s = scoreGig(g);
          return { title: l.title.slice(0, 90), source: l.sourceName, score: s.score, tier: s.tier };
        } catch { return null; }
      }).filter(Boolean).sort((a, b) => (b!.score - a!.score));
      return json({
        leadsFound: leads.length,
        wouldAlert: scored.filter((s) => s!.tier !== "suppress").length,
        sources: reports,
        top: scored.slice(0, 25),
        notCovered: NOT_COVERED,
      });
    }

    if (path === "/" && (req.headers.get("accept") ?? "").includes("text/html")) {
      return new Response(REPORT_PAGE, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return json({
      service: "GigRadar",
      endpoints: ["/feed.json", "/vapid", "/subscribe", "/ingest/whatsapp", "/ingest/email", "/ingest/manual", "/sweep", "/test"],
    });
  },

  // The radar.
  async scheduled(_evt: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const { leads } = await pollFeeds(env);
      if (leads.length) await ingest(env, leads);
    })());
  },
};
