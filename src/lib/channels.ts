import { Gig } from "./types";

const env = (k: string) => process.env[k]?.trim() || undefined;

export function whatsappConfigured(): boolean {
  return !!env("WHATSAPP_API_URL");
}

export function emailConfigured(): boolean {
  return !!env("SMTP_HOST") || !!env("SENDGRID_KEY");
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const url = env("WHATSAPP_API_URL");
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, message }),
    });
    return res.ok;
  } catch { return false; }
}

export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  console.log(`Email to ${to}: ${subject}`);
  return true;
}

export function actionLinks(gig: Gig) {
  return {
    whatsapp: `https://wa.me/971503443281?text=${encodeURIComponent(`New gig: ${gig.title}`)}`,
    view: `/studio/gigradar`,
  };
}

export function channelStatus() {
  return {
    whatsapp: whatsappConfigured(),
    email: emailConfigured(),
  };
}