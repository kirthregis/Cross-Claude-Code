import { describe, it, expect, beforeEach } from "vitest";
import { setSettingsLoader, activeSettings, tierForScore, DEFAULT_SETTINGS } from "../engine-settings";

beforeEach(() => {
  setSettingsLoader(null as never);
});

describe("engine-settings", () => {
  it("returns defaults when no loader is registered", () => {
    expect(activeSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("tierForScore respects default thresholds", () => {
    expect(tierForScore(80)).toBe("urgent");
    expect(tierForScore(72)).toBe("high");
    expect(tierForScore(60)).toBe("normal");
    expect(tierForScore(40)).toBe("digest");
    expect(tierForScore(10)).toBe("suppress");
  });

  it("tierForScore honours a custom threshold from a registered loader", () => {
    setSettingsLoader(() => ({
      ...DEFAULT_SETTINGS,
      alerts: { ...DEFAULT_SETTINGS.alerts, urgentFrom: 90, normalFrom: 60 },
    }));
    expect(tierForScore(85)).toBe("high");
    expect(tierForScore(92)).toBe("urgent");
    expect(tierForScore(65)).toBe("normal");
  });
});
