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

  it("starts blank when nothing is saved — a new user never sees DJ Emy's real details by accident", async () => {
    const { getProfile } = await import("../profile-store");
    const p = getProfile();
    expect(p.name).toBe("");
    expect(p.email).toBe("");
    expect(p.phone).toBe("");
    expect(p.sellingPoints).toEqual([]);
  });

  it("loadEmySampleProfile() explicitly restores DJ Emy's real data, for Kirth's own device", async () => {
    const { getProfile, loadEmySampleProfile } = await import("../profile-store");
    const { DJ_EMY } = await import("../artist");
    loadEmySampleProfile();
    expect(getProfile().name).toBe(DJ_EMY.name);
    expect(getProfile().email).toBe(DJ_EMY.email);
  });

  it("deep-merges a partial patch on top of a saved profile without wiping other fields", async () => {
    const { saveProfile, getProfile, loadEmySampleProfile } = await import("../profile-store");
    loadEmySampleProfile();
    saveProfile({ baseRatesAed: { superclub: 12345 } as never });
    const p = getProfile();
    expect(p.baseRatesAed.superclub).toBe(12345);
    expect(p.baseRatesAed.beach_club).toBeGreaterThan(0); // untouched, kept from the seeded profile
    expect(p.techRider.mixer.length).toBeGreaterThan(0);  // untouched
  });

  it("a partial patch on a blank profile leaves everything else blank, not backfilled from DJ Emy", async () => {
    const { saveProfile, getProfile } = await import("../profile-store");
    saveProfile({ name: "Some Other DJ" });
    const p = getProfile();
    expect(p.name).toBe("Some Other DJ");
    expect(p.email).toBe(""); // not DJ Emy's real email
    expect(p.sellingPoints).toEqual([]); // not DJ Emy's real selling points
  });

  it("reports every required field as a gap on a blank profile", async () => {
    const { profileGaps } = await import("../profile-store");
    const gaps = profileGaps().join(" ");
    expect(gaps).toMatch(/name/i);
    expect(gaps).toMatch(/email/i);
    expect(gaps).toMatch(/phone/i);
  });

  it("reports no gaps once a complete profile (EVG licence and bank details) is on file", async () => {
    const { profileGaps, loadEmySampleProfile } = await import("../profile-store");
    loadEmySampleProfile();
    expect(profileGaps()).toEqual([]);
  });

  it("re-reports a gap if a required field is blanked out", async () => {
    const { saveProfile, profileGaps, loadEmySampleProfile } = await import("../profile-store");
    loadEmySampleProfile();
    expect(profileGaps()).toEqual([]);
    saveProfile({ management: { tradeLicenceNo: "" } as never });
    expect(profileGaps().join(" ")).toMatch(/trade licence/i);
  });
});
