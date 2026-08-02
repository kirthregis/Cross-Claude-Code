import { describe, it, expect } from "vitest";
import { quote, seasonMultiplier, nightMultiplier, isRamadan } from "../pricing";
import { DJ_EMY } from "../artist";
import type { PriceInputs } from "../types";

const base: PriceInputs = {
  venueTier: "superclub",
  setLengthMins: 120,
  slot: "peak",
  exclusivity: false,
  travelRequired: false,
  recurring: false,
};

describe("multipliers", () => {
  it("prices December above August", () => {
    expect(seasonMultiplier(new Date("2026-12-20")).mult)
      .toBeGreaterThan(seasonMultiplier(new Date("2026-08-20")).mult);
  });
  it("prices Saturday above Monday", () => {
    expect(nightMultiplier(new Date("2026-09-12")).mult) // Sat
      .toBeGreaterThan(nightMultiplier(new Date("2026-09-14")).mult); // Mon
  });
  it("detects Ramadan", () => {
    expect(isRamadan(new Date("2026-03-01"))).toBe(true);
    expect(isRamadan(new Date("2026-08-01"))).toBe(false);
  });
});

describe("quote", () => {
  it("orders ask > target > walkaway", () => {
    const q = quote(base);
    expect(q.askAed).toBeGreaterThan(q.targetAed);
    expect(q.targetAed).toBeGreaterThan(q.walkAwayAed);
  });

  it("never quotes below the hard floor", () => {
    const q = quote({ ...base, venueTier: "bar_restaurant", setLengthMins: 60, slot: "warmup", eventDate: "2026-07-06" });
    expect(q.walkAwayAed).toBeGreaterThanOrEqual(DJ_EMY.hardFloorAed);
  });

  it("charges more for exclusivity", () => {
    expect(quote({ ...base, exclusivity: true }).targetAed).toBeGreaterThan(quote(base).targetAed);
  });

  it("charges more for longer sets", () => {
    expect(quote({ ...base, setLengthMins: 240 }).targetAed).toBeGreaterThan(quote(base).targetAed);
  });

  it("pays warmup less than peak", () => {
    expect(quote({ ...base, slot: "warmup" }).targetAed).toBeLessThan(quote({ ...base, slot: "peak" }).targetAed);
  });

  it("discounts a residency", () => {
    expect(quote({ ...base, recurring: true }).targetAed).toBeLessThan(quote(base).targetAed);
  });

  it("applies a short-notice premium", () => {
    const soon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    const far = new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10);
    // Compare like-for-like by neutralising day-of-week via the breakdown.
    const qSoon = quote({ ...base, eventDate: soon });
    expect(qSoon.breakdown.some((b) => b.label.includes("Short notice"))).toBe(true);
    expect(quote({ ...base, eventDate: far }).breakdown.some((b) => b.label.includes("Short notice"))).toBe(false);
  });

  it("advises accepting a generous stated budget", () => {
    const q = quote({ ...base, budgetStatedAed: 999999 });
    expect(q.rationale.join(" ")).toMatch(/at or above the ask/i);
    expect(q.confidence).toBe("high");
  });

  it("advises declining a lowball", () => {
    const q = quote({ ...base, budgetStatedAed: 300 });
    expect(q.rationale.join(" ")).toMatch(/below the walk-away/i);
  });

  it("crushes the price during Ramadan", () => {
    const r = quote({ ...base, eventDate: "2026-03-01" });
    const n = quote({ ...base, eventDate: "2026-04-01" });
    expect(r.targetAed).toBeLessThan(n.targetAed);
  });

  it("explains itself", () => {
    const q = quote({ ...base, eventDate: "2026-12-19", exclusivity: true });
    expect(q.breakdown.length).toBeGreaterThan(3);
    expect(q.rationale.length).toBeGreaterThan(0);
  });
});

describe("regression: tonight's gig is the most urgent, not expired", () => {
  it("applies short-notice premium to a gig happening today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const q = quote({ ...base, eventDate: today });
    expect(q.breakdown.some((b) => b.label.includes("Short notice"))).toBe(true);
  });
});
