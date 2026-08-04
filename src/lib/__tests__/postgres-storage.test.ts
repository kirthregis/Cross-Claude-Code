import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createPostgresStorage } from "../storage/postgres";
import type { Storage } from "../storage/types";
import type { Gig } from "../types";
import { DEFAULT_SETTINGS } from "../engine-settings";

/**
 * Integration test for the Postgres storage backend, run against pg-mem (an
 * in-memory Postgres that speaks the `pg` client protocol). This proves the
 * SQL is valid Postgres and every storage operation works, without needing a
 * live Postgres server.
 */

async function makePgStorage(): Promise<Storage> {
  // pg-mem v3: CJS. `newDb()` builds the in-memory DB; the pg adapter is at
  // db.adapters.db.adapters.createPg() and returns a `pg`-compatible Pool.
  const pgmem = (await import("pg-mem")) as unknown as {
    newDb: () => { adapters: { db: { adapters: { createPg: () => { Pool: new (c?: string) => import("pg").Pool } } } } };
  };
  const mem = pgmem.newDb();
  const { Pool } = mem.adapters.db.adapters.createPg();
  return createPostgresStorage(new Pool());
}

let s: Storage;

beforeEach(async () => {
  s = await makePgStorage();
});

afterEach(async () => {
  await s.close();
});

function makeGig(over: Partial<Gig> = {}): Gig {
  return {
    id: "g1", fingerprint: "fp1", sourceKind: "manual", sourceName: "test",
    title: "Cove Beach DJ", body: "Afro house peak slot", venueTier: "beach_club",
    genresWanted: ["Afro House"], postedAt: new Date().toISOString(), discoveredAt: new Date().toISOString(),
    contacts: [], score: 80, stage: "new", ...over,
  };
}

describe("postgres storage", () => {
  it("upserts and lists gigs", async () => {
    const { inserted } = await s.upsertGig(makeGig());
    expect(inserted).toBe(true);
    // same fingerprint -> not inserted again
    const dup = await s.upsertGig(makeGig({ id: "g2" }));
    expect(dup.inserted).toBe(false);
    const gigs = await s.listGigs();
    expect(gigs).toHaveLength(1);
    expect(gigs[0].venueTier).toBe("beach_club");
  });

  it("lists with filters", async () => {
    await s.upsertGig(makeGig({ id: "a", fingerprint: "fa", score: 90 }));
    await s.upsertGig(makeGig({ id: "b", fingerprint: "fb", score: 40, title: "bar" }));
    const high = await s.listGigs({ minScore: 70 });
    expect(high.map((g) => g.id)).toEqual(["a"]);
    const stage = await s.listGigs({ stage: "new" });
    expect(stage).toHaveLength(2);
  });

  it("get/setStage", async () => {
    await s.upsertGig(makeGig());
    const g = await s.getGig("g1");
    expect(g?.title).toBe("Cove Beach DJ");
    const updated = await s.setStage("g1", "pitched");
    expect(updated?.stage).toBe("pitched");
    expect((await s.getGig("g1"))?.stage).toBe("pitched");
  });

  it("alerts log + alreadyAlerted", async () => {
    await s.upsertGig(makeGig());
    expect(await s.alreadyAlerted("g1")).toBe(false);
    await s.logAlert("g1", "urgent", "whatsapp", true);
    expect(await s.alreadyAlerted("g1")).toBe(true);
  });

  it("deferred queue round-trip", async () => {
    await s.upsertGig(makeGig({ score: 90 }));
    await s.upsertGig(makeGig({ id: "g2", fingerprint: "fp2", score: 70, title: "second" }));
    await s.deferAlert("g1", "normal");
    await s.deferAlert("g2", "normal");
    const pending = await s.pendingDeferred();
    expect(pending.map((p) => p.gig.id)).toEqual(["g1", "g2"]); // best first
    await s.markDeferredReleased(["g1", "g2"]);
    expect(await s.pendingDeferred()).toHaveLength(0);
  });

  it("sweeps record + stats", async () => {
    await s.upsertGig(makeGig());
    await s.recordSweep(3, 1, ["ok"]);
    const st = await s.stats();
    expect(st.total).toBe(1);
    expect(st.lastSweep?.found).toBe(3);
  });

  it("profile + settings persist falsy values", async () => {
    // profile
    await s.saveProfile({ name: "DJ Emy" } as never);
    expect((await s.getProfile()).name).toBe("DJ Emy");
    expect((await s.getProfile()).genres.length).toBeGreaterThan(0); // merge kept defaults
    // settings falsy bug guard
    await s.saveSettings({ hunting: { webScanOn: false } } as never);
    const st = await s.getSettings();
    expect(st.hunting.webScanOn).toBe(false);
    expect(st.alerts.urgentFrom).toBe(DEFAULT_SETTINGS.alerts.urgentFrom);
    // defaults are the compiled ones
    expect((await s.getSettings()).branding.accentColor).toBe("#e11d48");
  });

  it("media add/list/delete", async () => {
    const item = await s.addMedia({ id: "m1", name: "pic.png", kind: "image", mime: "image/png", size: 100, tags: ["backdrop"] });
    expect(item.id).toBe("m1");
    const list = await s.listMedia();
    expect(list.map((m) => m.id)).toContain("m1");
    expect(await s.deleteMedia("m1")).toBe(true);
    expect(await s.listMedia()).toHaveLength(0);
  });
});
