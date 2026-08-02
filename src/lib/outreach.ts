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

export function pitch(g: Gig, channel: Channel, contact?: Contact): { subject?: string; body: string } {
  const who = contact?.name ? contact.name.split(" ")[0] : "there";
  const venue = g.venueName ?? "your venue";
  const when = dateLabel(g);
  const fee = pitchFee(g).toLocaleString();
  const set = g.setLengthMins ? `${(g.setLengthMins / 60).toFixed(1)}-hour` : "2-hour";

  if (channel === "whatsapp" || channel === "instagram_dm") {
    return {
      body: [
        `Hi ${who}! ${activeProfile().name} here — Dubai-based ${activeProfile().genres.slice(0, 2).join(" / ")} DJ.`,
        ``,
        `Saw you're looking for a DJ for ${when}${g.venueName ? ` at ${venue}` : ""}. I'm available and it's exactly my sound.`,
        ``,
        `My fee for a ${set} set is AED ${fee}, all-in. I bring my own USBs and can work with your existing backline.`,
        ``,
        `EPK + mixes: ${activeProfile().epkUrl ?? activeProfile().instagram}`,
        ``,
        `Happy to hold the date for you today — shall I send the booking confirmation over?`,
      ].join("\n"),
    };
  }

  return {
    subject: `DJ availability — ${when}${g.venueName ? ` at ${venue}` : ""}`,
    body: [
      `Dear ${contact?.name ?? "Booking Team"},`,
      ``,
      `I'm ${activeProfile().name}, a Dubai-based DJ specialising in ${activeProfile().genres.join(", ")}.`,
      ``,
      `I understand you're programming for ${when}${g.venueName ? ` at ${venue}` : ""} and I'd like to put myself forward. I'm available on the date and the brief is a direct match for my sound.`,
      ``,
      `Proposed terms:`,
      `  • Performance: ${set} ${g.slot && g.slot !== "unknown" ? `${g.slot} ` : ""}set`,
      `  • Fee: AED ${fee} (inclusive of preparation and standard equipment use)`,
      `  • Payment: ${activeProfile().contractDefaults.depositPercent}% deposit to confirm the date, balance on the night`,
      `  • Technical: I can work with in-house backline; full rider attached`,
      ``,
      `EPK, mixes and previous bookings: ${activeProfile().epkUrl ?? activeProfile().instagram}`,
      ``,
      `I can hold the date for 48 hours pending your confirmation. Happy to jump on a quick call if easier.`,
      ``,
      `Kind regards,`,
      `${activeProfile().name}`,
      `${activeProfile().phone} · ${activeProfile().email}`,
    ].join("\n"),
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
