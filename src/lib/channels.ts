/**
 * Alert delivery channels.
 *
 * Emy uses WhatsApp, Instagram and email — not Telegram. This module adds
 * those, and each one degrades gracefully: unconfigured channels are skipped
 * so the rest still deliver.
 *
 * Reality check on each platform:
 *  - WhatsApp  — official Cloud API. Best channel: it's where she already is.
 *                Outside a 24h conversation window Meta requires a pre-approved
 *                template, so we send a template when configured and fall back
 *                to plain text inside the window.
 *  - Email     — Resend/SMTP. Always works, no approval, good for detail.
 *  - Instagram — Meta does NOT permit sending unsolicited DMs to yourself via
 *                API. Anything claiming otherwise risks the account. We deliver
 *                Instagram-sourced gigs over WhatsApp/email with a deep link
 *                straight into the IG thread instead.
 */

import type { Gig } from "./types";

import { logAlert } from "./db";

const env = (k: string) => process.env[k]?.trim() || undefined;

export interface ChannelResult {
  channel: string;
  ok: boolean;
  detail?: string;
}

/* ------------------------------------------------------------------ *
 * WhatsApp — Meta Cloud API
 * ------------------------------------------------------------------ */
export function whatsappConfigured(): boolean {
  return !!(env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_ID") && env("WHATSAPP_TO"));
}

export async function sendWhatsApp(text: string, gigId?: string, tier = "normal"): Promise<ChannelResult> {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_ID");
  const to = env("WHATSAPP_TO")?.replace(/\D/g, "");
  if (!token || !phoneId || !to) return { channel: "whatsapp", ok: false, detail: "not configured" };

  const template = env("WHATSAPP_TEMPLATE");
  const body = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: env("WHATSAPP_TEMPLATE_LANG") ?? "en" },
          // Template must have exactly one {{1}} body variable.
          components: [{ type: "body", parameters: [{ type: "text", text: text.slice(0, 1000) }] }],
        },
      }
    : { messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: text } };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    const ok = res.ok;
    const detail = ok ? undefined : (await res.text()).slice(0, 300);
    if (gigId) await logAlert(gigId, tier, "whatsapp", ok, detail);
    return { channel: "whatsapp", ok, detail };
  } catch (e) {
    if (gigId) await logAlert(gigId, tier, "whatsapp", false, String(e));
    return { channel: "whatsapp", ok: false, detail: String(e) };
  }
}

/* ------------------------------------------------------------------ *
 * Email — Resend (simplest to set up), or any SMTP relay via webhook
 * ------------------------------------------------------------------ */
export function emailConfigured(): boolean {
  return !!(env("RESEND_API_KEY") && env("ALERT_EMAIL_TO"));
}

export async function sendEmail(
  subject: string,
  text: string,
  gigId?: string,
  tier = "normal"
): Promise<ChannelResult> {
  const key = env("RESEND_API_KEY");
  const to = env("ALERT_EMAIL_TO");
  const from = env("ALERT_EMAIL_FROM") ?? "GigRadar <onboarding@resend.dev>";
  if (!key || !to) return { channel: "email", ok: false, detail: "not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: to.split(",").map((s) => s.trim()),
        subject,
        text,
        html: `<pre style="font:14px/1.5 -apple-system,system-ui,sans-serif;white-space:pre-wrap">${text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")}</pre>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const ok = res.ok;
    const detail = ok ? undefined : (await res.text()).slice(0, 300);
    if (gigId) await logAlert(gigId, tier, "email", ok, detail);
    return { channel: "email", ok, detail };
  } catch (e) {
    if (gigId) await logAlert(gigId, tier, "email", false, String(e));
    return { channel: "email", ok: false, detail: String(e) };
  }
}

/* ------------------------------------------------------------------ *
 * Deep links — get her from the alert into the right app in one tap
 * ------------------------------------------------------------------ */

/** Opens the WhatsApp chat with the booker, pre-filled with the pitch. */
export function whatsappDeepLink(phone: string, message?: string): string {
  const num = phone.replace(/\D/g, "");
  return `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message.slice(0, 1500))}` : ""}`;
}

/** Opens the Instagram profile (or thread) for the promoter who posted. */
export function instagramDeepLink(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

export function mailtoLink(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * The one-tap action row for a gig, ordered by how directly it reaches the
 * person who can say yes.
 */
export function actionLinks(g: Gig, pitchText: string): { label: string; url: string }[] {
  const out: { label: string; url: string }[] = [];
  const best = [...g.contacts].sort((a, b) => b.decisionPower - a.decisionPower)[0];

  if (best?.whatsapp || best?.phone) {
    out.push({ label: "WhatsApp the booker", url: whatsappDeepLink((best.whatsapp ?? best.phone)!, pitchText) });
  }
  if (best?.email) {
    out.push({
      label: "Email the booker",
      url: mailtoLink(best.email, `DJ Emy — availability${g.eventDate ? ` for ${g.eventDate}` : ""}`, pitchText),
    });
  }
  if (best?.instagram) {
    out.push({ label: "Open Instagram", url: instagramDeepLink(best.instagram) });
  }
  if (g.sourceUrl) out.push({ label: "View original post", url: g.sourceUrl });
  return out;
}

export function channelStatus() {
  return [
    {
      id: "whatsapp",
      label: "WhatsApp alerts",
      configured: whatsappConfigured(),
      setup:
        "Meta WhatsApp Cloud API: set WHATSAPP_TOKEN, WHATSAPP_PHONE_ID and WHATSAPP_TO (her number, digits only). Outside a 24h window Meta needs an approved template — set WHATSAPP_TEMPLATE once you have one.",
    },
    {
      id: "email",
      label: "Email alerts",
      configured: emailConfigured(),
      setup: "Resend: set RESEND_API_KEY and ALERT_EMAIL_TO (comma-separated for more than one recipient).",
    },
    {
      id: "instagram",
      label: "Instagram",
      configured: false,
      setup:
        "Meta does not allow sending unsolicited DMs to your own account via API, so there is no safe Instagram alert channel. Instagram-sourced gigs are alerted over WhatsApp/email with a one-tap link into the IG thread.",
    },
  ];
}
