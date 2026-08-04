/**
 * Notifications. Telegram is the primary channel because it is instant,
 * free, needs no app-store review, and supports inline action buttons —
 * Emy can accept/decline/see-the-price straight from the lock screen.
 *
 * Web Push is the secondary channel for the installed PWA.
 */

import type { Gig } from "./types";
import type { Scored } from "./score";
import { activeSettings } from "./engine-settings";
import { quote } from "./pricing";
import { logAlert, deferAlert, pendingDeferred, markDeferredReleased } from "./db";
import { sendWhatsApp, sendEmail, actionLinks, whatsappConfigured, emailConfigured } from "./channels";
import { pitch } from "./outreach";

const env = (k: string) => process.env[k]?.trim() || undefined;

const TIER_PREFIX: Record<string, string> = {
  urgent: "🚨 URGENT GIG",
  high: "🔥 STRONG GIG",
  normal: "🎧 New gig",
  digest: "📋 Possible gig",
  suppress: "",
};

/**
 * Plain-text alert with tap-through links. WhatsApp renders bare URLs as
 * links, so no markup is needed — and markup would show as literal asterisks.
 */
export function buildPlainMessage(g: Gig, s: Scored): string {
  const q = quote({
    venueTier: g.venueTier,
    eventDate: g.eventDate,
    setLengthMins: g.setLengthMins ?? 120,
    slot: g.slot ?? "unknown",
    exclusivity: !!g.exclusivity,
    travelRequired: !!g.travelRequired,
    recurring: !!g.recurring,
    budgetStatedAed: g.budgetStatedAed,
  });
  const ask = Math.max(q.askAed, g.budgetStatedAed ?? 0);
  const appUrl = env("APP_URL") ?? "";
  const pitchText = pitch(g, "whatsapp").body;

  const when = g.eventDate
    ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "Date TBC";

  const lines: (string | undefined)[] = [
    `${TIER_PREFIX[s.tier]} (${s.score}/100)`,
    ``,
    g.venueName ?? g.title,
    `${when}${g.area ? ` · ${g.area}` : ""}`,
    g.setLengthMins ? `${(g.setLengthMins / 60).toFixed(1)}h · ${g.slot} slot` : undefined,
    ``,
    `Ask AED ${ask.toLocaleString()}  (target ${q.targetAed.toLocaleString()}, floor ${q.walkAwayAed.toLocaleString()})`,
    g.budgetStatedAed ? `They said AED ${g.budgetStatedAed.toLocaleString()}` : undefined,
    ``,
    `Via ${g.sourceName}`,
    ``,
  ];

  for (const a of actionLinks(g, pitchText)) lines.push(`${a.label}: ${a.url}`);
  if (appUrl) lines.push(`Full deal + contract: ${appUrl}/gig/${g.id}`);

  // Keep intentional blank lines (readability on a phone); drop only the
  // placeholders left by absent optional fields.
  return lines
    .filter((l) => l !== undefined && l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function buildMessage(g: Gig, s: Scored): string {
  const q = quote({
    venueTier: g.venueTier,
    eventDate: g.eventDate,
    setLengthMins: g.setLengthMins ?? 120,
    slot: g.slot ?? "unknown",
    exclusivity: !!g.exclusivity,
    travelRequired: !!g.travelRequired,
    recurring: !!g.recurring,
    budgetStatedAed: g.budgetStatedAed,
  });

  const best = [...g.contacts].sort((a, b) => b.decisionPower - a.decisionPower)[0];
  const contactLine = best
    ? [best.name, best.company, best.phone ?? best.email ?? best.instagram].filter(Boolean).join(" · ")
    : "No contact found — needs research";

  return [
    `${TIER_PREFIX[s.tier]} — score ${s.score}/100`,
    ``,
    `*${g.title}*`,
    g.venueName ? `📍 ${g.venueName}${g.area ? `, ${g.area}` : ""}` : g.area ? `📍 ${g.area}` : "",
    g.eventDate ? `📅 ${new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}` : "📅 Date TBC",
    g.setLengthMins ? `⏱ ${(g.setLengthMins / 60).toFixed(1)}h · ${g.slot} slot` : "",
    ``,
    `💰 *Ask AED ${q.askAed.toLocaleString()}* · target ${q.targetAed.toLocaleString()} · floor ${q.walkAwayAed.toLocaleString()}`,
    g.budgetStatedAed ? `   (they said AED ${g.budgetStatedAed.toLocaleString()})` : "",
    ``,
    `👤 ${contactLine}`,
    `📡 via ${g.sourceName}`,
    ``,
    `_${s.reasons.slice(0, 3).join(" · ")}_`,
  ].filter(Boolean).join("\n");
}

async function sendTelegram(g: Gig, s: Scored): Promise<boolean> {
  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  if (!token || !chat) return false;

  const appUrl = env("APP_URL") ?? "";
  const best = [...g.contacts].sort((a, b) => b.decisionPower - a.decisionPower)[0];
  const buttons: { text: string; url: string }[][] = [];
  if (appUrl) buttons.push([{ text: "📄 Open deal & contract", url: `${appUrl}/gig/${g.id}` }]);
  const row: { text: string; url: string }[] = [];
  if (best?.whatsapp) row.push({ text: "💬 WhatsApp now", url: `https://wa.me/${best.whatsapp.replace(/\D/g, "")}` });
  if (g.sourceUrl) row.push({ text: "🔗 Source", url: g.sourceUrl });
  if (row.length) buttons.push(row);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: buildMessage(g, s),
        parse_mode: "Markdown",
        disable_notification: s.tier === "digest",
        reply_markup: buttons.length ? { inline_keyboard: buttons } : undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const ok = res.ok;
    await logAlert(g.id, s.tier, "telegram", ok, ok ? undefined : await res.text());
    return ok;
  } catch (e) {
    await logAlert(g.id, s.tier, "telegram", false, String(e));
    return false;
  }
}

/** Generic webhook fallback so any channel (Slack, Discord, Make.com) works. */
async function sendWebhook(g: Gig, s: Scored): Promise<boolean> {
  const url = env("ALERT_WEBHOOK_URL");
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: buildMessage(g, s), gig: g, score: s }),
      signal: AbortSignal.timeout(10_000),
    });
    await logAlert(g.id, s.tier, "webhook", res.ok);
    return res.ok;
  } catch (e) {
    await logAlert(g.id, s.tier, "webhook", false, String(e));
    return false;
  }
}

