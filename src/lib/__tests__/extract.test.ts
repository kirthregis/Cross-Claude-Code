import { describe, it, expect } from "vitest";
import {
  detectBudgetAed, detectSetLength, detectSlot, detectVenueTier,
  detectArea, detectContacts, detectEventDate, detectVenueName, fingerprint, normalise,
} from "../extract";

describe("budget extraction", () => {
  it("reads AED amounts", () => {
    expect(detectBudgetAed("Budget is AED 4,500 for the night")).toBe(4500);
  });
  it("handles k shorthand", () => {
    expect(detectBudgetAed("paying 3k AED")).toBe(3000);
  });
  it("takes the top of a range", () => {
    expect(detectBudgetAed("AED 2000 - AED 3500 depending on set")).toBe(3500);
  });
  it("ignores non-money numbers", () => {
    expect(detectBudgetAed("2 hour set, 150 capacity")).toBeUndefined();
  });
  it("handles dhs", () => {
    expect(detectBudgetAed("fee 5000 dhs")).toBe(5000);
  });
});

describe("set length", () => {
  it("parses hours", () => expect(detectSetLength("2 hour set")).toBe(120));
  it("takes top of hour range", () => expect(detectSetLength("2-3hrs")).toBe(180));
  it("parses minutes", () => expect(detectSetLength("90 mins")).toBe(90));
});

describe("slot + tier + area", () => {
  it("finds warmup", () => expect(detectSlot("looking for a warm up DJ")).toBe("warmup"));
  it("finds allnight", () => expect(detectSlot("open to close set")).toBe("allnight"));
  it("detects beach club before hotel", () => expect(detectVenueTier("beach club pool party at the resort")).toBe("beach_club"));
  it("detects brand activation", () => expect(detectVenueTier("corporate product launch")).toBe("brand_activation"));
  it("finds Dubai areas", () => expect(detectArea("venue in Dubai Marina")).toBe("Dubai Marina"));
});

describe("contacts", () => {
  it("extracts email, phone and handle with decision power", () => {
    const c = detectContacts("Contact events@venue.ae or WhatsApp +971 50 123 4567, DM @dubaipromoter");
    expect(c.find((x) => x.email)?.email).toBe("events@venue.ae");
    const phone = c.find((x) => x.phone);
    expect(phone?.phone).toBe("+971501234567");
    expect(phone!.decisionPower).toBeGreaterThan(70);
    expect(c.find((x) => x.instagram)?.instagram).toBe("@dubaipromoter");
  });
  it("rates generic inboxes lower", () => {
    const [c] = detectContacts("info@venue.ae");
    expect(c.decisionPower).toBeLessThan(40);
  });
});

describe("event dates", () => {
  const posted = "2026-08-02T10:00:00Z";
  it("reads ISO", () => expect(detectEventDate("event on 2026-09-12", posted)).toBe("2026-09-12"));
  it("reads day-month", () => expect(detectEventDate("gig on 14th September", posted)).toBe("2026-09-14"));
  it("rolls past dates to next year", () => expect(detectEventDate("party on 3rd January", posted)).toBe("2027-01-03"));
  it("resolves tonight", () => expect(detectEventDate("need a DJ tonight!", posted)).toBe("2026-08-02"));
  it("resolves next friday", () => {
    const d = detectEventDate("this friday", posted)!;
    expect(new Date(d).getUTCDay()).toBe(5);
  });
});

describe("dedupe fingerprint", () => {
  it("collapses the same gig posted twice", () => {
    const a = { venueName: "Soho Garden", eventDate: "2026-09-12", title: "DJ needed", body: "Looking for house DJ Friday peak slot budget flexible" };
    const b = { venueName: "Soho Garden", eventDate: "2026-09-12", title: "DJ needed!!", body: "flexible budget, Friday peak slot, looking for house DJ" };
    expect(fingerprint(a)).toBe(fingerprint(b));
  });
  it("keeps different gigs apart", () => {
    const a = { venueName: "Soho Garden", eventDate: "2026-09-12", title: "DJ needed", body: "house peak slot" };
    const b = { venueName: "White Dubai", eventDate: "2026-10-01", title: "DJ needed", body: "techno warmup slot" };
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });
});

describe("full normalise", () => {
  it("turns a promoter caption into structured data", () => {
    const g = normalise({
      sourceKind: "instagram",
      sourceName: "@dubaipromo",
      title: "DJ WANTED",
      body: "Need an Afro House DJ this Saturday at Cove Beach, Dubai Marina. 2 hour peak slot, AED 4,500. WhatsApp +971 50 999 8888",
      postedAt: "2026-08-02T10:00:00Z",
    });
    expect(g.venueTier).toBe("beach_club");
    expect(g.area).toBe("Dubai Marina");
    expect(g.budgetStatedAed).toBe(4500);
    expect(g.setLengthMins).toBe(120);
    expect(g.slot).toBe("peak");
    expect(g.genresWanted).toContain("Afro House");
    expect(g.contacts.some((c) => c.whatsapp)).toBe(true);
  });
});

describe("extraction robustness fixes", () => {
  it("detects short minute sets (45 min, 10 min)", () => {
    expect(detectSetLength("45 min opener")).toBe(45);
    expect(detectSetLength("10 minute set")).toBe(undefined); // too short to be a DJ set
  });
  it("parses dashed/spaced UAE phone variants to E.164", () => {
    const c = detectContacts("WhatsApp 050 123 4567 or +971-50-987-6543");
    const nums = c.map((x) => x.phone).filter(Boolean);
    expect(nums).toContain("+971501234567");
    expect(nums).toContain("+971509876543");
  });
  it("captures @handle venue with no space", () => {
    expect(detectVenueName("playing @CoveBeach this Friday")).toBe("CoveBeach");
  });
  it("detects added Dubai areas", () => {
    expect(detectArea("event at Motor City")).toBe("Motor City");
    expect(detectArea("festival in Dubai Silicon Oasis")).toBe("Dubai Silicon Oasis");
  });
});
