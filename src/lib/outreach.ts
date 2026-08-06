import { activeProfile } from "./active-profile";
import { quote } from "./pricing";
import type { Gig } from "./types";
import { whatsappDeepLink } from "./channels";

export function quoteFor(gig: Gig) {
  const price = quote({
    venueTier: gig.venueTier ?? "unknown",
    setLengthMins: gig.setLengthMins ?? 120,
    slot: gig.slot ?? "unknown",
    eventDate: gig.eventDate,
    exclusivity: gig.exclusivity,
    travelRequired: gig.travelRequired,
    recurring: gig.recurring,
    budgetStatedAed: gig.budgetStatedAed,
  });

  return {
    askAed: price.askAed,
    targetAed: price.targetAed,
    walkAwayAed: price.walkAwayAed,
    fee: price.askAed,
    target: price.targetAed,
    walkAway: price.walkAwayAed,
    currency: "AED",
    note: `Suggested fee for ${gig.title}`,
    breakdown: price.breakdown,
    rationale: price.rationale,
    confidence: price.confidence,
  };
}

export function pitchFee(gig: Gig): number {
  const q = quoteFor(gig);
  if (gig.budgetStatedAed && gig.budgetStatedAed > q.askAed) {
    return gig.budgetStatedAed;
  }
  return q.askAed;
}

export function pitch(
  gig: Gig,
  channel: "whatsapp" | "email" = "whatsapp",
): { subject?: string; body: string } {
  const profile = activeProfile();
  const fee = pitchFee(gig);
  const text = (gig.title + " " + gig.body).toLowerCase();

  const isBrand =
    gig.venueTier === "brand_activation" ||
    gig.venueTier === "festival" ||
    /corporate|product launch|brand|festival/i.test(text);

  const isArabic = /eid|arabic/i.test(text);

  if (channel === "whatsapp") {
    let hook = "She's one of the GCC's few female Afro House DJs commanding a peak-time floor — 100% live, reads the room.";
    if (isBrand) {
      hook = "She was an official tournament DJ for the FIFA World Cup Qatar 2022 and FIFA Arab Cup 2025.";
    } else if (isArabic) {
      hook = "Reads the room in real time, moving fluently between English and Arabic crowds with high-energy Afro House and melodic sets.";
    }

    const dateStr = gig.eventDate || "your upcoming date";
    const body = `Hi there — Kirth here from Emy Vision Group, representing DJ Emy.

Saw you're booking for ${dateStr}. DJ Emy is available and it's exactly her sound.

${hook}

Fee for a 2-hour peak set is AED ${fee.toLocaleString()}, all-in. She travels with USB and works with your house Pioneer setup.

EPK: ${profile.epkUrl || "https://emyvisiongroup.com"}
Live sets: ${profile.youtube || "https://youtube.com/@DJEMY-o6d"}

Shall I send over the booking confirmation?

Kirth · Emy Vision Group
${profile.management.phone}`;

    return { body };
  }

  // Email Pitch
  const subject = `DJ Emy — availability for ${gig.eventDate || gig.title}`;
  const body = `Dear Booking Team,

I'm Kirth, Business Development at Emy Vision Group. We represent and manage DJ Emy, a GCC-based Afro House, Afro Tech, Tribal DJ.

I understand you're programming for ${gig.eventDate || gig.title}. DJ Emy is available and the brief is a direct match.

Why she fits this room:
  • One of few female Afro House DJs commanding a peak-time floor in the GCC
  • 100% live — no pre-recorded loops, no autopilot
  • Reads the room in real time, moving fluently between English and Arabic crowds

Selected appearances:
  • FIFA World Cup Qatar 2022 — official tournament DJ
  • FIFA Arab Cup Qatar 2025 — tournament DJ
  • Zeus, Jumeirah Beach — Eid headline sets, peak-time club
  • Amwaj Rooftop — signature golden-hour sunset sessions

Proposed terms:
  • Performance: 2.0-hour peak set
  • Fee: AED ${fee.toLocaleString()} (inclusive of preparation and standard equipment use)
  • Payment: 50% deposit to confirm the date, balance on the night
  • Technical: 2x CDJ-3000 (or 2000NXS2) + DJM-900NXS2; she travels with USB and adapts to venue equipment
  • Contracting: a single accountable point of contact through Emy Vision Group

Live sets: ${profile.youtube || "https://youtube.com/@DJEMY-o6d"}
EPK and full-length mixes: ${profile.epkUrl || "https://emyvisiongroup.com"}

We can hold the date for 48 hours pending confirmation. Happy to jump on a call if easier.

Kind regards,
Kirth
Business Development, Emy Vision Group
${profile.management.phone} · ${profile.management.email}
${profile.management.website || "https://emyvisiongroup.com"}`;

  return { subject, body };
}

export function generatePitch(gig: Gig): string {
  return pitch(gig, "email").body;
}

export function generateWhatsAppLink(gig: Gig): string {
  const profile = activeProfile();
  const p = pitch(gig, "whatsapp");
  return whatsappDeepLink(profile.management.phone, p.body);
}

