/**
 * The closer: pitch messages tuned to channel and contact role, plus
 * negotiation counters for the objections that actually come up in Dubai.
 */

import { activeProfile } from "./active-profile";
import type { Gig, Contact } from "./types";
import { quote } from "./pricing";

export type Channel = "whatsapp" | "instagram_dm" | "email";

export function quoteFor(g: Gig) {
  return quote({
    venueTier: g.venueTier,
    eventDate: g.eventDate,
    setLengthMins: g.setLengthMins ?? 120,
    slot: g.slot ?? "unknown",
    exclusivity: !!g.exclusivity,
    travelRequired: !!g.travelRequired,
    recurring: !!g.recurring,
    budgetStatedAed: g.budgetStatedAed,
  });
}

/**
 * The number to actually say out loud.
 *
 * NEVER quote below a budget they have already stated — that hands money back.
 * If their stated budget beats our ask, quote their number and take it.
 */
export function pitchFee(g: Gig): number {
  const q = quoteFor(g);
  return Math.max(q.askAed, g.budgetStatedAed ?? 0);
}

const dateLabel = (g: Gig) =>
  g.eventDate
    ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "the date you have in mind";

/**
 * Pitches are written from Emy Vision Group, not from the artist.
 *
 * She is represented end-to-end by EVG — a venue books one accountable,
 * contracted point of contact. Pitching first-person from the artist
 * undercuts that positioning and invites direct-to-artist fee haggling.
 */
export function pitch(g: Gig, channel: Channel, contact?: Contact): { subject?: string; body: string } {
  const p = activeProfile();
  const m = p.management;
  const who = contact?.name ? contact.name.split(" ")[0] : "there";
  const venue = g.venueName ?? "your venue";
  const when = dateLabel(g);
  const fee = pitchFee(g).toLocaleString();
  const set = g.setLengthMins ? `${(g.setLengthMins / 60).toFixed(1)}-hour` : "2-hour";
  const isArabicRoom = /\b(arabic|khaleeji|emirati|eid|ramadan|national day)\b/i.test(`${g.title} ${g.body}`);

  // Lead with the single most relevant proof point for this room.
  const hook =
    g.venueTier === "brand_activation" || g.venueTier === "festival"
      ? "She was an official tournament DJ for the FIFA World Cup Qatar 2022 and FIFA Arab Cup 2025."
      : isArabicRoom
        ? "She moves fluently between English and Arabic floors — and is one of the GCC's few female Afro House DJs holding a peak-time room."
        : g.venueTier === "hotel_lounge" || g.slot === "warmup"
          ? "She's known for golden-hour rooftop sessions — deep, tribal grooves that open a room and lift it."
          : "She's one of the GCC's few female Afro House DJs commanding a peak-time floor — 100% live, reads the room.";

  if (channel === "whatsapp" || channel === "instagram_dm") {
    return {
      body: [
        `Hi ${who} — ${m.contactName} here from ${m.company}, representing ${p.name}.`,
        ``,
        `Saw you're booking for ${when}${g.venueName ? ` at ${venue}` : ""}. ${p.name} is available and it's exactly her sound (${p.genres.slice(0, 3).join(", ")}).`,
        ``,
        hook,
        ``,
        `Fee for a ${set} set is AED ${fee}, all-in. She travels with USB and works with your house Pioneer setup.`,
        ``,
        `Live sets: ${p.youtube ?? p.epkUrl}`,
        `EPK: ${p.epkUrl}`,
        ``,
        `We can hold the date for you today — shall I send the booking confirmation over?`,
        ``,
        `${m.contactName} · ${m.company}`,
        `${m.phone}`,
      ].join("\n"),
    };
  }

  return {
    subject: `${p.name} — availability for ${when}${g.venueName ? ` at ${venue}` : ""}`,
    body: [
      `Dear ${contact?.name ?? "Booking Team"},`,
      ``,
      `I'm ${m.contactName}, ${m.contactRole} at ${m.company}. We represent and manage ${p.name}, a GCC-based ${p.genres.slice(0, 3).join(", ")} DJ.`,
      ``,
      `I understand you're programming for ${when}${g.venueName ? ` at ${venue}` : ""}. ${p.name} is available and the brief is a direct match.`,
      ``,
      `Why she fits this room:`,
      ...p.sellingPoints.slice(0, 3).map((x) => `  • ${x}`),
      ``,
      `Selected appearances:`,
      ...p.selectedAppearances.slice(0, 4).map((x) => `  • ${x}`),
      ``,
      `Proposed terms:`,
      `  • Performance: ${set} ${g.slot && g.slot !== "unknown" ? `${g.slot} ` : ""}set`,
      `  • Fee: AED ${fee} (inclusive of preparation and standard equipment use)`,
      `  • Payment: ${p.contractDefaults.depositPercent}% deposit to confirm the date, balance on the night`,
      `  • Technical: 2x CDJ-3000 (or 2000NXS2) + DJM-900NXS2; she travels with USB and adapts to venue equipment`,
      `  • Contracting: a single accountable point of contact through ${m.company}`,
      ``,
      `Live sets: ${p.youtube ?? ""}`,
      `EPK and full-length mixes: ${p.epkUrl} (reels and long-form on request)`,
      ``,
      `We can hold the date for 48 hours pending confirmation. Happy to jump on a call if easier.`,
      ``,
      `Kind regards,`,
      `${m.contactName}`,
      `${m.contactRole}, ${m.company}`,
      `${m.phone} · ${m.email}`,
      `${m.website ?? ""}`,
    ].filter((l) => l !== undefined).join("\n"),
  };
}

