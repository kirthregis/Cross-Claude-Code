/**
 * Notifications. Telegram is the primary channel because it is instant,
 * free, needs no app-store review, and supports inline action buttons —
 * Emy can accept/decline/see-the-price straight from the lock screen.
 *
 * Web Push is the secondary channel for the installed PWA.
 */

import type { Gig } from "./types";
import type { Scored } from "./score";
import { quote } from "./pricing";
import { logAlert } from "./db";

const env = (k: string) => process.env[k]?.trim() || undefined;

const TIER_PREFIX: Record<string, string> = {
  urgent: "🚨 URGENT GIG",
  high: "🔥 STRONG GIG",
  normal: "🎧 New gig",
  digest: "📋 Possible gig",
  suppress: "",
};

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
    logAlert(g.id, s.tier, "telegram", ok, ok ? undefined : await res.text());
    return ok;
  } catch (e) {
    logAlert(g.id, s.tier, "telegram", false, String(e));
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
    logAlert(g.id, s.tier, "webhook", res.ok);
    return res.ok;
  } catch (e) {
    logAlert(g.id, s.tier, "webhook", false, String(e));
    return false;
  }
}

export async function alert(g: Gig, s: Scored): Promise<{ sent: string[]; skipped?: string }> {
  if (s.tier === "suppress") return { sent: [], skipped: "below alert threshold" };

  // Quiet hours: only urgent gigs may buzz between 02:00 and 09:00 Dubai time.
  const dubaiHour = (new Date().getUTCHours() + 4) % 24;
  const quiet = dubaiHour >= 2 && dubaiHour < 9;
  if (quiet && s.tier !== "urgent") return { sent: [], skipped: "quiet hours — queued for morning digest" };

  const sent: string[] = [];
  if (await sendTelegram(g, s)) sent.push("telegram");
  if (await sendWebhook(g, s)) sent.push("webhook");
  return { sent };
}