export interface ContactStrategyItem {
  channel: "whatsapp" | "email" | "instagram" | "phone" | "web";
  label: string;
  url: string;
  why: string;
}

export function contactStrategy(gig: Gig): ContactStrategyItem[] & {
  primary: string;
  whatsappLink: string;
  emailSubject: string;
  emailBody: string;
} {
  const pWhatsapp = pitch(gig, "whatsapp");
  const pEmail = pitch(gig, "email");

  const phoneContact = gig.contacts?.find((c) => c.phone || c.whatsapp);
  const rawPhone = phoneContact?.whatsapp || phoneContact?.phone;
  const phoneMatch = !rawPhone ? gig.body.match(/(?:\+971|00971|05)\s*\d[\d\s-]{6,12}/) : null;
  const phone = rawPhone || (phoneMatch ? phoneMatch[0] : null);

  const emailContact = gig.contacts?.find((c) => c.email);
  const emailMatch = !emailContact ? gig.body.match(/[\w.-]+@[\w.-]+\.[a-z]{2,}/i) : null;
  const email = emailContact?.email || (emailMatch ? emailMatch[0] : null);

  const items: ContactStrategyItem[] = [];

  if (phone) {
    items.push({
      channel: "whatsapp",
      label: `WhatsApp ${phone}`,
      url: whatsappDeepLink(phone, pWhatsapp.body),
      why: "Fastest response rate. Decision makers in UAE nightlife communicate primarily via WhatsApp.",
    });
  }

  if (email) {
    items.push({
      channel: "email",
      label: `Email ${email}`,
      url: `mailto:${email}?subject=${encodeURIComponent(pEmail.subject || "")}&body=${encodeURIComponent(pEmail.body)}`,
      why: "Best for formal corporate bookings and festival management teams.",
    });
  }

  if (items.length === 0) {
    items.push({
      channel: "web",
      label: "Reach Entertainment Manager",
      url: gig.sourceUrl || "https://instagram.com",
      why: "No direct contact found. Search Instagram or LinkedIn for the venue's Entertainment Manager or General Manager to pitch directly.",
    });
  }

  const result = Object.assign(items, {
    primary: items[0]?.channel || "whatsapp",
    whatsappLink: generateWhatsAppLink(gig),
    emailSubject: pEmail.subject || `Booking Enquiry — ${gig.title}`,
    emailBody: pEmail.body,
  });

  return result;
}

export interface ObjectionCounter {
  objection: string;
  response: string;
  tactic: string;
}

export function negotiationPlaybook(gig: Gig): ObjectionCounter[] & {
  openingOffer: number;
  minimumAcceptable: number;
  idealFee: number;
  tips: string[];
} {
  const q = quoteFor(gig);
  const fee = pitchFee(gig);

  const counters: ObjectionCounter[] = [
    {
      objection: "That's above our budget",
      tactic: "Make them say their number first, then trade rather than discount.",
      response:
        "I understand. What is the specific budget number you have allocated for this slot? If needed, we can adjust set duration or exclusivity rather than compromising on quality.",
    },
    {
      objection: "We can get a DJ for AED 2,000–3,000 / that's the going rate",
      tactic: "Reframe the category — FIFA credential and EVG representation.",
      response:
        "DJ Emy was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025. She is one of the few female Afro House DJs holding a peak-time floor in the GCC, contracted through Emy Vision Group. The premium tier in Dubai runs AED 6,000–15,000 — we're at AED 8,000. Reframe the category: she delivers an international festival-level headline performance, not background playlisting.",
    },
    {
      objection: "Can you do it for exposure / it's great for your profile",
      tactic: "Never work free — convert exposure into a contracted trial or paid rate.",
      response:
        "We'd love to work with you. DJ Emy's rate for this type of event is AED 8,000. If budget is genuinely fixed for this edition, let's do a paid trial at AED 5,750 and agree the ongoing rate for following bookings in writing.",
    },
    {
      objection: "We pay AED X, that's the standard rate here",
      tactic: "Anchor on the specific peak night / slot.",
      response:
        "That works for a standard off-peak night, but this is a peak weekend slot. We can confirm right now at our agreed tier.",
    },
    {
      objection: "We need you exclusive that week / radius clause",
      tactic: "Exclusivity is a paid product (+30%).",
      response:
        "A 5km / 7-day radius clause is +30% because it blocks competing bookings. We can include full exclusivity at that rate, or keep standard terms without the restriction.",
    },
    {
      objection: "We'll confirm closer to the date",
      tactic: "A deposit is the only confirmation.",
      response:
        "We can hold the date for 48 hours, but we release unconfirmed dates to other inquiries. A 50% deposit locks the date in the calendar.",
    },
  ];

  return Object.assign(counters, {
    openingOffer: fee,
    minimumAcceptable: q.walkAwayAed,
    idealFee: q.targetAed,
    tips: [
      "Always make them say their budget number first.",
      "A 50% deposit is the only binding confirmation.",
      "Every add-on is a line item (extra hour, exclusivity, travel, custom content).",
      "Confirm sound system and Pioneer CDJ/DJM backline in writing 24h prior.",
    ],
  });
}