/** Dubai local hour (UTC+4, no DST). */
export function dubaiHour(now: Date = new Date()): number {
  return (now.getUTCHours() + 4) % 24;
}

/** Quiet hours window (default 02:00–09:00 Dubai). Only `urgent` may break through. */
export function isQuietHours(now: Date = new Date()): boolean {
  const h = dubaiHour(now);
  const { quietStartHour, quietEndHour } = activeSettings().alerts;
  if (quietStartHour < quietEndHour) return h >= quietStartHour && h < quietEndHour;
  // Window crosses midnight (e.g. 22:00–06:00).
  return h >= quietStartHour || h < quietEndHour;
}

export async function alert(g: Gig, s: Scored, now: Date = new Date()): Promise<{ sent: string[]; skipped?: string }> {
  if (s.tier === "suppress") return { sent: [], skipped: "below alert threshold" };

  // Quiet hours: hold non-urgent gigs for the morning digest.
  // These are QUEUED, never dropped — a strong 3am lead must still be seen.
  if (isQuietHours(now) && s.tier !== "urgent") {
    await deferAlert(g.id, s.tier);
    return { sent: [], skipped: "quiet hours — queued for morning digest" };
  }

  const sent: string[] = [];
  const plain = buildPlainMessage(g, s);

  // WhatsApp first — it's where she actually is.
  if (whatsappConfigured()) {
    const r = await sendWhatsApp(plain, g.id, s.tier);
    if (r.ok) sent.push("whatsapp");
  }
  if (emailConfigured()) {
    const subj = `${s.tier === "urgent" ? "URGENT gig" : "Gig"}: ${g.venueName ?? g.sourceName}`
      + (g.eventDate ? ` — ${g.eventDate}` : "");
    const r = await sendEmail(subj, plain, g.id, s.tier);
    if (r.ok) sent.push("email");
  }
  if (await sendTelegram(g, s)) sent.push("telegram");
  if (await sendWebhook(g, s)) sent.push("webhook");
  return { sent };
}

/**
 * Sends everything held overnight as ONE message, so she wakes to a single
 * ranked briefing rather than a wall of individual pings.
 */
export async function sendMorningDigest(): Promise<{ sent: boolean; count: number }> {
  const pending = await pendingDeferred();
  if (!pending.length) return { sent: false, count: 0 };

  const token = env("TELEGRAM_BOT_TOKEN");
  const chat = env("TELEGRAM_CHAT_ID");
  const appUrl = env("APP_URL") ?? "";

  const lines = [
    `☀️ *Morning briefing* — ${pending.length} gig${pending.length > 1 ? "s" : ""} came in overnight`,
    ``,
    ...pending.slice(0, 10).map(({ gig }, i) => {
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
      const when = gig.eventDate
        ? new Date(gig.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
        : "TBC";
      const ask = Math.max(q.askAed, gig.budgetStatedAed ?? 0);
      return `${i + 1}. *${gig.venueName ?? gig.sourceName}* · ${when} · AED ${ask.toLocaleString()} · ${gig.score}/100${appUrl ? `\n   ${appUrl}/gig/${gig.id}` : ""}`;
    }),
    pending.length > 10 ? `\n…and ${pending.length - 10} more in the app.` : "",
  ].filter(Boolean).join("\n");

  let ok = false;

  // Same channels she actually uses.
  if (whatsappConfigured()) {
    const r = await sendWhatsApp(lines.replace(/\*/g, ""));
    ok = ok || r.ok;
  }
  if (emailConfigured()) {
    const r = await sendEmail(`Morning briefing — ${pending.length} gig${pending.length > 1 ? "s" : ""} overnight`, lines.replace(/\*/g, ""));
    ok = ok || r.ok;
  }

  if (token && chat) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: lines, parse_mode: "Markdown" }),
        signal: AbortSignal.timeout(10_000),
      });
      ok = res.ok;
    } catch { ok = false; }
  }

  const hook = env("ALERT_WEBHOOK_URL");
  if (hook) {
    try {
      const res = await fetch(hook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lines, digest: true, count: pending.length }),
        signal: AbortSignal.timeout(10_000),
      });
      ok = ok || res.ok;
    } catch { /* ignore */ }
  }

  if (ok) {
    for (const p of pending) await logAlert(p.gig.id, "digest", "telegram-digest", true);
    await markDeferredReleased(pending.map((p) => p.gig.id));
  }
  return { sent: ok, count: pending.length };
}

/** Digest goes out at 09:00 Dubai, once quiet hours end. */
export function isDigestTime(now: Date = new Date()): boolean {
  return dubaiHour(now) === 9;
}
