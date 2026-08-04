/**
 * Postgres storage backend. Used when DATABASE_URL is set (production on
 * Vercel + Neon/Supabase). Durable across redeploys.
 *
 * The schema mirrors the SQLite one. `pg-mem` is used in tests to validate the
 * SQL without needing a live Postgres server.
 */

import type { Pool } from "pg";
import type { Gig } from "../types";
import { DJ_EMY } from "../artist";
import { DEFAULT_SETTINGS } from "../engine-settings";
import type { MediaItem } from "../settings-store";
import type { Storage, DeferredEntry } from "./types";

export const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS gigs (
  id TEXT PRIMARY KEY,
  fingerprint TEXT UNIQUE NOT NULL,
  data TEXT NOT NULL,
  score INTEGER NOT NULL,
  stage TEXT NOT NULL,
  event_date TEXT,
  discovered_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_gigs_score ON gigs(score DESC);
CREATE INDEX IF NOT EXISTS idx_gigs_stage ON gigs(stage);

CREATE TABLE IF NOT EXISTS alerts (
  id SERIAL PRIMARY KEY,
  gig_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  channel TEXT NOT NULL,
  sent_at TEXT NOT NULL,
  ok INTEGER NOT NULL,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS deferred (
  gig_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL,
  queued_at TEXT NOT NULL,
  released_at TEXT
);

CREATE TABLE IF NOT EXISTS sweeps (
  id SERIAL PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  found INTEGER DEFAULT 0,
  new_gigs INTEGER DEFAULT 0,
  errors TEXT
);

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL
);
`;

/** Deep-merge: `over` always wins including falsy values. */
function merge<T>(base: T, over: unknown): T {
  if (over === undefined || over === null) return base;
  const baseIsObj = typeof base === "object" && base !== null && !Array.isArray(base);
  const overIsObj = typeof over === "object" && over !== null && !Array.isArray(over);
  if (baseIsObj && overIsObj) {
    const out: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
    for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
      out[k] = k in out ? merge((base as unknown as Record<string, unknown>)[k], v) : v;
    }
    return out as unknown as T;
  }
  return over as T;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

export function createPostgresStorage(pool: Pool): Storage {
  let ready: Promise<void> | null = null;
  const ensureSchema = async () => {
    if (!ready) {
      ready = (async () => { await pool.query(PG_SCHEMA); })().catch((e) => { ready = null; throw e; });
    }
    return ready;
  };

  const one = async <T>(sql: string, params: unknown[] = []): Promise<T | null> => {
    const r = await pool.query(sql, params);
    return r.rows[0] as T ?? null;
  };

  return {
    async close() { await pool.end(); },

    async upsertGig(g) {
      await ensureSchema();
      // Explicit existence check (rather than relying on rowCount semantics,
      // which differ between Postgres and emulators): return inserted:false
      // when the fingerprint already exists, otherwise insert.
      const exists = await one<{ x: string }>("SELECT 1 x FROM gigs WHERE fingerprint = $1", [g.fingerprint]);
      if (exists) return { inserted: false };
      await pool.query(
        `INSERT INTO gigs (id, fingerprint, data, score, stage, event_date, discovered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [g.id, g.fingerprint, JSON.stringify(g), g.score, g.stage, g.eventDate ?? null, g.discoveredAt]
      );
      return { inserted: true };
    },

    async listGigs(opts = {}) {
      await ensureSchema();
      const where: string[] = [];
      const params: unknown[] = [];
      if (opts.stage) { params.push(opts.stage); where.push(`stage = $${params.length}`); }
      if (opts.minScore != null) { params.push(opts.minScore); where.push(`score >= $${params.length}`); }
      params.push(opts.limit ?? 100);
      const sql = `SELECT data FROM gigs ${where.length ? "WHERE " + where.join(" AND ") : ""}
                   ORDER BY score DESC, discovered_at DESC LIMIT $${params.length}`;
      const r = await pool.query(sql, params);
      return r.rows.map((row) => JSON.parse(row.data) as Gig);
    },

    async getGig(id) {
      await ensureSchema();
      const row = await one<{ data: string }>("SELECT data FROM gigs WHERE id = $1", [id]);
      return row ? (JSON.parse(row.data) as Gig) : null;
    },

    async setStage(id, stage) {
      const g = await this.getGig(id);
      if (!g) return null;
      g.stage = stage;
      await pool.query("UPDATE gigs SET data = $1, stage = $2 WHERE id = $3", [JSON.stringify(g), stage, id]);
      return g;
    },

    async stats() {
      await ensureSchema();
      const total = (await one<{ c: string | number }>("SELECT COUNT(*) c FROM gigs"))?.c ?? 0;
      const byR = await pool.query("SELECT stage, COUNT(*) c FROM gigs GROUP BY stage");
      const byStage = byR.rows.map((r) => ({ stage: r.stage as string, c: Number(r.c) }));
      const lastSweep = await one<{ finished_at: string; found: string | number; new_gigs: string | number }>(
        "SELECT * FROM sweeps ORDER BY id DESC LIMIT 1");
      return {
        total: Number(total),
        byStage,
        lastSweep: lastSweep ? { finished_at: lastSweep.finished_at, found: Number(lastSweep.found), new_gigs: Number(lastSweep.new_gigs) } : undefined,
      };
    },

    async logAlert(gigId, tier, channel, ok, detail) {
      await ensureSchema();
      await pool.query(
        "INSERT INTO alerts (gig_id, tier, channel, sent_at, ok, detail) VALUES ($1,$2,$3,$4,$5,$6)",
        [gigId, tier, channel, new Date().toISOString(), ok ? 1 : 0, detail ?? null]
      );
    },

    async alreadyAlerted(gigId) {
      await ensureSchema();
      const row = await one("SELECT 1 x FROM alerts WHERE gig_id = $1 AND ok = 1 LIMIT 1", [gigId]);
      return !!row;
    },

    async deferAlert(gigId, tier) {
      await ensureSchema();
      await pool.query(
        `INSERT INTO deferred (gig_id, tier, queued_at) VALUES ($1,$2,$3)
         ON CONFLICT (gig_id) DO NOTHING`,
        [gigId, tier, new Date().toISOString()]
      );
    },

    async pendingDeferred(): Promise<DeferredEntry[]> {
      await ensureSchema();
      const r = await pool.query(
        `SELECT d.gig_id, d.tier, d.queued_at, g.data
         FROM deferred d JOIN gigs g ON g.id = d.gig_id
         WHERE d.released_at IS NULL
         ORDER BY g.score DESC`
      );
      return r.rows.map((row) => ({ gig: JSON.parse(row.data) as Gig, tier: row.tier as string, queuedAt: row.queued_at as string }));
    },

    async markDeferredReleased(gigIds) {
      if (!gigIds.length) return;
      await ensureSchema();
      const now = new Date().toISOString();
      for (const id of gigIds) {
        await pool.query("UPDATE deferred SET released_at = $1 WHERE gig_id = $2", [now, id]);
      }
    },

    async recordSweep(found, newGigs, errors) {
      await ensureSchema();
      await pool.query(
        "INSERT INTO sweeps (started_at, finished_at, found, new_gigs, errors) VALUES ($1,$2,$3,$4,$5)",
        [new Date().toISOString(), new Date().toISOString(), found, newGigs, errors.join("; ") || null]
      );
    },

    async getProfile() {
      await ensureSchema();
      const row = await one<{ data: string }>("SELECT data FROM profile WHERE id = 1");
      if (!row) return DJ_EMY;
      try { return merge(DJ_EMY, JSON.parse(row.data)); } catch { return DJ_EMY; }
    },

    async saveProfile(patch) {
      await ensureSchema();
      const row = await one<{ data: string }>("SELECT data FROM profile WHERE id = 1");
      const existing = row ? JSON.parse(row.data) : {};
      const next = merge(existing, patch);
      await pool.query(
        `INSERT INTO profile (id, data, updated_at) VALUES (1,$1,$2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [JSON.stringify(next), new Date().toISOString()]
      );
      return this.getProfile();
    },

    async getSettings() {
      await ensureSchema();
      const row = await one<{ data: string }>("SELECT data FROM settings WHERE id = 1");
      if (!row) return DEFAULT_SETTINGS;
      try { return merge(DEFAULT_SETTINGS, JSON.parse(row.data)); } catch { return DEFAULT_SETTINGS; }
    },

    async saveSettings(patch) {
      await ensureSchema();
      const row = await one<{ data: string }>("SELECT data FROM settings WHERE id = 1");
      const existing = row ? JSON.parse(row.data) : {};
      const next = merge(DEFAULT_SETTINGS, merge(existing, patch));
      next.alerts.quietStartHour = clamp(next.alerts.quietStartHour, 0, 23);
      next.alerts.quietEndHour = clamp(next.alerts.quietEndHour, 0, 23);
      for (const k of ["urgentFrom", "highFrom", "normalFrom", "digestFrom", "suppressBelow"] as const) {
        next.alerts[k] = clamp(next.alerts[k], 0, 100);
      }
      if (typeof next.hunting?.webScanOn !== "boolean") next.hunting.webScanOn = true;
      if (typeof next.branding?.accentColor !== "string") next.branding.accentColor = "#e11d48";
      await pool.query(
        `INSERT INTO settings (id, data, updated_at) VALUES (1,$1,$2)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = EXCLUDED.updated_at`,
        [JSON.stringify(next), new Date().toISOString()]
      );
      return this.getSettings();
    },

    async listMedia() {
      await ensureSchema();
      const r = await pool.query("SELECT * FROM media ORDER BY created_at DESC");
      return r.rows.map((row) => ({
        id: row.id as string, name: row.name as string, kind: row.kind as MediaItem["kind"], mime: row.mime as string,
        size: Number(row.size), tags: JSON.parse(row.tags as string), createdAt: row.created_at as string,
      }));
    },

    async addMedia(opts) {
      await ensureSchema();
      const item: MediaItem = {
        id: opts.id, name: opts.name, kind: opts.kind, mime: opts.mime, size: opts.size, tags: opts.tags ?? [], createdAt: new Date().toISOString(),
      };
      await pool.query(
        `INSERT INTO media (id, name, kind, mime, size, tags, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [item.id, item.name, item.kind, item.mime, item.size, JSON.stringify(item.tags), item.createdAt]
      );
      return item;
    },

    async getMediaFile(id) {
      await ensureSchema();
      const row = await one<Record<string, unknown>>("SELECT * FROM media WHERE id = $1", [id]);
      if (!row) return null;
      return { item: {
        id: row.id as string, name: row.name as string, kind: row.kind as MediaItem["kind"], mime: row.mime as string,
        size: Number(row.size), tags: JSON.parse(row.tags as string), createdAt: row.created_at as string,
      }, buffer: Buffer.from("") };
    },

    async deleteMedia(id) {
      await ensureSchema();
      const r = await pool.query("DELETE FROM media WHERE id = $1", [id]);
      return (r.rowCount ?? 0) > 0;
    },
  };
}
