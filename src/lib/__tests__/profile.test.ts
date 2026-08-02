import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * These exercise the DB-backed override layer, so VITEST short-circuiting in
 * active-profile.ts must be bypassed. We import the store directly.
 */
describe("profile overrides", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-")), "t.db");
  });

  it("falls back to compiled defaults when nothing saved", async () => {
    const { getProfile } = await import("../profile-store");
    const { DJ_EMY } = await import("../artist");
    expect(getProfile().name).toBe(DJ_EMY.name);
  });

  it("deep-merges a partial patch without wiping other fields", async () => {
    const { saveProfile, getProfile } = await import("../profile-store");
    saveProfile({ baseRatesAed: { superclub: 12345 } as never });
    const p = getProfile();
    expect(p.baseRatesAed.superclub).toBe(12345);
    expect(p.baseRatesAed.beach_club).toBeGreaterThan(0); // untouched
    expect(p.techRider.mixer.length).toBeGreaterThan(0);  // untouched
  });

  it("reports the gaps that block production use", async () => {
    const { profileGaps } = await import("../profile-store");
    const gaps = profileGaps();
    expect(gaps.join(" ")).toMatch(/legal name/i);
  });

  it("clears a gap once real data is entered", async () => {
    const { saveProfile, profileGaps } = await import("../profile-store");
    const before = profileGaps().length;
    saveProfile({ legalName: "Emy Real Surname", phone: "+971501234567", email: "emy@real.ae", epkUrl: "https://x.com" });
    expect(profileGaps().length).toBeLessThan(before);
  });
});