export interface Counter { objection: string; response: string; }

export function negotiationPlaybook(g: Gig): Counter[] {
  const q = quoteFor(g);
  const target = q.targetAed.toLocaleString();
  const floor = q.walkAwayAed.toLocaleString();

  return [
    {
      objection: "That's above our budget",
      response: `"I understand. What's the number you're working with?" — make THEM say it first. If it lands above AED ${floor}, trade rather than discount: shorten the set, drop exclusivity, or ask for a 3-date residency at AED ${target} each.`,
    },
    {
      objection: "We pay AED X, that's the standard rate here",
      response: `"That works for a standard night — this is a ${g.eventDate ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "long" }) : "peak"} ${g.slot === "peak" ? "peak slot" : "slot"}. I can do AED ${target} and I'll confirm right now." Anchoring on the specific night beats arguing about averages.`,
    },
    {
      objection: "We can get a DJ for AED 2,000–3,000 / that's the going rate",
      response: `True for the open-format pool — Dubai marketplaces average about AED 2,400 across hundreds of part-time DJs. That is not the comparable set. "${activeProfile().name} was an official tournament DJ for the FIFA World Cup Qatar 2022 and the FIFA Arab Cup 2025, she's one of the few female Afro House DJs holding a peak-time floor in the GCC, and she's contracted through ${activeProfile().management.company}. The premium tier in Dubai runs AED 6,000–15,000 — we're at AED ${target}." Never argue against the average; reframe the category.`,
    },
    {
      objection: "Can you do it for exposure / it's great for your profile",
      response: `"I'd love to work with you — my rate for this type of event is AED ${target}. If budget is genuinely fixed this round, let's do a paid trial at AED ${floor} and agree a rate for the following bookings in writing." Never work free; always convert exposure into a written future rate.`,
    },
    {
      objection: "We need you exclusive that week",
      response: `Exclusivity is a product, not a courtesy. "A ${activeProfile().contractDefaults.defaultExclusivityKm}km / 7-day radius clause is +30% — that's AED ${Math.round(q.targetAed * 1.3).toLocaleString()}. Without the clause it stays at AED ${target}." Let them choose.`,
    },
    {
      objection: "We'll confirm closer to the date",
      response: `"I can pencil you in, but I release held dates to confirmed bookings. A ${activeProfile().contractDefaults.depositPercent}% deposit locks it." A deposit is the only real confirmation — verbal holds cost her paid work.`,
    },
    {
      objection: "Payment 30/60 days after the event",
      response: `"Standard terms are deposit on signature, balance on the night." If they insist on net terms, require 100% deposit or add a 15% late-terms premium. Chasing money is unpaid labour.`,
    },
    {
      objection: "Can you also host / MC / bring dancers / extend an hour?",
      response: `Every add-on is a line item. Extra hour = +35% of base. Never absorb scope silently — reprice and re-send in writing.`,
    },
  ];
}

/** Who to contact first, and how. */
export function contactStrategy(g: Gig): { contact?: Contact; channel: Channel; why: string }[] {
  const sorted = [...g.contacts].sort((a, b) => b.decisionPower - a.decisionPower);
  if (!sorted.length) {
    return [{
      channel: "instagram_dm",
      why: "No contact was extracted. Search the venue on Instagram, DM the main account, and ask for the entertainment manager by name. Then find them on LinkedIn.",
    }];
  }
  return sorted.slice(0, 3).map((c) => {
    const channel: Channel = c.whatsapp || c.phone ? "whatsapp" : c.email ? "email" : "instagram_dm";
    const why =
      c.decisionPower >= 70
        ? "Direct line to a decision-maker — call or WhatsApp within minutes, voice beats text for urgent slots."
        : c.decisionPower >= 55
          ? "Named booking contact — email with the EPK, then follow up on WhatsApp after 4 hours."
          : "Gatekeeper account — ask for the name of the entertainment/booking manager rather than pitching here.";
    return { contact: c, channel, why };
  });
}
