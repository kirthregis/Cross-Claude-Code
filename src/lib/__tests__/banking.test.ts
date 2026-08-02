import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { normalise } from "../extract";
import { nanoid } from "nanoid";
import type { Gig } from "../types";

const gig = (): Gig => ({
  ...normalise({ sourceKind: "manual", sourceName: "m", title: "t",
    body: "Afro House DJ at a beach club, 2hr peak set, AED 9000", postedAt: new Date().toISOString() }),
  id: nanoid(10), score: 80, stage: "new",
});

describe("EVG entity + settlement details", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-")), "t.db");
  });

  it("prints the real EVG settlement details on the invoice", async () => {
    const { generateDealPack } = await import("../contract");
    const inv = generateDealPack(gig()).invoice;
    expect(inv).toContain("EMY VISION GROUP FZC");
    expect(inv).toContain("AE060330000019102008190");   // AED IBAN
    expect(inv).toContain("BOMLAEAD");
    expect(inv).toMatch(/Mashreq/i);
    expect(inv).not.toMatch(/_{6,}/);                   // no blanks left
  });

  it("offers the other currency accounts", async () => {
    const { generateDealPack } = await import("../contract");
    const inv = generateDealPack(gig()).invoice;
    expect(inv).toContain("AE760330000019102008191");   // GBP
    expect(inv).toContain("AE490330000019102008192");   // USD
    expect(inv).toContain("AE220330000019102008193");   // EUR
  });

  it("NEVER prints the Mashreq CIF — it is also the statement password", async () => {
    const { generateDealPack } = await import("../contract");
    const p = generateDealPack(gig());
    for (const doc of [p.contract, p.invoice, p.runsheet, p.pressPack]) {
      expect(doc).not.toContain("016087359");
    }
  });

  it("reports no outstanding gaps — EVG details are all on file", async () => {
    const { profileGaps } = await import("../profile-store");
    expect(profileGaps()).toEqual([]);
  });

  it("lets saved overrides replace the built-in bank details", async () => {
    const { saveProfile, profileGaps } = await import("../profile-store");
    const { registerProfileLoader } = await import("../profile-store");
    registerProfileLoader();

    saveProfile({
      management: {
        tradeLicenceNo: "CN-1234567",
        bank: { accountName: "Emy Vision Group", bankName: "Mashreq Bank", iban: "AE000000000000000000000", swift: "BOMLAEAD" },
      } as never,
    });

    const { generateDealPack } = await import("../contract");
    const pack = generateDealPack(gig());
    expect(pack.invoice).toContain("Mashreq Bank");
    expect(pack.invoice).toContain("AE000000000000000000000");
    expect(pack.invoice).toContain("BOMLAEAD");
    expect(pack.contract).toContain("CN-1234567");

    const g = profileGaps().join(" ");
    expect(g).not.toMatch(/trade licence/i);
    expect(g).not.toMatch(/bank details/i);
  });

  it("still warns that direct payment to the artist is invalid", async () => {
    const { generateDealPack } = await import("../contract");
    expect(generateDealPack(gig()).invoice)
      .toMatch(/Direct payment to the Artist does not discharge/);
  });
});

describe("artist legal identity", () => {
  it("names Imen Mannai as the performer in the contract", async () => {
    const { generateDealPack } = await import("../contract");
    const c = generateDealPack(gig()).contract;
    expect(c).toContain('Imen Mannai professionally known as "DJ Emy"');
    expect(c).not.toMatch(/PLACEHOLDER.*legal name/i);
  });

  it("no longer reports the ARTIST's legal name as a gap", async () => {
    const { profileGaps } = await import("../profile-store");
    const gaps = profileGaps().join(" ");
    expect(gaps).not.toMatch(/artist's full legal name/i);
    expect(gaps).not.toMatch(/named as performer/i);
  });
});
