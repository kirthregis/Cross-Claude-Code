import { describe, it, expect, beforeEach } from "vitest";
import { getGigs, saveGigs, closeDb } from "../db";
import type { Gig } from "../types";

function makeGig(overrides: Partial<Gig>): Gig {
  return {
    id: "id",
    sourceKind: "gig_board",
    sourceName: "Test Source",
    title: "Test Gig",
    body: "body",
    postedAt: new Date().toISOString(),
    score: 50,
    stage: "new",
    ...overrides,
  };
}

describe("getGigs — stale fake gig cleanup", () => {
  beforeEach(() => closeDb());

  it("removes gigs from the invented MENA DJ Network fixture that predate the demo gate", () => {
    saveGigs([
      makeGig({ id: "1", sourceName: "MENA DJ Network", title: "Friday Night — SKYBAR Dubai" }),
      makeGig({ id: "2", sourceName: "Time Out Dubai Events", title: "Real listing" }),
    ]);
    const gigs = getGigs();
    expect(gigs.map((g) => g.id)).toEqual(["2"]);
  });

  it("keeps MENA DJ Network gigs that are prefixed [DEMO] — those are the gated, intentional walkthrough data", () => {
    saveGigs([makeGig({ id: "1", sourceName: "MENA DJ Network", title: "[DEMO] Friday Night — SKYBAR Dubai" })]);
    expect(getGigs().map((g) => g.id)).toEqual(["1"]);
  });

  it("is a no-op once the store is already clean", () => {
    saveGigs([makeGig({ id: "1", sourceName: "Time Out Dubai Events" })]);
    expect(getGigs()).toHaveLength(1);
    expect(getGigs()).toHaveLength(1);
  });
});
