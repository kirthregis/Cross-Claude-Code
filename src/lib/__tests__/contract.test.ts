import { describe, it, expect } from "vitest";
import { generateDealPack, deriveTerms } from "../contract";
import { pitch, negotiationPlaybook, contactStrategy, pitchFee, quoteFor } from "../outreach";
import { normalise } from "../extract";
import { nanoid } from "nanoid";
import type { Gig } from "../types";

const gig = (body: string): Gig => ({
  ...normalise({
    sourceKind: "instagram", sourceName: "@promo", title: "DJ wanted",
    body, postedAt: new Date().toISOString(),
  }),
  id: nanoid(10), score: 80, stage: "new",
});

describe("deal pack", () => {
  const g = gig("House DJ at Cove Beach, Dubai Marina on 14th September, 2 hour peak set, AED 6,000, exclusive. Contact events@cove.ae");

  it("generates all four documents", () => {
    const p = generateDealPack(g);
    expect(p.contract).toContain("DJ PERFORMANCE AGREEMENT");
    expect(p.runsheet).toContain("RUNSHEET");
    expect(p.invoice).toContain("INVOICE");
    expect(p.pressPack).toContain("PRESS & CONTENT PACK");
  });

  it("splits deposit and balance correctly", () => {
    const p = generateDealPack(g, { agreedFeeAed: 6000 });
    expect(p.contract).toContain("AED 6,000");
    expect(p.contract).toContain("AED 3,000"); // 50% deposit
  });

  it("includes the exclusivity clause only when agreed", () => {
    const withEx = generateDealPack(g, { exclusivityKm: 5 });
    expect(withEx.contract).toMatch(/not to perform at any other public venue within 5km/);
    const noEx = generateDealPack(g, { exclusivityKm: 0 });
    expect(noEx.contract).toMatch(/No exclusivity or radius restriction applies/);
  });

  it("covers IP, press, force majeure and governing law", () => {
    const c = generateDealPack(g).contract;
    expect(c).toContain("INTELLECTUAL PROPERTY");
    expect(c).toContain("FORCE MAJEURE");
    expect(c).toContain("Dubai Courts");
    expect(c).toContain("Artist retains all rights");
  });

  it("puts the tech rider in the contract", () => {
    expect(generateDealPack(g).contract).toContain("CDJ-3000");
  });

  it("defaults the fee to the quoted target when nothing agreed", () => {
    const t = deriveTerms(gig("House DJ at a superclub next Friday"));
    expect(t.agreedFeeAed).toBeGreaterThan(0);
  });
});

describe("outreach", () => {
  const g = gig("House DJ at Cove Beach on 14th September, AED 6,000. WhatsApp +971 50 111 2222");

  it("writes a whatsapp pitch with the ask in it", () => {
    const p = pitch(g, "whatsapp");
    expect(p.body).toContain("AED");
    expect(p.body.length).toBeLessThan(700); // short enough for a DM
  });

  it("writes an email pitch with a subject", () => {
    const p = pitch(g, "email");
    expect(p.subject).toBeTruthy();
    expect(p.body).toContain("deposit");
  });

  it("gives negotiation counters", () => {
    const pb = negotiationPlaybook(g);
    expect(pb.length).toBeGreaterThan(4);
    expect(pb.some((c) => /exposure/i.test(c.objection))).toBe(true);
  });

  it("ranks the best contact first", () => {
    const s = contactStrategy(g);
    expect(s[0].channel).toBe("whatsapp");
  });

  it("tells her what to do when there is no contact", () => {
    const s = contactStrategy(gig("DJ needed at a club"));
    expect(s[0].why).toMatch(/entertainment manager/i);
  });
});

describe("regression: never underquote a stated budget", () => {
  it("pitches their number when it beats our ask", () => {
    const g = gig("Need house DJ at a superclub Monday in August, 2hr peak slot, AED 25,000. Call +971 50 777 1234");
    const q = quoteFor(g);
    expect(g.budgetStatedAed).toBe(25000);
    expect(q.askAed).toBeLessThan(25000);          // our model asks for less
    expect(pitchFee(g)).toBe(25000);               // but we pitch their number
    expect(pitch(g, "whatsapp").body).toContain("25,000");
  });

  it("pitches our ask when no budget is stated", () => {
    const g = gig("Need house DJ at a superclub next Friday, 2hr peak slot");
    expect(pitchFee(g)).toBe(quoteFor(g).askAed);
  });
});
