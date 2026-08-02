import { describe, it, expect } from "vitest";
import { normalise, detectTravel, detectArea } from "../extract";
import { pitch, quoteFor } from "../outreach";
import { generateDealPack } from "../contract";
import { scoreGig } from "../score";
import { DJ_EMY } from "../artist";
import { nanoid } from "nanoid";
import type { Gig } from "../types";

const gig = (body: string): Gig => ({
  ...normalise({ sourceKind: "instagram", sourceName: "@promo", title: "DJ wanted", body, postedAt: new Date().toISOString() }),
  id: nanoid(10), score: 80, stage: "new",
});

describe("GCC home markets — Doha is not a travel gig", () => {
  it("does not flag Doha as travel", () => {
    expect(detectTravel("DJ needed in Doha, The Pearl, Friday night")).toBe(false);
  });
  it("does not flag Abu Dhabi as travel", () => {
    expect(detectTravel("Yas Island Abu Dhabi beach club")).toBe(false);
  });
  it("does flag genuinely foreign gigs", () => {
    expect(detectTravel("DJ needed in Riyadh, flights covered")).toBe(true);
    expect(detectTravel("London club, international booking")).toBe(true);
  });
  it("recognises Qatari areas", () => {
    expect(detectArea("event at The Pearl")).toBe("The Pearl");
    expect(detectArea("West Bay rooftop")).toBe("West Bay");
  });
  it("does not add a travel premium to a Doha booking", () => {
    const doha = gig("Afro House DJ for club in Doha, 2hr peak slot");
    const riyadh = gig("Afro House DJ for club in Riyadh, 2hr peak slot");
    expect(doha.travelRequired).toBe(false);
    expect(riyadh.travelRequired).toBe(true);
    expect(quoteFor(riyadh).targetAed).toBeGreaterThan(quoteFor(doha).targetAed);
  });
});

describe("Afro House is her core genre", () => {
  it("scores an Afro House brief highly", () => {
    const s = scoreGig(gig("Afro House DJ needed for peak time club slot, AED 9000, call +971 50 111 2222"));
    expect(s.score).toBeGreaterThan(70);
  });
  it("recognises Afro Tech", () => {
    expect(gig("Afro Tech DJ wanted").genresWanted).toContain("Afro Tech");
  });
});

describe("bookings route through Emy Vision Group", () => {
  const g = gig("Afro House DJ at a beach club on 14th September, 2hr peak set, AED 9,000. Contact events@venue.ae");

  it("pitches from EVG, not first-person from the artist", () => {
    const w = pitch(g, "whatsapp").body;
    expect(w).toContain("Emy Vision Group");
    expect(w).toContain("Kirth");
    expect(w).toContain(DJ_EMY.management.phone);
    // must NOT be written as the artist herself
    expect(w).not.toMatch(/^Hi there! DJ Emy here/);
  });

  it("email pitch carries proof points and the EVG signature", () => {
    const e = pitch(g, "email");
    expect(e.subject).toContain("DJ Emy");
    expect(e.body).toContain("Emy Vision Group");
    expect(e.body).toContain("admin@emyvisiongroup.com");
    expect(e.body).toMatch(/FIFA|female Afro House|100% live/i);
  });

  it("leads with FIFA credentials for brand and festival work", () => {
    const brand = gig("DJ for corporate product launch, brand activation, AED 20,000");
    expect(pitch(brand, "whatsapp").body).toMatch(/FIFA/);
  });

  it("leads with bilingual positioning for Arabic rooms", () => {
    const arabic = gig("DJ for Eid celebration, Arabic and international crowd, AED 8000");
    expect(pitch(arabic, "whatsapp").body).toMatch(/Arabic/);
  });

  it("names EVG as the contracting party and payee", () => {
    const c = generateDealPack(g).contract;
    expect(c).toContain("THE COMPANY");
    expect(c).toContain("Emy Vision Group");
    expect(c).toMatch(/payable to Emy Vision Group, not to the Artist directly/);
    expect(c).toContain("NON-CIRCUMVENTION");
  });

  it("has EVG sign the contract on the artist's behalf", () => {
    const c = generateDealPack(g).contract;
    expect(c).toMatch(/FOR THE COMPANY — Emy Vision Group/);
    expect(c).toContain("Business Development");
  });

  it("invoices from EVG with a direct-payment warning", () => {
    const inv = generateDealPack(g).invoice;
    expect(inv).toContain("Emy Vision Group");
    expect(inv).toMatch(/Direct payment to the Artist does not discharge/);
  });

  it("press pack carries the real bio, appearances and both handles", () => {
    const p = generateDealPack(g).pressPack;
    expect(p).toMatch(/FIFA World Cup Qatar 2022/);
    expect(p).toContain("@dj_emy_");
    expect(p).toContain("@evgroup2026");
    expect(p).toMatch(/English\s+and Arabic/);
  });
});

describe("tech rider matches the EPK", () => {
  it("specifies her actual setup", () => {
    const c = generateDealPack(gig("DJ at a club")).contract;
    expect(c).toContain("DJM-900NXS2");
    expect(c).toContain("CDJ-3000");
    expect(c).toMatch(/travels with USB/);
  });
});

describe("regression: exclusivity must actually be detected", () => {
  it("catches the word forms clients really use", () => {
    for (const t of [
      "Exclusive to our event that week.",
      "We need exclusivity for 7 days",
      "radius clause applies",
      "no other bookings that weekend",
    ]) {
      expect(gig(`DJ at a club. ${t}`).exclusivity).toBe(true);
    }
  });
  it("does not false-positive on ordinary copy", () => {
    expect(gig("DJ needed at a club, great crowd").exclusivity).toBe(false);
  });
  it("charges the premium once detected", () => {
    const ex = gig("Afro House DJ, superclub, 2hr peak set. Exclusive to our event that week.");
    const no = gig("Afro House DJ, superclub, 2hr peak set.");
    expect(ex.exclusivity).toBe(true);
    expect(quoteFor(ex).targetAed).toBeGreaterThan(quoteFor(no).targetAed);
  });
});
