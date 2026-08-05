import { Gig } from "./types";
import {
  sendWhatsApp,
  sendEmail,
  whatsappConfigured,
  emailConfigured,
  actionLinks,
} from "./channels";
import { logAlert, deferAlert, pendingDeferred, markDeferredReleased } from "./db";
import { pitch } from "./outreach";

export function isQuietHours(): boolean {
  const hour = new Date().getHours();
  return hour >= 2 && hour < 8;
}

export function isDigestTime(): boolean {
  const hour = new Date().getHours();
  return hour === 8;
}

export interface AlertResult {
  sent: string[];
  deferred: boolean;
}

export async function alert(gig: Gig, score: { score: number }): Promise<AlertResult> {
  if (score.score < 40) return { sent: [], deferred: false };

  if (isQuietHours()) {
    deferAlert(gig.id);
    return { sent: [], deferred: true };
  }

  const sent: string[] = [];
  const links = actionLinks(gig);
  const message = `🎯 New gig match!\n\n${gig.title}\nSource: ${gig.sourceName}\n\nView: ${links.view}`;

  if (whatsappConfigured()) {
    const ok = await sendWhatsApp("971503443281", message);
    if (ok) sent.push("whatsapp");
  }

  if (emailConfigured()) {
    const ok = await sendEmail(
      "emy@emystudio.com",
      `New Gig: ${gig.title}`,
      pitch(gig)
    );
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