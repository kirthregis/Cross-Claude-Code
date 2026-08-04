import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Regression guard for the merge bug where falsy saved values (false, 0, "")
 * were silently discarded by a `(over || base)` fallback. Everything here
 * exercises the DB-backed settings store against a throwaway SQLite file.
 */
describe("settings store", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-settings-")), "t.db");
  });

  it("persists falsy values (the false/0/'' merge bug)", async () => {
    const { saveSettings, getSettings } = await import("../settings-store");
    saveSettings({
      hunting: { webScanOn: false, queries: ["x"] },
      alerts: { quietStartHour: 0, quietEndHour: 8 },
      branding: { pitchSignoff: "" },
    } as never);
    const s = getSettings();
    expect(s.hunting.webScanOn).toBe(false);
    expect(s.alerts.quietStartHour).toBe(0);
    expect(s.branding.pitchSignoff).toBe("");
    // untouched defaults survive the deep merge
    expect(s.hunting.blocklist).toEqual([]);
    expect(s.alerts.digestFrom).toBe(32);
  });

  it("a partial patch does not wipe other nested fields", async () => {
    const { saveSettings, getSettings } = await import("../settings-store");
    saveSettings({ branding: { accentColor: "#123456" } } as never);
    const s = getSettings();
    expect(s.branding.accentColor).toBe("#123456");
    expect(s.alerts.urgentFrom).toBe(75);
    expect(s.hunting.webScanOn).toBe(true);
  });

  it("clamps hours and score thresholds to sane ranges", async () => {
    const { saveSettings, getSettings } = await import("../settings-store");
    saveSettings({ alerts: { quietStartHour: -5, urgentFrom: 500 } } as never);
    const s = getSettings();
    expect(s.alerts.quietStartHour).toBe(0);
    expect(s.alerts.urgentFrom).toBe(100);
  });
});
