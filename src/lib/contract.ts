import { activeProfile } from "./active-profile";
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
