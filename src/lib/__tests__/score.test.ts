import { describe, it, expect } from "vitest";
import { scoreGig } from "../score";
import { normalise } from "../extract";
import type { RawLead } from "../types";

const lead = (body: string, over: Partial<RawLead> = {}): RawLead => ({
  sourceKind: "instagram",
  sourceName: "@promo",
  title: "DJ wanted",
  body,
  postedAt: new Date().toISOString(),
  ...over,
});

describe("scoring", () => {
  it("rates a great fit highly", () => {
    const s = scoreGig(normalise(lead(
      "Afro House DJ needed for brand launch at Palm Jumeirah, 2 hour peak set, AED 12,000. WhatsApp +971 50 111 2222"
    )));
    expect(s.score).toBeGreaterThan(70);
    expect(["urgent", "high"]).toContain(s.tier);
  });

  it("suppresses a bad, cheap, off-genre gig", () => {
    const s = scoreGig(normalise(lead(
      "Drum & Bass DJ for a bar, Monday, AED 400, 1 hour warm up slot",
      { postedAt: new Date(Date.now() - 5 * 86400000).toISOString() }
    )));
    expect(s.tier).toBe("suppress");
  });

  it("boosts residencies", () => {
    const withRes = scoreGig(normalise(lead("House DJ weekly residency at hotel rooftop lounge, AED 4000")));
    const without = scoreGig(normalise(lead("House DJ one night at hotel rooftop lounge, AED 4000")));
    expect(withRes.score).toBeGreaterThan(without.score);
  });

  it("penalises missing contacts", () => {
    const withC = scoreGig(normalise(lead("House DJ for beach club, AED 5000, call +971 50 111 2222")));
    const withoutC = scoreGig(normalise(lead("House DJ for beach club, AED 5000")));
    expect(withC.score).toBeGreaterThan(withoutC.score);
  });

  it("produces a usable notification headline", () => {
    const s = scoreGig(normalise(lead("House DJ at Cove Beach on 14th September, AED 5000")));
    expect(s.headline).toContain("AED 5,000");
    expect(s.reasons.length).toBeGreaterThan(0);
  });

  it("kills gigs whose date has passed", () => {
    const s = scoreGig(normalise(lead("House DJ needed 2020-01-01 at superclub AED 8000")));
    expect(s.tier).toBe("suppress");
  });
});

describe("regression: urgency", () => {
  it("does not treat a gig happening tonight as expired", () => {
    const today = new Date().toISOString().slice(0, 10);
    const s = scoreGig(normalise(lead(
      `Need house DJ TONIGHT at a superclub, 2hr peak slot, AED 8000. Call +971 50 777 1234`,
    )));
    expect(s.reasons.join(" ")).not.toMatch(/date has passed/i);
    expect(s.tier).toBe("urgent");
    expect(s.headline).toContain("MOVE NOW");
    expect(today).toBeTruthy();
  });
});
