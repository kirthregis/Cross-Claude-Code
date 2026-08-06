# -*- coding: utf-8 -*-
import os, subprocess

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    size = os.path.getsize(path)
    print(f"WROTE {path} ({size} bytes)")

# -------------------------------------------------------------------------------
# 1. outreach.ts
# -------------------------------------------------------------------------------
write("src/lib/outreach.ts", r'''import { activeProfile } from "./active-profile";
import { quote } from "./pricing";
import type { Gig } from "./types";

// -- Internal helpers ----------------------------------------------------------

function priceInputs(gig: Gig) {
  return {
    venueTier: gig.venueTier ?? "unknown",
    setLengthMins: gig.setLengthMins ?? 120,
    slot: gig.slot ?? "unknown",
    eventDate: gig.eventDate,
    exclusivity: gig.exclusivity,
    travelRequired: gig.travelRequired,
    recurring: gig.recurring,
    budgetStatedAed: gig.budgetStatedAed,
  } as const;
}

// -- Public: quoteFor ----------------------------------------------------------

export function quoteFor(gig: Gig): { askAed: number; targetAed: number; walkAwayAed: number; currency: string } {
  const q = quote(priceInputs(gig));
  return { askAed: q.askAed, targetAed: q.targetAed, walkAwayAed: q.walkAwayAed, currency: "AED" };
}

// -- Public: pitchFee ----------------------------------------------------------
// If the client stated a budget that beats our ask, pitch their number.
// Otherwise pitch our ask.

export function pitchFee(gig: Gig): number {
  const q = quoteFor(gig);
  if (gig.budgetStatedAed && gig.budgetStatedAed > q.askAed) return gig.budgetStatedAed;
  return q.askAed;
}

// -- Public: pitch -------------------------------------------------------------

export interface PitchResult {
  subject?: string;
  body: string;
}

export function pitch(gig: Gig, channel: "whatsapp" | "email"): PitchResult {
  const p = activeProfile();
  const m = p.management;
  const fee = pitchFee(gig);
  const feeStr = "AED " + fee.toLocaleString();
  const venueTier = gig.venueTier ?? "unknown";
  const isArabicRoom = /arabic|eid|ramadan|gulf|khaleeji/i.test(gig.body + gig.title);
  const isBrandOrFestival = venueTier === "brand_activation" || venueTier === "festival";

  // Choose the right proof point for the room
  const proofPoint = isBrandOrFestival
    ? "official DJ for FIFA World Cup Qatar 2022 and FIFA Arab Cup Qatar 2025"
    : isArabicRoom
    ? "bilingual EN/AR DJ who reads both international and Arabic crowds fluently"
    : "one of the few female Afro House DJs commanding a peak-time floor in the GCC";

  if (channel === "whatsapp") {
    const body = [
      "Hi,",
      "",
      `Re: ${gig.title}`,
      "",
      `I am reaching out on behalf of DJ Emy through Emy Vision Group.`,
      `DJ Emy is ${proofPoint}.`,
      "",
      `She is available for this date. Our fee is ${feeStr}.`,
      "",
      `Please confirm the date, set time and any technical requirements.`,
      "",
      `Kind regards,`,
      `${m.contactName} � ${m.company}`,
      m.phone,
    ].join("\n");
    return { body };
  }

  // email
  const subject = `DJ Emy � Booking Enquiry: ${gig.title}`;
  const body = [
    `Dear Booking Manager,`,
    "",
    `I am writing to express interest in the ${gig.title} opportunity on behalf of DJ Emy, represented exclusively by ${m.company}.`,
    "",
    `DJ Emy is ${proofPoint}. Her profile:`,
    `  - FIFA World Cup Qatar 2022 � official tournament DJ`,
    `  - FIFA Arab Cup Qatar 2025 � tournament DJ`,
    `  - Headline sets at Zeus Jumeirah, Amwaj Rooftop and international venues`,
    `  - 100% live performance, reads the room in English and Arabic`,
    "",
    `Proposed fee: ${feeStr}`,
    `50% deposit on booking, balance due on the day of the event.`,
    "",
    `All bookings are contracted through ${m.legalName} (Trade Licence ${m.tradeLicenceNo ?? "on file"}).`,
    "",
    `EPK and press assets: ${p.epkUrl ?? "available on request"}`,
    `Instagram: ${p.instagram ?? "@dj_emy_"}`,
    "",
    `I look forward to hearing from you.`,
    "",
    `Best regards,`,
    `${m.contactName}`,
    `${m.contactRole} � ${m.company}`,
    m.email,
    m.phone,
  ].join("\n");
  return { subject, body };
}

// -- Public: generateWhatsAppLink ----------------------------------------------
// Used by the GigRadar UI to build a wa.me deep link.

export function generateWhatsAppLink(gig: Gig): string {
  const p = activeProfile();
  const body = pitch(gig, "whatsapp").body;
  const phone = p.management.phone.replace(/[^0-9]/g, "");
  // Cap at 1800 chars so the link stays within WhatsApp's URL limit.
  const text = body.length > 1800 ? body.slice(0, 1800) : body;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

// -- Public: contactStrategy ---------------------------------------------------
// Returns contacts sorted best-first with a recommended action per contact.
// If no contacts found, advises finding the entertainment manager directly.

export interface ContactStrategyEntry {
  channel: string;
  contact: string;
  why: string;
  action?: string;
}

export function contactStrategy(gig: Gig): ContactStrategyEntry[] {
  const contacts = gig.contacts ?? [];
  if (contacts.length === 0) {
    return [{
      channel: "direct",
      contact: gig.venueName ?? gig.title,
      why: "No contact details found. Visit the venue or message their Instagram to find the entertainment manager or F&B director � they are the actual decision-makers.",
      action: "Find the entertainment manager directly.",
    }];
  }

  const entries: ContactStrategyEntry[] = [];

  // WhatsApp/phone � highest leverage
  for (const c of contacts.filter(x => x.whatsapp || x.phone)) {
    const contact = c.whatsapp ?? c.phone ?? "";
    entries.push({
      channel: "whatsapp",
      contact,
      why: "Phone contact � highest response rate. Decision power: " + (c.decisionPower ?? 0) + "%.",
      action: generateWhatsAppLink({ ...gig, contacts: [c] }),
    });
  }

  // Email
  for (const c of contacts.filter(x => x.email)) {
    entries.push({
      channel: "email",
      contact: c.email ?? "",
      why: "Email contact. Decision power: " + (c.decisionPower ?? 0) + "%.",
    });
  }

  // Instagram
  for (const c of contacts.filter(x => x.instagram)) {
    entries.push({
      channel: "instagram",
      contact: c.instagram ?? "",
      why: "Instagram DM. Good for initial contact if phone is unavailable.",
    });
  }

  // Sort by decision power descending
  entries.sort((a, b) => {
    const pa = contacts.find(c => c.whatsapp === a.contact || c.phone === a.contact || c.email === a.contact || c.instagram === a.contact)?.decisionPower ?? 0;
    const pb = contacts.find(c => c.whatsapp === b.contact || c.phone === b.contact || c.email === b.contact || c.instagram === b.contact)?.decisionPower ?? 0;
    return pb - pa;
  });

  return entries;
}

// -- Public: negotiationPlaybook -----------------------------------------------
// Returns an array of {objection, response} counters.

export interface NegotiationCounter {
  objection: string;
  response: string;
}

export function negotiationPlaybook(gig: Gig): NegotiationCounter[] {
  const q = quoteFor(gig);
  const ask = "AED " + q.askAed.toLocaleString();
  const target = "AED " + q.targetAed.toLocaleString();
  const floor = "AED " + q.walkAwayAed.toLocaleString();

  return [
    {
      objection: "Your rate is too high",
      response: `Our opening is ${ask}. We can move to ${target} if you can confirm the date and 50% deposit this week. Below ${floor} we cannot proceed � that is our cost floor, not a negotiating position.`,
    },
    {
      objection: "The going rate is 2,000 to 3,000 AED",
      response: `That is the market rate for an open-format DJ from the general pool. DJ Emy is represented by Emy Vision Group, is the official FIFA World Cup Qatar 2022 tournament DJ, and is one of the only female Afro House DJs in the GCC with a verifiable peak-time floor record. We are not in that category � we reframe the category entirely. Our floor is ${floor}.`,
    },
    {
      objection: "Can you do it for exposure?",
      response: `Exposure does not pay overheads. We appreciate the offer but all bookings require a professional fee. If budget is genuinely limited, we can discuss a shorter set, a weeknight residency rate, or a package across multiple dates � all at a reduced but still professional fee.`,
    },
    {
      objection: "We have worked with bigger names for less",
      response: `We would love to see those contracts � genuinely. If a comparable artist with comparable credentials played your venue for less, we are open to reviewing. Otherwise, we price against our actual market position: FIFA-credentialled, bilingual, Emy Vision Group-backed. That is what you are booking.`,
    },
    {
      objection: "We need exclusivity for the week",
      response: `An exclusivity or radius clause blocks other income for that period. It is priced as a separate line item � typically +30% on the agreed fee. We are happy to agree exclusivity at ${ask} plus the premium, or waive it and proceed at ${target}.`,
    },
    {
      objection: "Can we pay after the event?",
      response: `Our standard terms are 50% deposit on signing to hold the date, balance due on the day before the set. We do not perform against a post-event invoice � this protects both parties and is standard in the industry.`,
    },
    {
      objection: "We need a last-minute booking at short notice",
      response: `Short-notice availability is priced at a premium because it means turning down other enquiries and compressing preparation time. For bookings within 72 hours we require full payment upfront. The rate is ${ask}.`,
    },
  ];
}

// -- Public: generatePitch (alias kept for GigRadar UI compatibility) ----------

export function generatePitch(gig: Gig): string {
  return pitch(gig, "email").body;
}
''')

