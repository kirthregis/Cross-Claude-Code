import { describe, expect, it, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { analyzeSuggestion, categorizeSuggestion, parseAnalysisJson, thanksReply } from "../improve";
import { closeDb, addStudioFeedback, allStudioFeedback, getStudioFeedback, listStudioFeedback, setStudioFeedbackStatus, studioFeedbackStats } from "../../db";

describe("improve (suggestion analysis)", () => {
  it("categorises features, bugs, design and content", () => {
    expect(categorizeSuggestion("Can we add auto-upload to YouTube?")).toBe("feature");
    expect(categorizeSuggestion("The master tab crashed when I loaded a big file")).toBe("bug");
    expect(categorizeSuggestion("Could the cover look warmer / more gold?")).toBe("design");
    expect(categorizeSuggestion("Write better descriptions with more hashtags")).toBe("content");
    expect(categorizeSuggestion("Hello there")).toBe("other");
  });

  it("gives high priority to urgent bug reports", () => {
    const a = analyzeSuggestion("It deleted my project, urgent!");
    expect(a.priority).toBe("high");
  });

  it("produces a plan without any AI", () => {
    const a = analyzeSuggestion("Add Instagram Reels export");
    expect(a.category).toBe("feature");
    expect(a.plan.length).toBeGreaterThan(20);
    expect(a.oneLine).toContain("Instagram Reels export");
  });

  it("parses Gemini JSON robustly (with markdown fences)", () => {
    const raw = '```json\n{"category":"feature","priority":"medium","oneLine":"Reels export","plan":"1. Add export button in Release tab"}\n```';
    const parsed = parseAnalysisJson(raw);
    expect(parsed?.category).toBe("feature");
    expect(parsed?.plan).toContain("Release tab");
  });

  it("falls back to null on garbage", () => {
    expect(parseAnalysisJson("not json at all")).toBeNull();
  });

  it("thanks the artist with the logged id", () => {
    const a = analyzeSuggestion("Add a timer");
    const reply = thanksReply(a, "abc123def456");
    expect(reply).toContain("#abc123");
    expect(reply).toContain("logged");
  });
});

describe("studio feedback store", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-fb-")), "t.db");
  });

  it("stores, lists by client, filters statuses and reports stats", () => {
    const a = addStudioFeedback({ id: "f1", clientId: "devA", text: "Add reels export", category: "feature", priority: "medium", plan: "{}" });
    addStudioFeedback({ id: "f2", clientId: "devA", text: "Crash on import", category: "bug", priority: "high", plan: "{}" });
    addStudioFeedback({ id: "f3", clientId: "devB", text: "Nicer colours", category: "design", priority: "low" });

    expect(a.status).toBe("new");
    expect(getStudioFeedback("f1")?.text).toBe("Add reels export");
    expect(listStudioFeedback("devA").map((r) => r.id).sort()).toEqual(["f1", "f2"]);
    expect(allStudioFeedback()).toHaveLength(3);

    const updated = setStudioFeedbackStatus("f1", "planned");
    expect(updated?.status).toBe("planned");
    expect(getStudioFeedback("f1")?.status).toBe("planned");

    const stats = studioFeedbackStats();
    expect(stats.total).toBe(3);
    expect(stats.byStatus.new).toBe(2);
    expect(stats.byStatus.planned).toBe(1);

    // cleanup
    closeDb();
  });
});
