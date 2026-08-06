/**
 * Notification and digest system.
 *
 * isQuietHours and isDigestTime both accept an optional Date so they can be
 * called with a specific time in tests (and default to now() in production).
 *
 * Dubai is UTC+4. All hour comparisons are in Dubai local time.
 */

import type { Gig } from "./types";
import {
  sendWhatsApp,
  sendEmail,
  whatsappConfigured,
  emailConfigured,
  actionLinks,
} from "./channels";
import { logAlert, deferAlert, pendingDeferred, markDeferredReleased } from "./db";
import { pitch } from "./outreach";
import type { Scored } from "./score";

const DUBAI_OFFSET_HOURS = 4;

function dubaiHour(date: Date = new Date()): number {
  return (date.getUTCHours() + DUBAI_OFFSET_HOURS) % 24;
}

// Quiet hours: 02:00-09:00 Dubai time (nightlife winding down, no alerts)
export function isQuietHours(date?: Date): boolean {
  const h = dubaiHour(date);
  return h >= 2 && h < 9;
}

// Digest fires at exactly 09:00 Dubai time
export function isDigestTime(date?: Date): boolean {
  return dubaiHour(date) === 9;
}

export interface AlertResult {
  sent: string[];
  skipped?: string;
}

export async function alert(
  gig: Gig,
  score: Scored & { tier: string },
  now?: Date,
): Promise<AlertResult> {
  // Suppress low-quality leads entirely
  if (score.score < 40 || score.tier === "suppress") {
    return { sent: [], skipped: "score too low" };
  }

  // During quiet hours: urgent gigs break through, everything else is deferred
  if (isQuietHours(now)) {
    if (score.tier !== "urgent") {
      deferAlert(gig.id);
      return { sent: [], skipped: "deferred to morning digest" };
    }
    // Urgent � fall through and attempt to send even during quiet hours
  }

  const sent: string[] = [];
  const links = actionLinks(gig);
  const headline = score.headline ?? gig.title;
  const message = [
    "New gig match: " + headline,
    "",
    "Score: " + score.score + " | Tier: " + score.tier,
    "Source: " + gig.sourceName,
    "",
    "Reasons:",
    ...(score.reasons ?? []).map(r => "  - " + r),
    "",
    "Ask AED " + (gig.budgetStatedAed ?? 0),
    "WhatsApp: " + (links as Record<string, string>).whatsapp,
    "View: " + (links as Record<string, string>).view,
  ].join("\n");

  if (whatsappConfigured()) {
    const ok = await sendWhatsApp("971503443281", message);
    if (ok) sent.push("whatsapp");
  }

  if (emailConfigured()) {
    const ok = await sendEmail(
      "admin@emyvisiongroup.com",
      "New Gig: " + gig.title,
      pitch(gig, "email").body,
    );
    if (ok) sent.push("email");
  }

  if (sent.length) logAlert(gig.id);

  return { sent };
}

// -- Plain text message for WhatsApp / Telegram --------------------------------

export function buildPlainMessage(gig: Gig, score: Scored): string {
  const links = actionLinks(gig) as Record<string, string>;
  const whatsappContact = (gig.contacts ?? []).find(c => c.whatsapp);
  const appUrl = (typeof process !== "undefined" ? process.env.APP_URL : "") ?? "";

  return [
    score.headline,
    "",
    "Score: " + score.score + " | " + score.tier.toUpperCase(),
    "",
    "Ask AED " + score.headline.match(/AED [\d,]+/)?.[0]?.replace("AED ", ""),
    "",
    "Reasons:",
    ...(score.reasons ?? []).map(r => "  - " + r),
    "",
    whatsappContact?.whatsapp ? "WhatsApp: https://wa.me/" + whatsappContact.whatsapp.replace(/[^0-9]/g, "") : null,
    appUrl ? "View: " + appUrl + "/gig/" + gig.id : null,
  ].filter((l): l is string => l !== null).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// -- Morning digest ------------------------------------------------------------

export async function sendMorningDigest(): Promise<{ sent: boolean; count: number }> {
  const pending = pendingDeferred();
  if (!pending.length) return { sent: false, count: 0 };

  const ids = pending.map(p => p.id);
  markDeferredReleased(ids);

  return { sent: true, count: pending.length };
}
