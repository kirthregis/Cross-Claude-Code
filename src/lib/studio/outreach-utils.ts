/**
 * EMY Studio — Outreach utilities for the Opportunities tab.
 *
 * Generates EPK pitch documents, detects contact types (WhatsApp/SMS/landline),
 * and handles smart deeplinks for email, WhatsApp, SMS, Instagram DM, and calls.
 */

import { DJ_EMY } from "@/lib/artist";

// ── EPK Pitch Generator ─────────────────────────────────

export function generatePitchText(contactName: string, gigTitle: string): string {
  return [
    `Hi ${contactName},`,
    ``,
    `I saw your listing for "${gigTitle}" and I would like to express my interest.`,
    ``,
    `I am ${DJ_EMY.name} (${DJ_EMY.legalName}), ${DJ_EMY.tagline}.`,
    ``,
    `▸ KEY CREDENTIALS:`,
    ...DJ_EMY.sellingPoints.map(p => `• ${p}`),
    ``,
    `▸ SELECTED APPEARANCES:`,
    ...DJ_EMY.selectedAppearances.map(a => `• ${a}`),
    ``,
    `▸ GENRES: ${DJ_EMY.genres.join(", ")}`,
    `▸ LANGUAGES: ${DJ_EMY.languages.join(" / ")}`,
    ``,
    `▸ LINKS:`,
    `EPK: ${DJ_EMY.epkUrl || ""}`,
    `Instagram: https://instagram.com/${(DJ_EMY.instagram || "").replace("@", "")}`,
    `YouTube: ${DJ_EMY.youtube || ""}`,
    ``,
    `▸ CONTACT:`,
    `${DJ_EMY.name}`,
    `Email: ${DJ_EMY.email}`,
    `Phone/WhatsApp: ${DJ_EMY.phone}`,
    `Instagram: ${DJ_EMY.instagram}`,
    `Management: ${DJ_EMY.management.company} — ${DJ_EMY.management.website || ""}`,
    ``,
    `I look forward to discussing this opportunity.`,
    ``,
    `Best regards,`,
    `${DJ_EMY.name}`,
    `${DJ_EMY.instagram}`,
    `${DJ_EMY.phone}`,
  ].join("\n");
}

export function generateTechRiderText(): string {
  return [
    `═══════════════════════════════════════`,
    `TECH RIDER — ${DJ_EMY.name}`,
    `═══════════════════════════════════════`,
    ``,
    `MIXER:`,
    ...DJ_EMY.techRider.mixer.map(m => `  ${m}`),
    ``,
    `PLAYERS:`,
    ...DJ_EMY.techRider.players.map(p => `  ${p}`),
    ``,
    `MONITORS:`,
    `  ${DJ_EMY.techRider.monitors}`,
    ``,
    `BOOTH:`,
    ...DJ_EMY.techRider.booth.map(b => `  ${b}`),
    ``,
    `CONNECTIVITY:`,
    ...DJ_EMY.techRider.connectivity.map(c => `  ${c}`),
    ``,
    `NOTES:`,
    ...DJ_EMY.techRider.notes.map(n => `  ${n}`),
    ``,
    `HOSPITALITY:`,
    ...DJ_EMY.hospitalityRider.map(h => `  ${h}`),
    ``,
    `═══════════════════════════════════════`,
    `${DJ_EMY.management.company}`,
    `${DJ_EMY.management.website || ""}`,
    `═══════════════════════════════════════`,
  ].join("\n");
}

export function generateEpkDocument(contactName: string, gigTitle: string): string {
  return [
    generatePitchText(contactName, gigTitle),
    ``,
    ``,
    generateTechRiderText(),
  ].join("\n");
}

/** Create a downloadable .txt file and trigger download */
export function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Contact Type Detection ──────────────────────────────

export type ContactMethod = "whatsapp" | "sms" | "call" | "landline";

/**
 * Detect whether a phone number is mobile (WhatsApp/SMS capable) or landline.
 * UAE landlines: 02/03/04/06/07/09 (2-digit area code + 7 digits)
 * UAE mobiles: 050/052/054/055/056/058 (3-digit prefix + 7 digits)
 * International mobiles: typically 10+ digits with +country code
 */
export function detectContactMethod(phone: string): ContactMethod {
  const digits = phone.replace(/[^0-9]/g, "");

  // UAE landline patterns: +9712, +9713, +9714, +9716, +9717, +9719
  // These are 2-digit area codes (02-09) after country code 971
  const uaeLandline = /^971[234679]\d{7}$/;
  if (uaeLandline.test(digits)) return "landline";

  // UAE mobile: +9715X (050, 052, 054, 055, 056, 058)
  const uaeMobile = /^9715[024568]\d{7}$/;
  if (uaeMobile.test(digits)) return "whatsapp";

  // International: 10+ digits with country code = likely mobile
  if (digits.length >= 10) return "whatsapp";

  // Short numbers = likely landline
  if (digits.length <= 8) return "landline";

  // Default: try WhatsApp
  return "whatsapp";
}

/** Get the appropriate link for a phone number */
export function getPhoneLink(phone: string, message?: string): { href: string; label: string; icon: string } {
  const method = detectContactMethod(phone);
  const digits = phone.replace(/[^0-9+]/g, "");

  switch (method) {
    case "whatsapp":
      return {
        href: `https://wa.me/${digits.replace("+", "")}${message ? `?text=${encodeURIComponent(message)}` : ""}`,
        label: "WhatsApp",
        icon: "💬",
      };
    case "sms":
      return {
        href: `sms:${digits}${message ? `?body=${encodeURIComponent(message)}` : ""}`,
        label: "SMS",
        icon: "📱",
      };
    case "landline":
    default:
      return {
        href: `tel:${digits}`,
        label: "Call",
        icon: "📞",
      };
  }
}

/** Get Instagram DM link — uses app deeplink on mobile, web on desktop */
export function getInstagramLink(handle: string): { href: string; label: string } {
  const username = handle.replace("@", "");
  // instagram://user?username= opens the app on mobile
  // On desktop, falls back to web profile
  return {
    href: `https://ig.me/m/${username}`,
    label: `DM ${handle}`,
  };
}

/** Open email with pre-drafted message, auto-download EPK+rider for attachment */
export function openEmailWithEpk(
  toEmail: string,
  contactName: string,
  gigTitle: string,
): void {
  const pitch = generatePitchText(contactName, gigTitle);
  const subject = `DJ Booking Inquiry: ${gigTitle} — ${DJ_EMY.name}`;

  // 1. Auto-download EPK + Tech Rider as attachable files
  const epkDoc = generateEpkDocument(contactName, gigTitle);
  downloadTextFile(epkDoc, `DJ_Emy_EPK_${gigTitle.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30)}.txt`);

  // 2. Copy pitch to clipboard for pasting into email body
  void navigator.clipboard.writeText(pitch).catch(() => {});

  // 3. Open email client with subject + short body directing to paste
  const shortBody = [
    `Hi ${contactName},`,
    ``,
    `Please find my DJ booking inquiry for "${gigTitle}" below.`,
    `(Full pitch copied to clipboard — paste here, and attach the downloaded EPK file.)`,
    ``,
    `${DJ_EMY.name}`,
    `${DJ_EMY.email}`,
    `${DJ_EMY.phone}`,
    `${DJ_EMY.instagram}`,
    `EPK: ${DJ_EMY.epkUrl}`,
  ].join("\n");

  window.open(
    `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`,
    "_self"
  );
}