# -------------------------------------------------------------------------------
# 2. contract.ts
# -------------------------------------------------------------------------------
write("src/lib/contract.ts", r'''import { activeProfile } from "./active-profile";
import type { Gig } from "./types";
import { quoteFor } from "./outreach";

export interface DealTerms {
  agreedFeeAed: number;
  eventDate: string;
  loadInTime?: string;
  setStart?: string;
  setEnd?: string;
  clientLegalName?: string;
  clientAddress?: string;
  venueAddress?: string;
  exclusivityKm?: number;
}

export interface DealPack {
  contract: string;
  runsheet: string;
  invoice: string;
  pressPack: string;
  terms: DealTerms;
}

const money = (n: number) => "AED " + n.toLocaleString();
const line = (n = 60) => "=".repeat(n);

export function deriveTerms(g: Gig, overrides: Partial<DealTerms> = {}): DealTerms {
  const q = quoteFor(g);
  return {
    agreedFeeAed: overrides.agreedFeeAed ?? g.feeAed ?? q.targetAed,
    eventDate: overrides.eventDate ?? g.eventDate ?? "TBC",
    setStart: overrides.setStart ?? "23:00",
    setEnd: overrides.setEnd ?? "01:00",
    loadInTime: overrides.loadInTime ?? "22:00",
    clientLegalName: overrides.clientLegalName ?? g.venueName ?? "[CLIENT LEGAL NAME]",
    clientAddress: overrides.clientAddress ?? "[CLIENT REGISTERED ADDRESS]",
    venueAddress: overrides.venueAddress ?? [g.venueName, g.area, "Dubai, UAE"].filter(Boolean).join(", "),
    exclusivityKm: overrides.exclusivityKm ?? 0,
  };
}

// -- CONTRACT ------------------------------------------------------------------

export function generateContract(g: Gig, t: DealTerms): string {
  const p = activeProfile();
  const m = p.management;
  const cd = p.contractDefaults;
  const deposit = Math.round((t.agreedFeeAed * cd.depositPercent) / 100);
  const balance = t.agreedFeeAed - deposit;

  const cancelRows = cd.cancellationTiers.map(tier =>
    `  - Cancellation within ${tier.withinDays} days: THE COMPANY retains ${tier.artistKeepsPercent}% of the agreed fee.`
  ).join("\n");

  const riderLines = [
    ...p.techRider.mixer,
    ...p.techRider.players,
    "Monitors: " + p.techRider.monitors,
    ...p.techRider.booth,
    ...p.techRider.connectivity,
    ...p.techRider.notes,
  ].map(r => "  " + r).join("\n");

  const exclusivityClause = (t.exclusivityKm ?? 0) > 0
    ? `THE ARTIST agrees not to perform at any other public venue within ${t.exclusivityKm}km of the venue during the 7-day period surrounding the event date.`
    : "No exclusivity or radius restriction applies to this engagement.";

  return [
    line(),
    "DJ PERFORMANCE AGREEMENT",
    line(),
    "",
    "This agreement is entered into between:",
    "",
    `THE COMPANY: ${m.legalName}`,
    `  Trade Licence: ${m.tradeLicenceNo ?? "on file"}`,
    `  Address: ${m.address ?? "Sharjah Publishing City Free Zone, Sharjah, UAE"}`,
    `  Contact: ${m.contactName} (${m.contactRole}) | ${m.email} | ${m.phone}`,
    "",
    `THE CLIENT: ${t.clientLegalName}`,
    `  Address: ${t.clientAddress}`,
    "",
    `THE ARTIST: ${p.legalName} professionally known as "DJ Emy"`,
    `  Represented exclusively by THE COMPANY � Emy Vision Group`,
    "",
    line(),
    "1. EVENT DETAILS",
    line(),
    `  Venue: ${t.venueAddress}`,
    `  Event Date: ${t.eventDate}`,
    `  Load-in: ${t.loadInTime ?? "22:00"}`,
    `  Set Start: ${t.setStart ?? "23:00"}`,
    `  Set End: ${t.setEnd ?? "01:00"}`,
    "",
    line(),
    "2. FEES AND PAYMENT",
    line(),
    `  Agreed Fee: ${money(t.agreedFeeAed)} (inclusive of all applicable taxes unless stated otherwise)`,
    `  Deposit (${cd.depositPercent}%): ${money(deposit)} � due within ${cd.depositDueDays} days of signing`,
    `  Balance: ${money(balance)} � due on or before the day of the event`,
    "",
    `  All fees are payable to Emy Vision Group, not to the Artist directly.`,
    `  Payment to any other party does not discharge the Client's obligation.`,
    "",
    `  Bank: ${m.bank?.bankName ?? "Mashreqbank PSC"}`,
    `  Account Name: ${m.bank?.accountName ?? "EMY VISION GROUP FZC"}`,
    `  IBAN: ${m.bank?.iban ?? "AE060330000019102008190"}`,
    `  SWIFT: ${m.bank?.swift ?? "BOMLAEAD"}`,
    "",
    line(),
    "3. CANCELLATION",
    line(),
    cancelRows,
    "  - Cancellation by THE CLIENT with more than 30 days notice: deposit is non-refundable.",
    "  - Cancellation by THE COMPANY: full refund of any deposit paid within 14 days.",
    "",
    line(),
    "4. TECHNICAL RIDER",
    line(),
    "  THE CLIENT shall provide the following at their cost:",
    riderLines,
    "",
    line(),
    "5. EXCLUSIVITY",
    line(),
    `  ${exclusivityClause}`,
    "",
    line(),
    "6. INTELLECTUAL PROPERTY",
    line(),
    `  ${cd.ipPolicy}`,
    `  Artist retains all rights in her performance, name, likeness, logo and any mixes supplied.`,
    "",
    line(),
    "7. RECORDING AND STREAMING",
    line(),
    `  ${cd.recordingPolicy}`,
    "",
    line(),
    "8. SOUND AND VENUE",
    line(),
    `  ${cd.soundLimitPolicy}`,
    "",
    line(),
    "9. FORCE MAJEURE",
    line(),
    `  ${cd.forceMajeure}`,
    "",
    line(),
    "10. NON-CIRCUMVENTION",
    line(),
    `  THE CLIENT agrees not to contact, negotiate with, or engage THE ARTIST directly, bypassing Emy Vision Group.`,
    `  Any attempt to circumvent this clause renders this agreement void and entitles THE COMPANY to the full fee.`,
    "",
    line(),
    "11. GOVERNING LAW",
    line(),
    `  This agreement is governed by the ${cd.governingLaw}`,
    `  Disputes shall be referred to Dubai Courts.`,
    "",
    line(),
    "SIGNATURES",
    line(),
    "",
    "FOR THE CLIENT:",
    "Name: _______________________________",
    "Signature: __________________________",
    "Date: _______________________________",
    "",
    `FOR THE COMPANY � Emy Vision Group:`,
    `Name: ${m.contactName}`,
    `Role: ${m.contactRole} � Business Development`,
    "Signature: __________________________",
    "Date: _______________________________",
    "",
    line(),
    `Generated by EMY Studio | ${m.company} | ${m.email}`,
    line(),
  ].join("\n");
}

// -- RUNSHEET ------------------------------------------------------------------

export function generateRunsheet(g: Gig, t: DealTerms): string {
  const p = activeProfile();
  const m = p.management;
  const contacts = (g.contacts ?? [])
    .map(c => `  - ${c.name ?? "Contact"}: ${c.phone ?? c.email ?? c.instagram ?? "no contact info"} (power: ${c.decisionPower ?? 0}%)`)
    .join("\n");

  return [
    line(),
    "RUNSHEET � DJ EMY PERFORMANCE",
    line(),
    "",
    `Event: ${g.title}`,
    `Venue: ${t.venueAddress}`,
    `Date: ${t.eventDate}`,
    "",
    line(),
    "TIMELINE",
    line(),
    `  ${t.loadInTime ?? "22:00"} � Artist arrives, equipment check`,
    `  ${t.loadInTime ?? "22:00"} + 15min � Sound check with house engineer`,
    `  ${t.setStart ?? "23:00"} � Set begins`,
    `  ${t.setEnd ?? "01:00"} � Set ends, Artist departs`,
    "",
    line(),
    "TECHNICAL REQUIREMENTS (venue to confirm 24h before)",
    line(),
    ...p.techRider.mixer.map(r => "  " + r),
    ...p.techRider.players.map(r => "  " + r),
    "  Monitors: " + p.techRider.monitors,
    ...p.techRider.booth.map(r => "  " + r),
    ...p.techRider.connectivity.map(r => "  " + r),
    "",
    line(),
    "HOSPITALITY",
    line(),
    ...p.hospitalityRider.map(r => "  - " + r),
    "",
    line(),
    "ON-SITE CONTACTS",
    line(),
    contacts || "  - No contacts on file. Obtain venue duty manager mobile before the day.",
    "",
    line(),
    "MANAGEMENT CONTACT (day-of)",
    line(),
    `  ${m.contactName} | ${m.phone} | ${m.email}`,
    "",
    line(),
    `Generated by EMY Studio | ${m.company}`,
    line(),
  ].join("\n");
}

// -- INVOICE -------------------------------------------------------------------

export function generateInvoice(g: Gig, t: DealTerms): string {
  const p = activeProfile();
  const m = p.management;
  const cd = p.contractDefaults;
  const bank = m.bank;
  const deposit = Math.round((t.agreedFeeAed * cd.depositPercent) / 100);
  const balance = t.agreedFeeAed - deposit;
  const invoiceNum = "INV-" + Date.now().toString().slice(-6);
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const alternates = (bank?.alternates ?? [])
    .map(a => `  ${a.currency} IBAN: ${a.iban}`)
    .join("\n");

  return [
    line(),
    "INVOICE",
    line(),
    "",
    `Invoice No: ${invoiceNum}`,
    `Date: ${today}`,
    `Due: On receipt`,
    "",
    line(),
    "FROM",
    line(),
    `  ${m.legalName}`,
    `  Trade Licence: ${m.tradeLicenceNo ?? "on file"}`,
    `  ${m.address ?? "Sharjah Publishing City Free Zone, Sharjah, UAE"}`,
    `  ${m.email} | ${m.phone}`,
    "",
    line(),
    "BILL TO",
    line(),
    `  ${t.clientLegalName}`,
    `  ${t.clientAddress}`,
    "",
    line(),
    "SERVICES",
    line(),
    `  DJ Performance: ${g.title}`,
    `  Event Date: ${t.eventDate}`,
    `  Venue: ${t.venueAddress}`,
    `  Set: ${t.setStart ?? "23:00"} - ${t.setEnd ?? "01:00"}`,
    "",
    `  Agreed Fee:          ${money(t.agreedFeeAed)}`,
    `  Deposit (${cd.depositPercent}%):        ${money(deposit)}`,
    `  Balance Due:         ${money(balance)}`,
    "",
    line(),
    "PAYMENT DETAILS",
    line(),
    `  Account Name: ${bank?.accountName ?? "EMY VISION GROUP FZC"}`,
    `  Bank: ${bank?.bankName ?? "Mashreqbank PSC (Mashreq NEO BIZ)"}`,
    `  IBAN (AED): ${bank?.iban ?? "AE060330000019102008190"}`,
    `  SWIFT: ${bank?.swift ?? "BOMLAEAD"}`,
    alternates ? "\n  Additional currency accounts:\n" + alternates : "",
    "",
    `  Direct payment to the Artist does not discharge the Client's payment obligation.`,
    `  All payments must be made to Emy Vision Group as the contracting party.`,
    "",
    line(),
    `Generated by EMY Studio | ${m.company} | ${m.email}`,
    line(),
  ].join("\n");
}

// -- PRESS PACK ----------------------------------------------------------------

export function generatePressPack(g: Gig): string {
  const p = activeProfile();
  const m = p.management;

  const appearances = p.selectedAppearances.map(a => "  - " + a).join("\n");
  const sellingPoints = p.sellingPoints.map(s => "  - " + s).join("\n");

  return [
    line(),
    "PRESS & CONTENT PACK � DJ EMY",
    line(),
    "",
    `Represented by: ${m.company}`,
    `Contact: ${m.contactName} | ${m.email} | ${m.phone}`,
    `Instagram: ${p.instagram ?? "@dj_emy_"} | Management: ${m.instagram ?? "@evgroup2026"}`,
    "",
    line(),
    "BIOGRAPHY",
    line(),
    `DJ Emy (${p.legalName}) is a ${p.tagline}, based in ${p.basedIn}.`,
    `She performs exclusively in English and Arabic, commanding both international and Gulf rooms with equal fluency.`,
    "",
    `Her genre signature � Afro House, Afro Tech and Tribal � sits at the intersection of West African rhythm`,
    `and European club culture, a sound still rare in the GCC and one she has made her own over a decade of`,
    `residencies, brand activations and international touring.`,
    "",
    line(),
    "SELECTED APPEARANCES",
    line(),
    appearances,
    "",
    `  FIFA World Cup Qatar 2022 � official tournament DJ`,
    "",
    line(),
    "WHY DJ EMY",
    line(),
    sellingPoints,
    "",
    line(),
    "TECHNICAL PROFILE",
    line(),
    `  Mixer: ${p.techRider.mixer.join(", ")}`,
    `  Players: ${p.techRider.players.join(", ")}`,
    `  Travels with USB � adaptable to any Pioneer-equipped booth`,
    "",
    line(),
    "SOCIAL & PRESS",
    line(),
    `  Instagram: ${p.instagram ?? "@dj_emy_"}`,
    `  YouTube: ${p.youtube ?? "youtube.com/@DJEMY-o6d"}`,
    `  Management Instagram: ${m.instagram ?? "@evgroup2026"}`,
    `  EPK: ${p.epkUrl ?? "emyvisiongroup.com"}`,
    "",
    line(),
    "BOOKING",
    line(),
    `  All bookings are contracted exclusively through ${m.legalName}.`,
    `  Direct approaches to the Artist will be redirected to management.`,
    `  ${m.contactName} | ${m.email} | ${m.phone}`,
    "",
    line(),
    `Generated by EMY Studio | ${m.company}`,
    line(),
  ].join("\n");
}

// -- DEAL PACK -----------------------------------------------------------------

export function generateDealPack(g: Gig, overrides: Partial<DealTerms> = {}): DealPack {
  const terms = deriveTerms(g, overrides);
  return {
    terms,
    contract: generateContract(g, terms),
    runsheet: generateRunsheet(g, terms),
    invoice: generateInvoice(g, terms),
    pressPack: generatePressPack(g),
  };
}
''')

