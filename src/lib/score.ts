import { activeProfile } from "./active-profile";
import type { Gig } from "./types";
import { quote } from "./pricing";
import { daysUntil } from "./dates";

export type AlertTier = "urgent" | "high" | "normal" | "digest" | "suppress";

export interface Scored {
  score: number;
  tier: AlertTier;
  reasons: string[];
  headline: string;
}

export function scoreGig(g: Omit<Gig, "id" | "score" | "stage">): Scored {
  let score = 40;
  const reasons: string[] = [];
  const tier_safe = g.venueTier ?? "unknown";

  const wants = g.genresWanted ?? [];
  const primary = wants.filter((x) => activeProfile().genres.includes(x));
  const secondary = wants.filter((x) => activeProfile().secondaryGenres.includes(x));
  const blocked = wants.filter((x) => activeProfile().wontPlay.includes(x));
  if (primary.length) { score += 20; reasons.push("Core genre match: " + primary.join(", ")); }
  else if (secondary.length) { score += 8; reasons.push("Secondary genre: " + secondary.join(", ")); }
  if (blocked.length && !primary.length) { score -= 35; reasons.push("Outside her sound"); }

  const q = quote({
    venueTier: tier_safe,
    eventDate: g.eventDate,
    setLengthMins: g.setLengthMins ?? 120,
    slot: g.slot ?? "unknown",
    exclusivity: !!g.exclusivity,
    travelRequired: !!g.travelRequired,
    recurring: !!g.recurring,
    budgetStatedAed: g.budgetStatedAed,
  });

  if (g.budgetStatedAed) {
    if (g.budgetStatedAed >= q.askAed) { score += 22; reasons.push("Budget at/above ask"); }
    else if (g.budgetStatedAed >= q.targetAed) { score += 14; reasons.push("Budget beats target"); }
    else if (g.budgetStatedAed < q.walkAwayAed) { score -= 30; reasons.push("Budget below walk-away"); }
  }

  const tierBoost: Record<string, number> = {
    festival: 18, brand_activation: 16, superclub: 14, beach_club: 10,
    private_event: 8, hotel_lounge: 4, bar_restaurant: -4, unknown: 0,
    hotel: 4, private: 8, other: 0, bar_restaurant_dup: -4,
  };
  score += tierBoost[tier_safe] ?? 0;
  if ((tierBoost[tier_safe] ?? 0) >= 14) reasons.push("High-value venue: " + tier_safe.replace(/_/g, " "));

  if (g.recurring) { score += 12; reasons.push("Residency - recurring income"); }
  if (g.travelRequired) { score -= 4; reasons.push("Travel required"); }

  const contacts = g.contacts ?? [];
  const bestContact = contacts.length ? Math.max(0, ...contacts.map((c) => c.decisionPower ?? 0)) : 0;
  if (bestContact >= 70) { score += 10; reasons.push("Direct decision-maker contact"); }
  else if (bestContact === 0) { score -= 12; reasons.push("No contact details found"); }

  let urgent = false;
  let daysOut = Infinity;
  if (g.eventDate) {
    daysOut = daysUntil(g.eventDate);
    if (daysOut < 0) { score -= 60; reasons.push("Event date passed"); }
    else if (daysOut <= 3) { score += 12; urgent = true; reasons.push("Event in " + Math.round(daysOut) + " days - move fast"); }
    else if (daysOut <= 10) { score += 6; }
  }

  const ageHrs = (Date.now() - new Date(g.postedAt).getTime()) / 3_600_000;
  if (ageHrs <= 1) score += 8;
  else if (ageHrs > 48) { score -= 10; reasons.push("Posted over 48h ago"); }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: AlertTier;
  if (score >= 75 && (urgent || tier_safe === "brand_activation" || tier_safe === "festival")) tier = "urgent";
  else if (score >= 70) tier = "high";
  else if (score >= 50) tier = "normal";
  else if (score >= 32) tier = "digest";
  else tier = "suppress";

  const money = g.budgetStatedAed ? "AED " + g.budgetStatedAed.toLocaleString() : "AED " + q.askAed.toLocaleString();
  const when = g.eventDate ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "TBC";
  const headline = (g.venueName ?? g.sourceName) + " - " + when + " - " + money + (urgent ? " - MOVE NOW" : "");

  return { score, tier, reasons, headline };
}