/**
 * The pricing brain.
 *
 * Produces an opening ask, a realistic target, and a hard walk-away number
 * from a transparent stack of multipliers. Every adjustment is returned in
 * `breakdown` so Emy can see WHY, and argue the number in a negotiation.
 */

import { DJ_EMY } from "./artist";
import type { PriceInputs, PriceQuote } from "./types";
import { daysUntil } from "./dates";

const AED = (n: number) => Math.round(n / 50) * 50; // round to nearest 50 AED

/** Dubai season demand curve. High season = Oct–Apr, dead = Jun–Aug. */
export function seasonMultiplier(date: Date): { mult: number; label: string } {
  const m = date.getUTCMonth(); // 0=Jan
  if (m === 11 || m === 0) return { mult: 1.35, label: "Peak season (Dec–Jan, NYE window)" };
  if (m >= 1 && m <= 3) return { mult: 1.2, label: "High season (Feb–Apr)" };
  if (m === 9 || m === 10) return { mult: 1.15, label: "Season opening (Oct–Nov)" };
  if (m === 4) return { mult: 1.0, label: "Shoulder season (May)" };
  return { mult: 0.8, label: "Low season (Jun–Sep, Dubai summer)" };
}

/** Night-of-week demand. Dubai's big nights are Fri & Sat, plus ladies' nights. */
export function nightMultiplier(date: Date): { mult: number; label: string } {
  const d = date.getUTCDay(); // 0=Sun
  switch (d) {
    case 5:
      return { mult: 1.25, label: "Friday (peak night)" };
    case 6:
      return { mult: 1.25, label: "Saturday (peak night)" };
    case 4:
      return { mult: 1.1, label: "Thursday (weekend opener)" };
    case 2:
      return { mult: 1.05, label: "Tuesday (ladies' night)" };
    case 0:
      return { mult: 0.95, label: "Sunday (brunch/day party)" };
    default:
      return { mult: 0.85, label: "Weeknight (low demand)" };
  }
}

/** Is this date inside Ramadan? Approximate windows — refine yearly. */
const RAMADAN_WINDOWS: [string, string][] = [
  ["2026-02-17", "2026-03-19"],
  ["2027-02-07", "2027-03-08"],
];

export function isRamadan(date: Date): boolean {
  const iso = date.toISOString().slice(0, 10);
  return RAMADAN_WINDOWS.some(([a, b]) => iso >= a && iso <= b);
}

