import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const at = (dubaiHour: number) => new Date(Date.UTC(2026, 7, 2, (dubaiHour - 4 + 24) % 24, 0, 0));

describe("quiet hours", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-")), "t.db");
  });

  it("is quiet 02:00–09:00 Dubai and awake otherwise", async () => {
    const { isQuietHours } = await import("../notify");
    expect(isQuietHours(at(3))).toBe(true);
    expect(isQuietHours(at(8))).toBe(true);
    expect(isQuietHours(at(9))).toBe(false);   // digest time, no longer quiet
    expect(isQuietHours(at(23))).toBe(false);
    expect(isQuietHours(at(1))).toBe(false);   // still nightlife hours
  });

  it("fires the digest at 09:00 Dubai only", async () => {
    const { isDigestTime } = await import("../notify");
    expect(isDigestTime(at(9))).toBe(true);
    expect(isDigestTime(at(10))).toBe(false);
    expect(isDigestTime(at(3))).toBe(false);
  });
});

describe("regression: overnight gigs must never be silently dropped", () => {
  beforeEach(() => {
    process.env.DB_PATH = join(mkdtempSync(join(tmpdir(), "gr-")), "t.db");
  });

  it("queues a non-urgent 3am gig instead of losing it", async () => {
    const { alert } = await import("../notify");
    const { pendingDeferred } = await import("../db");
    const { upsertGig } = await import("../db");
    const { normalise } = await import("../extract");
    const { scoreGig } = await import("../score");

    const base = normalise({
      sourceKind: "instagram", sourceName: "@promo", title: "DJ wanted",
      body: "Afro House DJ for hotel rooftop lounge, AED 5000, 2hr set",
      postedAt: new Date().toISOString(),
    });
    const s = scoreGig(base);
    const gig = { ...base, id: "night01", score: s.score, stage: "new" as const };
    upsertGig(gig);

    const r = await alert(gig, { ...s, tier: "high" }, at(3));
    expect(r.sent).toHaveLength(0);
    expect(r.skipped).toMatch(/digest/);

    // The critical assertion: it is still recoverable.
    expect(pendingDeferred().map((p) => p.gig.id)).toContain("night01");
  });

  it("lets an urgent gig break through quiet hours", async () => {
    const { alert } = await import("../notify");
    const { pendingDeferred, upsertGig } = await import("../db");
    const { normalise } = await import("../extract");
    const { scoreGig } = await import("../score");

    const base = normalise({
      sourceKind: "whatsapp", sourceName: "grp", title: "urgent",
      body: "Afro House DJ needed TONIGHT superclub peak slot AED 9000 call +971 50 111 2222",
      postedAt: new Date().toISOString(),
    });
    const s = scoreGig(base);
    const gig = { ...base, id: "urgent01", score: s.score, stage: "new" as const };
    upsertGig(gig);

    // No Telegram configured in tests, so nothing sends — but it must NOT queue.
    await alert(gig, { ...s, tier: "urgent" }, at(3));
    expect(pendingDeferred().map((p) => p.gig.id)).not.toContain("urgent01");
  });

  it("does not queue during waking hours", async () => {
    const { alert } = await import("../notify");
    const { pendingDeferred, upsertGig } = await import("../db");
    const { normalise } = await import("../extract");
    const { scoreGig } = await import("../score");

    const base = normalise({
      sourceKind: "instagram", sourceName: "@p", title: "t",
      body: "Afro House DJ beach club AED 6000",
      postedAt: new Date().toISOString(),
    });
    const s = scoreGig(base);
    const gig = { ...base, id: "day01", score: s.score, stage: "new" as const };
    upsertGig(gig);

    await alert(gig, { ...s, tier: "high" }, at(14));
    expect(pendingDeferred()).toHaveLength(0);
  });

  it("ranks the digest queue by score, best first", async () => {
    const { alert } = await import("../notify");
    const { pendingDeferred, upsertGig } = await import("../db");
    const { normalise } = await import("../extract");
    const { scoreGig } = await import("../score");

    for (const [id, body, score] of [
      ["low", "DJ for a bar AED 2000", 40],
      ["high", "Afro House DJ brand activation AED 20000 call +971 50 111 2222", 90],
      ["mid", "House DJ hotel lounge AED 5000", 60],
    ] as [string, string, number][]) {
      const base = normalise({ sourceKind: "instagram", sourceName: "@p", title: "t", body, postedAt: new Date().toISOString() });
      const g = { ...base, id, score, stage: "new" as const };
      upsertGig(g);
      await alert(g, { ...scoreGig(base), tier: "high" }, at(4));
    }
    expect(pendingDeferred().map((p) => p.gig.id)).toEqual(["high", "mid", "low"]);
  });

  it("does not double-queue the same gig", async () => {
    const { alert } = await import("../notify");
    const { pendingDeferred, upsertGig } = await import("../db");
    const { normalise } = await import("../extract");
    const { scoreGig } = await import("../score");

    const base = normalise({ sourceKind: "instagram", sourceName: "@p", title: "t", body: "Afro House DJ beach club AED 6000", postedAt: new Date().toISOString() });
    const s = scoreGig(base);
    const gig = { ...base, id: "dupe01", score: s.score, stage: "new" as const };
    upsertGig(gig);

    await alert(gig, { ...s, tier: "high" }, at(3));
    await alert(gig, { ...s, tier: "high" }, at(4));
    expect(pendingDeferred()).toHaveLength(1);
  });

  it("reports nothing to send on an empty queue", async () => {
    const { sendMorningDigest } = await import("../notify");
    expect(await sendMorningDigest()).toEqual({ sent: false, count: 0 });
  });
});
