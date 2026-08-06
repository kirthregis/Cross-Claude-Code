import type { Gig } from "./types";
import {
  sendWhatsApp,
  sendEmail,
  whatsappConfigured,
  emailConfigured,
  whatsappDeepLink,
} from "./channels";
import { logAlert, deferAlert, pendingDeferred, markDeferredReleased } from "./db";
import { pitch, quoteFor, pitchFee } from "./outreach";

export function isQuietHours(now: Date = new Date()): boolean {
  const dubaiHour = (now.getUTCHours() + 4) % 24;
  return dubaiHour >= 2 && dubaiHour < 9;
}

export function isDigestTime(now: Date = new Date()): boolean {
  const dubaiHour = (now.getUTCHours() + 4) % 24;
  return dubaiHour === 9;
}

export interface AlertResult {
  sent: string[];
  deferred?: boolean;
  skipped?: string;
}

export function buildPlainMessage(
  gig: Gig,
  score: { score: number; rationale?: string[] },
): string {
  const appUrl = process.env.APP_URL || "https://emy-studio-rho.vercel.app";
  const quote = quoteFor(gig);
  const ask = pitchFee(gig) || quote.askAed;

  const phoneContact = gig.contacts?.find((c) => c.phone || c.whatsapp);
  const rawPhone = phoneContact?.whatsapp || phoneContact?.phone;
  const phoneMatch = !rawPhone ? gig.body.match(/(?:\+971|00971|05)\s*\d[\d\s-]{6,12}/) : null;
  const phone = rawPhone || (phoneMatch ? phoneMatch[0] : null);

  const lines: string[] = [];
  lines.push(`New Gig Lead (${score.score}/100)`);
  lines.push(`${gig.title}`);

  if (gig.venueName) {
    lines.push(`Venue: ${gig.venueName}`);
  }

  lines.push(`Ask AED: ${ask.toLocaleString()}`);

  if (phone) {
    lines.push(`WhatsApp Contact: ${whatsappDeepLink(phone, `Hi, enquiry regarding ${gig.title}`)}`);
  }

  lines.push(`Gig Details: ${appUrl}/gig/${gig.id}`);

  return lines.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function alert(
  gig: Gig,
  score: { score: number; tier?: string; rationale?: string[] },
  now: Date = new Date(),
): Promise<AlertResult> {
  const isUrgent = score.tier === "urgent";

  if (!isUrgent && isQuietHours(now)) {
    deferAlert(gig.id);
    return {
      sent: [],
      deferred: true,
      skipped: "queued for morning digest (quiet hours)",
    };
  }

  const sent: string[] = [];
  const message = buildPlainMessage(gig, score);

  if (whatsappConfigured()) {
    const to = process.env.WHATSAPP_TO || "971503443281";
    const ok = await sendWhatsApp(to, message);
    if (ok) sent.push("whatsapp");
  }

  if (emailConfigured()) {
    const to = process.env.STUDIO_NOTIFY_TO || "admin@emyvisiongroup.com";
    const p = pitch(gig, "email");
    const ok = await sendEmail(to, p.subject || `New Lead: ${gig.title}`, p.body);
    if (ok) sent.push("email");
  }

  if (sent.length) logAlert(gig.id);

  return { sent, deferred: false };
}

export async function sendMorningDigest(): Promise<{ sent: boolean; count: number }> {
  const pending = pendingDeferred();
  if (!pending.length) return { sent: false, count: 0 };

  const ids = pending.map((p) => p.id);
  markDeferredReleased(ids);

  return { sent: true, count: pending.length };
}
