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

  it("shows fillable blanks on the invoice when bank details are missing", async () => {
    const { generateDealPack } = await import("../contract");
    const inv = generateDealPack(gig()).invoice;
    // Must be usable as a printed template, not reference an app screen.
    expect(inv).toMatch(/fill in from the EVG bank statement/i);
    expect(inv).toMatch(/\| IBAN \| _+ \|/);
    expect(inv).not.toMatch(/\/profile/);
  });

  it("flags licence number and bank as gaps", async () => {
    const { profileGaps } = await import("../profile-store");
    const g = profileGaps().join(" ");
    expect(g).toMatch(/trade licence/i);
    expect(g).toMatch(/bank details/i);
  });

  it("renders saved bank details on the invoice and clears the gaps", async () => {
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