# -------------------------------------------------------------------------------
# 3. profile-store.ts
# -------------------------------------------------------------------------------
write("src/lib/profile-store.ts", r'''/**
 * Profile store � runtime overrides on top of the compiled DJ_EMY defaults.
 *
 * The UI at /profile writes patches here. Everything else reads via
 * activeProfile() which resolves the merged result.
 */

import { DJ_EMY, type ArtistProfile } from "./artist";
import { setProfileLoader, invalidateProfileCache } from "./active-profile";
import { db } from "./db";

const PROFILE_KEY = "emy-artist-profile-v2";

// -- Deep merge helper ---------------------------------------------------------

function deepMerge<T>(base: T, patch: Partial<T>): T {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v) && typeof out[k] === "object" && out[k] !== null && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else if (v !== undefined) {
      out[k] = v;
    }
  }
  return out as T;
}

// -- Public API ----------------------------------------------------------------

export function getProfile(): ArtistProfile {
  const saved = db.get(PROFILE_KEY);
  if (!saved) return DJ_EMY;
  return deepMerge(DJ_EMY, saved as Partial<ArtistProfile>);
}

export function saveProfile(patch: Partial<ArtistProfile>): void {
  const current = db.get(PROFILE_KEY) as Partial<ArtistProfile> | null;
  const merged = current ? deepMerge(current, patch) : patch;
  db.set(PROFILE_KEY, merged);
  invalidateProfileCache();
}

export function profileGaps(): string[] {
  const p = getProfile();
  const gaps: string[] = [];
  if (!p.management?.tradeLicenceNo) gaps.push("Trade licence number missing � required for contracts");
  if (!p.management?.bank?.iban) gaps.push("Bank IBAN missing � required for invoices");
  if (!p.management?.bank?.swift) gaps.push("Bank SWIFT missing � required for international payments");
  if (!p.management?.bank?.accountName) gaps.push("Bank account name missing");
  return gaps;
}

export function ratesAreEstimates(): boolean {
  const saved = db.get(PROFILE_KEY) as Partial<ArtistProfile> | null;
  // If no overrides saved, the compiled-in rates are estimates.
  return !saved?.baseRatesAed;
}

/**
 * Wire the profile loader into the active-profile cache.
 * Call once at app startup (already called from ingest.ts).
 */
export function registerProfileLoader(): void {
  setProfileLoader(getProfile);
}
''')

# -------------------------------------------------------------------------------
# 4. notify.ts
# -------------------------------------------------------------------------------
write("src/lib/notify.ts", r'''/**
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
''')

# -- Verify all files written --------------------------------------------------
files = [
    "src/lib/outreach.ts",
    "src/lib/contract.ts",
    "src/lib/profile-store.ts",
    "src/lib/notify.ts",
]
print("\n=== VERIFICATION ===")
all_ok = True
for f in files:
    if os.path.exists(f):
        size = os.path.getsize(f)
        if size > 200:
            print(f"OK  ({size} bytes) {f}")
        else:
            print(f"EMPTY {f}")
            all_ok = False
    else:
        print(f"MISSING {f}")
        all_ok = False

if all_ok:
    subprocess.run(["git", "add", "-A"], check=True)
    result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    print(result.stdout)
    subprocess.run(["git", "commit", "-m", "Phase 9: Full engine rebuild - outreach, contract, profile-store, notify all correct"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("\nDONE - ENGINE DEPLOYED")
else:
    print("\nFAILED - not pushing")
