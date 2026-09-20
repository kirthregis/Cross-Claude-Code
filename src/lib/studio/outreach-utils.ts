/**
 * EMY Studio — Outreach utilities.
 *
 * Each function opens the right app with the message ALREADY WRITTEN.
 * User just clicks send. Nothing to copy, paste, or attach.
 */

import { activeProfile } from "@/lib/active-profile";

// ── Pitch Text (short for WhatsApp/IG, full for email) ──────

function shortPitch(contactName: string, gigTitle: string): string {
  const p = activeProfile();
  return [
    `Hi ${contactName}`,
    ``,
    `I saw your listing for "${gigTitle}" and I'm interested.`,
    ``,
    `I'm ${p.name}, ${p.tagline}.`,
    ``,
    `• ${p.selectedAppearances[0]}`,
    `• ${p.selectedAppearances[1]}`,
    `• Genres: ${p.genres.slice(0, 3).join(", ")}`,
    `• Bilingual: ${p.languages.join("/")}`,
    ``,
    `EPK: ${p.epkUrl}`,
    `IG: https://instagram.com/${(p.instagram || "").replace("@", "")}`,
    `YT: ${p.youtube}`,
    ``,
    `${p.name}`,
    `${p.phone} · ${p.management.phone} (Kirth, backup)`,
  ].join("\n");
}

function fullPitch(contactName: string, gigTitle: string): string {
  const p = activeProfile();
  return [
    `Hi ${contactName},`,
    ``,
    `I saw your listing for "${gigTitle}" and I would like to express my interest.`,
    ``,
    `I am ${p.name} (${p.legalName}), ${p.tagline}.`,
    ``,
    `KEY CREDENTIALS:`,
    ...p.sellingPoints.map(s => `- ${s}`),
    ``,
    `SELECTED APPEARANCES:`,
    ...p.selectedAppearances.map(a => `- ${a}`),
    ``,
    `GENRES: ${p.genres.join(", ")}`,
    `LANGUAGES: ${p.languages.join(" / ")}`,
    ``,
    `LINKS:`,
    `EPK: ${p.epkUrl || ""}`,
    `Instagram: https://instagram.com/${(p.instagram || "").replace("@", "")}`,
    `YouTube: ${p.youtube || ""}`,
    ``,
    `TECH RIDER:`,
    `${p.techRider.players.join(", ")}`,
    `${p.techRider.mixer.join(", ")}`,
    `${p.techRider.monitors}`,
    ``,
    `CONTACT:`,
    `${p.name}`,
    `Email: ${p.management.email}`,
    `Phone/WhatsApp: ${p.phone} · ${p.management.phone} (Kirth, backup)`,
    `Instagram: ${p.instagram}`,
    `Management: ${p.management.company} - ${p.management.website || ""}`,
    ``,
    `I look forward to discussing this opportunity.`,
    ``,
    `Best regards,`,
    `${p.name}`,
    `${p.instagram}`,
    `${p.phone} · ${p.management.phone} (Kirth, backup)`,
  ].join("\n");
}

export { fullPitch as generatePitchText };

// ── Email: opens Gmail compose with message written, ready to send ──

export function openEmail(toEmail: string, contactName: string, gigTitle: string): void {
  const p = activeProfile();
  const subject = `DJ Booking Inquiry: ${gigTitle} - ${p.name}`;
  const body = [
    `Hi ${contactName},`,
    ``,
    `I saw your listing for "${gigTitle}" and I would like to express my interest.`,
    ``,
    `I am ${p.name} (${p.legalName}), ${p.tagline}.`,
    ``,
    `- ${p.selectedAppearances[0]}`,
    `- ${p.selectedAppearances[1]}`,
    `- Genres: ${p.genres.slice(0, 3).join(", ")}`,
    `- Bilingual: ${p.languages.join("/")}`,
    ``,
    `EPK: ${p.epkUrl}`,
    `IG: https://instagram.com/${(p.instagram || "").replace("@", "")}`,
    `YT: ${p.youtube}`,
    ``,
    `Best regards,`,
    `${p.name}`,
    `${p.phone} · ${p.management.phone} (Kirth, backup)`,
  ].join("\n");

  // Open Gmail compose directly - works everywhere
  window.open(
    `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(toEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    "_blank"
  );
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
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    // Mobile: open Instagram app directly to profile (user taps Message)
    window.location.href = `instagram://user?username=${username}`;
    // Fallback if app not installed
    setTimeout(() => { window.open(`https://www.instagram.com/${username}/`, "_blank"); }, 1500);
  } else {
    // Desktop: open profile page
    window.open(`https://www.instagram.com/${username}/`, "_blank");
  }
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
