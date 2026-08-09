/**
 * EMY Studio — Outreach utilities.
 *
 * Each function opens the right app with the message ALREADY WRITTEN.
 * User just clicks send. Nothing to copy, paste, or attach.
 */

import { DJ_EMY } from "@/lib/artist";

// ── Pitch Text (short for WhatsApp/IG, full for email) ──────

function shortPitch(contactName: string, gigTitle: string): string {
  return [
    `Hi ${contactName}`,
    ``,
    `I saw your listing for "${gigTitle}" and I'm interested.`,
    ``,
    `I'm ${DJ_EMY.name}, ${DJ_EMY.tagline}.`,
    ``,
    `• ${DJ_EMY.selectedAppearances[0]}`,
    `• ${DJ_EMY.selectedAppearances[1]}`,
    `• Genres: ${DJ_EMY.genres.slice(0, 3).join(", ")}`,
    `• Bilingual: ${DJ_EMY.languages.join("/")}`,
    ``,
    `EPK: ${DJ_EMY.epkUrl}`,
    `IG: https://instagram.com/${(DJ_EMY.instagram || "").replace("@", "")}`,
    `YT: ${DJ_EMY.youtube}`,
    ``,
    `${DJ_EMY.name}`,
    `${DJ_EMY.phone}`,
  ].join("\n");
}

function fullPitch(contactName: string, gigTitle: string): string {
  return [
    `Hi ${contactName},`,
    ``,
    `I saw your listing for "${gigTitle}" and I would like to express my interest.`,
    ``,
    `I am ${DJ_EMY.name} (${DJ_EMY.legalName}), ${DJ_EMY.tagline}.`,
    ``,
    `KEY CREDENTIALS:`,
    ...DJ_EMY.sellingPoints.map(p => `- ${p}`),
    ``,
    `SELECTED APPEARANCES:`,
    ...DJ_EMY.selectedAppearances.map(a => `- ${a}`),
    ``,
    `GENRES: ${DJ_EMY.genres.join(", ")}`,
    `LANGUAGES: ${DJ_EMY.languages.join(" / ")}`,
    ``,
    `LINKS:`,
    `EPK: ${DJ_EMY.epkUrl || ""}`,
    `Instagram: https://instagram.com/${(DJ_EMY.instagram || "").replace("@", "")}`,
    `YouTube: ${DJ_EMY.youtube || ""}`,
    ``,
    `TECH RIDER:`,
    `${DJ_EMY.techRider.players.join(", ")}`,
    `${DJ_EMY.techRider.mixer.join(", ")}`,
    `${DJ_EMY.techRider.monitors}`,
    ``,
    `CONTACT:`,
    `${DJ_EMY.name}`,
    `Email: ${DJ_EMY.email}`,
    `Phone/WhatsApp: ${DJ_EMY.phone}`,
    `Instagram: ${DJ_EMY.instagram}`,
    `Management: ${DJ_EMY.management.company} - ${DJ_EMY.management.website || ""}`,
    ``,
    `I look forward to discussing this opportunity.`,
    ``,
    `Best regards,`,
    `${DJ_EMY.name}`,
    `${DJ_EMY.instagram}`,
    `${DJ_EMY.phone}`,
  ].join("\n");
}

export { fullPitch as generatePitchText };

// ── Email: opens with full message in body, ready to send ──

export function openEmail(toEmail: string, contactName: string, gigTitle: string): void {
  const subject = `DJ Booking Inquiry: ${gigTitle} - ${DJ_EMY.name}`;
  // Short body that fits within mailto URL limits (~1800 chars max)
  const body = [
    `Hi ${contactName},`,
    ``,
    `I saw your listing for "${gigTitle}" and I would like to express my interest.`,
    ``,
    `I am ${DJ_EMY.name} (${DJ_EMY.legalName}), ${DJ_EMY.tagline}.`,
    ``,
    `- ${DJ_EMY.selectedAppearances[0]}`,
    `- ${DJ_EMY.selectedAppearances[1]}`,
    `- Genres: ${DJ_EMY.genres.slice(0, 3).join(", ")}`,
    `- Bilingual: ${DJ_EMY.languages.join("/")}`,
    ``,
    `EPK: ${DJ_EMY.epkUrl}`,
    `Instagram: https://instagram.com/${(DJ_EMY.instagram || "").replace("@", "")}`,
    `YouTube: ${DJ_EMY.youtube}`,
    ``,
    `Tech: ${DJ_EMY.techRider.players[0]}, ${DJ_EMY.techRider.mixer[0]}`,
    ``,
    `Best regards,`,
    `${DJ_EMY.name}`,
    `${DJ_EMY.phone}`,
    `${DJ_EMY.instagram}`,
  ].join("\n");

  const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Use a hidden iframe to trigger mailto without navigating the page
  // This is the only method that works reliably in PWAs, Chrome, Safari, and Firefox
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  iframe.src = mailto;
  document.body.appendChild(iframe);
  // Clean up after the OS has picked up the protocol
  setTimeout(() => {
    try { document.body.removeChild(iframe); } catch {}
  }, 2000);
}

// ── WhatsApp: opens chat with message written, ready to send ──

export function openWhatsApp(phone: string, contactName: string, gigTitle: string): void {
  const digits = phone.replace(/[^0-9]/g, "");
  const message = shortPitch(contactName, gigTitle);
  window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank");
}

// ── SMS: opens with message written ──

export function openSMS(phone: string, contactName: string, gigTitle: string): void {
  const message = shortPitch(contactName, gigTitle);
  const a = document.createElement("a"); a.href = `sms:${phone}?body=${encodeURIComponent(message)}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Phone call ──

export function openCall(phone: string): void {
  const a = document.createElement("a"); a.href = `tel:${phone}`; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── Instagram DM: opens DM thread ──

export function openInstagramDM(handle: string): void {
  const username = handle.replace("@", "");
  window.open(`https://ig.me/m/${username}`, "_blank");
}

// ── Smart phone detection ──

export type PhoneAction = "whatsapp" | "call";

export function detectPhone(phone: string): PhoneAction {
  const digits = phone.replace(/[^0-9]/g, "");
  // UAE landlines: +9712/3/4/6/7/9 + 7 digits
  if (/^971[234679]\d{7}$/.test(digits)) return "call";
  // Short numbers = landline
  if (digits.length <= 8) return "call";
  // Everything else = likely WhatsApp-capable mobile
  return "whatsapp";
}
