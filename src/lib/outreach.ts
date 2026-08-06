import { activeProfile } from "./active-profile";
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