export function quote(input: PriceInputs): PriceQuote {
  const base = DJ_EMY.baseRatesAed[input.venueTier] ?? DJ_EMY.baseRatesAed.unknown;
  const breakdown: PriceQuote["breakdown"] = [
    { label: `Base rate — ${input.venueTier.replace(/_/g, " ")}`, effect: "base", value: base },
  ];
  const rationale: string[] = [];
  let mult = 1;

  // --- Set length: base covers 2h, prorate beyond with a discount for long sets.
  const hours = input.setLengthMins / 60;
  if (hours > 2) {
    const extra = hours - 2;
    const lenMult = 1 + extra * 0.35; // each extra hour adds 35% not 50%
    mult *= lenMult;
    breakdown.push({
      label: `Set length ${hours.toFixed(1)}h (+${extra.toFixed(1)}h over standard 2h)`,
      effect: `×${lenMult.toFixed(2)}`,
      value: lenMult,
    });
  } else if (hours < 1.5) {
    mult *= 0.85;
    breakdown.push({ label: `Short set (${hours.toFixed(1)}h)`, effect: "×0.85", value: 0.85 });
    rationale.push("Short set — but don't discount much: setup/travel cost is the same.");
  }

  // --- Slot
  const slotMult = { warmup: 0.7, peak: 1.0, closing: 0.9, allnight: 1.3, unknown: 0.95 }[input.slot];
  mult *= slotMult;
  breakdown.push({ label: `Slot: ${input.slot}`, effect: `×${slotMult}`, value: slotMult });
  if (input.slot === "warmup") {
    rationale.push("Warm-up slot pays less, but is the standard way into a superclub. Consider taking it as a door-opener if the venue is a tier above her usual.");
  }

  // --- Date-driven factors
  if (input.eventDate) {
    const d = new Date(input.eventDate);
    if (!Number.isNaN(d.getTime())) {
      const s = seasonMultiplier(d);
      const n = nightMultiplier(d);
      mult *= s.mult * n.mult;
      breakdown.push({ label: s.label, effect: `×${s.mult}`, value: s.mult });
      breakdown.push({ label: n.label, effect: `×${n.mult}`, value: n.mult });

      // Short-notice premium — they need someone NOW, leverage is hers.
      const daysOut = daysUntil(input.eventDate);
      if (daysOut >= 0 && daysOut <= 3) {
        mult *= 1.25;
        breakdown.push({ label: `Short notice (${Math.round(daysOut)}d out)`, effect: "×1.25", value: 1.25 });
        rationale.push("They're filling a hole in the lineup. This is maximum leverage — quote high and hold.");
      } else if (daysOut > 90) {
        mult *= 0.95;
        breakdown.push({ label: "Booked far ahead", effect: "×0.95", value: 0.95 });
      }

      if (input.ramadan ?? isRamadan(d)) {
        mult *= 0.55;
        breakdown.push({ label: "Ramadan (music restrictions)", effect: "×0.55", value: 0.55 });
        rationale.push("Ramadan: amplified music is heavily restricted. Verify the event is even permitted before committing.");
      }
    }
  }

  // --- Commercial terms
  if (input.exclusivity) {
    mult *= 1.3;
    breakdown.push({ label: "Exclusivity / radius clause", effect: "×1.30", value: 1.3 });
    rationale.push("A radius clause blocks other bookings that week — it must be paid for, never granted free.");
  }
  if (input.travelRequired) {
    mult *= 1.2;
    breakdown.push({ label: "Travel outside Dubai", effect: "×1.20", value: 1.2 });
    rationale.push("Quote travel, accommodation and transfers as a separate line item on top of the fee.");
  }
  if (input.recurring) {
    mult *= 0.85;
    breakdown.push({ label: "Residency / recurring booking", effect: "×0.85", value: 0.85 });
    rationale.push("Residency discount is worth it — guaranteed monthly income and it locks out competitors.");
  }

  const target = AED(base * mult);
  const ask = AED(target * 1.25);
  let walkAway = AED(Math.max(target * 0.72, DJ_EMY.hardFloorAed));

  // --- React to a stated budget
  let confidence: PriceQuote["confidence"] = input.eventDate ? "medium" : "low";
  if (input.budgetStatedAed) {
    confidence = "high";
    if (input.budgetStatedAed >= ask) {
      rationale.push(`They stated AED ${input.budgetStatedAed.toLocaleString()} — that is at or above the ask. Accept the stated budget, do not undercut it.`);
    } else if (input.budgetStatedAed >= target) {
      rationale.push(`Stated budget AED ${input.budgetStatedAed.toLocaleString()} beats the target. Ask once for AED ${ask.toLocaleString()} citing the date/slot, then settle at their number.`);
    } else if (input.budgetStatedAed >= walkAway) {
      rationale.push(`Stated budget AED ${input.budgetStatedAed.toLocaleString()} is below target but workable. Counter at AED ${target.toLocaleString()}, or trade: accept their number in exchange for a shorter set, no exclusivity, or a residency commitment.`);
    } else {
      rationale.push(`Stated budget AED ${input.budgetStatedAed.toLocaleString()} is below the walk-away of AED ${walkAway.toLocaleString()}. Decline politely and leave the door open — or counter with a reduced offering (1h opener) at AED ${walkAway.toLocaleString()}.`);
    }
  }

  if (walkAway < DJ_EMY.hardFloorAed) walkAway = DJ_EMY.hardFloorAed;

  rationale.push(`Open at AED ${ask.toLocaleString()}, expect to land near AED ${target.toLocaleString()}, never sign below AED ${walkAway.toLocaleString()}.`);

  return { currency: "AED", askAed: ask, targetAed: target, walkAwayAed: walkAway, breakdown, rationale, confidence };
}
