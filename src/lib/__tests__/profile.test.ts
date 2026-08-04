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
    expect((await getProfile()).name).toBe(DJ_EMY.name);
  });

  it("deep-merges a partial patch without wiping other fields", async () => {
    const { saveProfile, getProfile } = await import("../profile-store");
    await saveProfile({ baseRatesAed: { superclub: 12345 } as never });
    const p = await getProfile();
    expect(p.baseRatesAed.superclub).toBe(12345);
    expect(p.baseRatesAed.beach_club).toBeGreaterThan(0); // untouched
    expect(p.techRider.mixer.length).toBeGreaterThan(0);  // untouched
  });

  it("reports no gaps now that the EVG licence and bank details are on file", async () => {
    const { profileGaps } = await import("../profile-store");
    expect(profileGaps()).toEqual([]);
  });

  it("re-reports a gap if a required field is blanked out", async () => {
    const { saveProfile, profileGaps } = await import("../profile-store");
    expect(profileGaps()).toEqual([]);
    await saveProfile({ management: { tradeLicenceNo: "" } as never });
    expect(profileGaps().join(" ")).toMatch(/trade licence/i);
  });
});
