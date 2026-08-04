import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { webSearchSource, DEFAULT_WEB_QUERIES } from "../sources/web-search";
import { ALL_SOURCES, sourceStatus } from "../sources";

const originalEnv = process.env;

beforeEach(() => {
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("webSearchSource", () => {
  it("is registered in ALL_SOURCES", () => {
    expect(ALL_SOURCES.map((s) => s.id)).toContain("web");
  });

  it("is configured (live) by default — no credentials needed", () => {
    delete process.env.WEB_SEARCH_ON;
    expect(webSearchSource.configured()).toBe(true);
  });

  it("can be switched off", () => {
    process.env.WEB_SEARCH_ON = "false";
    expect(webSearchSource.configured()).toBe(false);
  });

  it("reports in sourceStatus as live without credentials", () => {
    delete process.env.WEB_SEARCH_ON;
    const web = sourceStatus().find((s) => s.id === "web");
    expect(web?.configured).toBe(true);
  });

  it("has sensible UAE defaults baked in", () => {
    expect(DEFAULT_WEB_QUERIES.length).toBeGreaterThan(5);
    expect(DEFAULT_WEB_QUERIES.join(" ").toLowerCase()).toContain("dubai");
  });

  it("returns [] (never throws) when a query endpoint is unreachable", async () => {
    // Point it at queries that will fail to resolve; fetch should swallow the error.
    process.env.WEB_SEARCH_QUERIES = "";
    process.env.WEB_SEARCH_EXTRA_FEEDS = "https://127.0.0.1:1/does-not-exist.xml";
    const leads = await webSearchSource.fetch();
    expect(Array.isArray(leads)).toBe(true);
  });
});
