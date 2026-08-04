import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { webSearchSource } from "../sources/web-search";
import { setSettingsLoader, DEFAULT_SETTINGS } from "../engine-settings";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv, WEB_SEARCH_ON: "true" };
  setSettingsLoader(null as never);
});
afterEach(() => {
  process.env = originalEnv;
  setSettingsLoader(null as never);
});

describe("web-search source + settings", () => {
  it("is on when the user hasn't disabled it", () => {
    expect(webSearchSource.configured()).toBe(true);
  });

  it("turns off when the user disables web scan in settings", () => {
    setSettingsLoader(() => ({ ...DEFAULT_SETTINGS, hunting: { ...DEFAULT_SETTINGS.hunting, webScanOn: false } }));
    expect(webSearchSource.configured()).toBe(false);
  });

  it("swallows network failures and returns an array", async () => {
    process.env.WEB_SEARCH_QUERIES = "";
    process.env.WEB_SEARCH_EXTRA_FEEDS = "";
    setSettingsLoader(() => ({ ...DEFAULT_SETTINGS, hunting: { ...DEFAULT_SETTINGS.hunting, queries: ["this query host is unreachable xyz"], extraFeeds: ["https://127.0.0.1:1/no.xml"] } }));
    const leads = await webSearchSource.fetch();
    expect(Array.isArray(leads)).toBe(true);
  });
});
