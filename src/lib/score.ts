/**
 * Fit scoring: is this gig worth pushing to her phone right now?
 *
 * Score 0-100. The alert tier decides HOW loud the notification is â€”
 * she should never be woken at 3am for a 1,500 AED weeknight bar slot.
 */

import { activeProfile } from "./active-profile";
import type { Gig } from "./types";
import { quote } from "./pricing";
import { daysUntil } from "./dates";

export type AlertTier = "urgent" | "high" | "normal" | "digest" | "suppress";

export interface Scored {
  score: number;
  tier: AlertTier;
  reasons: string[];
  /** Why she should move fast, in one line for the push notification. */
  headline: string;
}

export function scoreGig(g: Omit<Gig, "id" | "score" | "stage">): Scored {
  let score = 40;
  const reasons: string[] = [];

  // --- Genre fit
  const wants = g.genresWanted ?? [];
  const primary = wants.filter((x) => activeProfile().genres.includes(x));
  const secondary = wants.filter((x) => activeProfile().secondaryGenres.includes(x));
  const blocked = wants.filter((x) => activeProfile().wontPlay.includes(x));
  if (primary.length) { score += 20; reasons.push(`Core genre match: ${primary.join(", ")}`); }
  else if (secondary.length) { score += 8; reasons.push(`Secondary genre: ${secondary.join(", ")}`); }
  if (blocked.length && !primary.length) {
    score -= 35;
    reasons.push(`Wants ${blocked.join(", ")} â€” outside her sound`);
  }

  // --- Money
  const q = quote({
    venueTier: g.venueTier ?? "unknown",
    eventDate: g.eventDate,
    setLengthMins: g.setLengthMins ?? 120,
    slot: g.slot ?? "unknown",
    exclusivity: !!g.exclusivity,
    travelRequired: !!g.travelRequired,
    recurring: !!g.recurring,
    budgetStatedAed: g.budgetStatedAed,
  });
  if (g.budgetStatedAed) {
    if (g.budgetStatedAed >= q.askAed) { score += 22; reasons.push(`Stated budget AED ${g.budgetStatedAed.toLocaleString()} is at/above our ask`); }
    else if (g.budgetStatedAed >= q.targetAed) { score += 14; reasons.push(`Budget beats target (AED ${q.targetAed.toLocaleString()})`); }
    else if (g.budgetStatedAed < q.walkAwayAed) { score -= 30; reasons.push(`Budget below walk-away of AED ${q.walkAwayAed.toLocaleString()}`); }
  } else {
    reasons.push("No budget stated â€” fee to be established in first reply");
  }

  // --- Venue quality
  const tierBoost: Record<string, number> = {
    festival: 18, brand_activation: 16, superclub: 14, beach_club: 10,
    private_event: 8, hotel_lounge: 4, bar_restaurant: -4, unknown: 0,
  };
  score += tierBoost[g.venueTier] ?? 0;
  if (tierBoost[g.venueTier] >= 14) reasons.push(`High-value venue type: ${g.venueTier.replace(/_/g, " ")}`);

  // --- Career value
  if (g.recurring) { score += 12; reasons.push("Residency â€” recurring guaranteed income"); }
  if (g.travelRequired) { score -= 4; reasons.push("Requires travel outside Dubai"); }

  // --- Contactability: a gig she can't reach anyone about is worthless
  const bestContact = Math.max(0, ...g.contacts.map((c) => c.decisionPower));
  if (bestContact >= 70) { score += 10; reasons.push("Direct phone/WhatsApp for decision-maker"); }
  else if (bestContact === 0) { score -= 12; reasons.push("No contact details found â€” needs manual research"); }

  // --- Urgency
  let urgent = false;
  let daysOut = Infinity;
  if (g.eventDate) {
    daysOut = daysUntil(g.eventDate);
    if (daysOut < 0) { score -= 60; reasons.push("Event date has passed"); }
    else if (daysOut <= 3) { score += 12; urgent = true; reasons.push(`Event in ${Math.max(0, Math.round(daysOut))} day(s) â€” first to reply usually wins`); }
    else if (daysOut <= 10) { score += 6; }
  }
  // Fresh posts are winnable; a 2-day-old promoter post is probably filled.
  const ageHrs = (Date.now() - new Date(g.postedAt).getTime()) / 3_600_000;
  if (ageHrs <= 1) score += 8;
  else if (ageHrs > 48) { score -= 10; reasons.push("Posted over 48h ago â€” likely already filled"); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: AlertTier;
  if (score >= 75 && (urgent || g.venueTier === "brand_activation" || g.venueTier === "festival")) tier = "urgent";
  else if (score >= 70) tier = "high";
  else if (score >= 50) tier = "normal";
  else if (score >= 32) tier = "digest";
  else tier = "suppress";

  const money = g.budgetStatedAed
    ? `AED ${g.budgetStatedAed.toLocaleString()}`
    : `ask AED ${q.askAed.toLocaleString()}`;
  const when = g.eventDate
    ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : "date TBC";
  const headline = `${g.venueName ?? g.sourceName} Â· ${when} Â· ${money}${urgent ? " Â· MOVE NOW" : ""}`;

  return { score, tier, reasons, headline };
}
