import type { Gig } from "./types";

const env = (k: string) => process.env[k]?.trim() || undefined;

export function whatsappConfigured(): boolean {
  return !!(
    (env("WHATSAPP_TOKEN") && env("WHATSAPP_PHONE_ID")) ||
    env("WHATSAPP_API_URL")
  );
}

export function emailConfigured(): boolean {
  return !!(env("RESEND_API_KEY") || env("SENDGRID_KEY") || env("SMTP_HOST"));
}

export function cleanPhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

export function whatsappDeepLink(phone: string, text: string): string {
  const digits = cleanPhone(phone);
  // Cap text length so total URL is well within browser / messaging limits (< 2000 chars)
  const maxTextLen = 1500;
  const trimmed = text.length > maxTextLen ? text.slice(0, maxTextLen) : text;
  return `https://wa.me/${digits}?text=${encodeURIComponent(trimmed)}`;
}

export function instagramDeepLink(handle: string): string {
  const clean = handle.replace(/^@+/, "").trim();
  return `https://instagram.com/${clean}`;
}

export function mailtoLink(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const token = env("WHATSAPP_TOKEN");
  const phoneId = env("WHATSAPP_PHONE_ID");
  if (token && phoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: cleanPhone(to),
          type: "text",
          text: { body: message },
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  const url = env("WHATSAPP_API_URL");
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: cleanPhone(to), message }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const resendKey = env("RESEND_API_KEY");
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "EMY Studio <alerts@emyvisiongroup.com>",
          to,
          subject,
          text: body,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}

export interface ActionLink {
  label: string;
  url: string;
  channel: "whatsapp" | "email" | "instagram" | "web" | "view";
}

export function actionLinks(gig: Gig, pitchText = `Hi, enquiry regarding ${gig.title}`): ActionLink[] {
  const links: ActionLink[] = [];

  // 1. Phone / WhatsApp
  const phoneContact = gig.contacts?.find((c) => c.phone || c.whatsapp);
  const rawPhone = phoneContact?.whatsapp || phoneContact?.phone;
  const phoneMatch = !rawPhone ? gig.body.match(/(?:\+971|00971|05)\s*\d[\d\s-]{6,12}/) : null;
  const phone = rawPhone || (phoneMatch ? phoneMatch[0] : null);

  if (phone) {
    links.push({
      label: `WhatsApp ${phone}`,
      url: whatsappDeepLink(phone, pitchText),
      channel: "whatsapp",
    });
  }

  // 2. Email
  const emailContact = gig.contacts?.find((c) => c.email);
  const emailMatch = !emailContact ? gig.body.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i) : null;
  const email = emailContact?.email || (emailMatch ? emailMatch[0] : null);

  if (email) {
    links.push({
      label: `Email ${email}`,
      url: mailtoLink(email, `DJ Booking Enquiry — ${gig.title}`, pitchText),
      channel: "email",
    });
  }

  // 3. Instagram
  const igContact = gig.contacts?.find((c) => c.instagram);
  const igMatch = !igContact ? gig.body.match(/@([a-zA-Z0-9_.-]{3,30})/) : null;
  const ig = igContact?.instagram || (igMatch ? igMatch[1] : null);

  if (ig) {
    links.push({
      label: `Instagram @${ig.replace(/^@/, "")}`,
      url: instagramDeepLink(ig),
      channel: "instagram",
    });
  }

  // 4. Original Source URL
  if (gig.sourceUrl) {
    links.push({
      label: `Original post (${gig.sourceName})`,
      url: gig.sourceUrl,
      channel: "web",
    });
  }

  // 5. Internal GigRadar link
  links.push({
    label: "View in GigRadar",
    url: `/gig/${gig.id}`,
    channel: "view",
  });

  return links;
}

export function channelStatus(): Array<{
  id: string;
  name: string;
  configured: boolean;
  setup: string;
}> {
  return [
    {
      id: "whatsapp",
      name: "WhatsApp Cloud API",
      configured: whatsappConfigured(),
      setup: "Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID in environment variables.",
    },
    {
      id: "email",
      name: "Email (Resend)",
      configured: emailConfigured(),
      setup: "Add RESEND_API_KEY in environment variables.",
    },
    {
      id: "instagram",
      name: "Instagram Direct",
      configured: false,
      setup: "Instagram does not allow automated direct messaging for personal accounts / bots without Meta Business verification.",
    },
  ];
}
