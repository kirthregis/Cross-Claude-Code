/**
 * SQLite storage backend. Default for local dev (zero-config). Keeps the exact
 * schema/behaviour of the original better-sqlite3 implementation, exposed as
 * async so it satisfies the shared Storage interface.
 */

import Database from "better-sqlite3";
import { mkdirSync, readFileSync, existsSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import type { Gig } from "../types";
import { DJ_EMY } from "../artist";
import { DEFAULT_SETTINGS } from "../engine-settings";
import type { MediaItem } from "../settings-store";
import type { Storage, DeferredEntry } from "./types";

const dbPath = () => process.env.DB_PATH ?? "./data/gigradar.db";
const mediaDir = () => process.env.MEDIA_DIR ?? "./data/media";

let _db: Database.Database | null = null;
let _openPath: string | null = null;

function closeRaw() {
  try { _db?.close(); } catch { /* already closed */ }
  _db = null;
  _openPath = null;
}

function raw(): Database.Database {
  const DB_PATH = dbPath();
  if (_db && _openPath === DB_PATH) return _db;
  if (_db) closeRaw();
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _openPath = DB_PATH;
  _db.pragma("journal_mode = WAL");
  _db.exec(SCHEMA);
  return _db;
}

const SCHEMA = `
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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

/** Deep-merge: `over` always wins including falsy values; undefined/null keep base. */
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

export const sqliteStorage: Storage = {
  async close() { closeRaw(); },

  async upsertGig(g) {
    const d = raw();
    const info = d.prepare(
      `INSERT INTO gigs (id, fingerprint, data, score, stage, event_date, discovered_at)
       VALUES (@id, @fingerprint, @data, @score, @stage, @event_date, @discovered_at)
       ON CONFLICT(fingerprint) DO NOTHING`
    ).run({
      id: g.id, fingerprint: g.fingerprint, data: JSON.stringify(g),
      score: g.score, stage: g.stage, event_date: g.eventDate ?? null, discovered_at: g.discoveredAt,
    });
    return { inserted: info.changes > 0 };
  },

  async listGigs(opts = {}) {
    const where: string[] = [];
    const params: Record<string, unknown> = {};
    if (opts.stage) { where.push("stage = @stage"); params.stage = opts.stage; }
    if (opts.minScore != null) { where.push("score >= @minScore"); params.minScore = opts.minScore; }
    const sql = `SELECT data FROM gigs ${where.length ? "WHERE " + where.join(" AND ") : ""}
                 ORDER BY score DESC, discovered_at DESC LIMIT @limit`;
    const rows = raw().prepare(sql).all({ ...params, limit: opts.limit ?? 100 }) as { data: string }[];
    return rows.map((r) => JSON.parse(r.data) as Gig);
  },

  async getGig(id) {
    const row = raw().prepare("SELECT data FROM gigs WHERE id = ?").get(id) as { data: string } | undefined;
    return row ? (JSON.parse(row.data) as Gig) : null;
  },

  async setStage(id, stage) {
    const g = await this.getGig(id);
    if (!g) return null;
    g.stage = stage;
    raw().prepare("UPDATE gigs SET data = ?, stage = ? WHERE id = ?").run(JSON.stringify(g), stage, id);
    return g;
  },

  async stats() {
    const d = raw();
    const total = (d.prepare("SELECT COUNT(*) c FROM gigs").get() as { c: number }).c;
    const byStage = d.prepare("SELECT stage, COUNT(*) c FROM gigs GROUP BY stage").all() as { stage: string; c: number }[];
    const lastSweep = d.prepare("SELECT * FROM sweeps ORDER BY id DESC LIMIT 1").get() as
      | { finished_at: string; found: number; new_gigs: number } | undefined;
    return { total, byStage, lastSweep };
  },

  async logAlert(gigId, tier, channel, ok, detail) {
    raw().prepare(
      "INSERT INTO alerts (gig_id, tier, channel, sent_at, ok, detail) VALUES (?,?,?,?,?,?)"
    ).run(gigId, tier, channel, new Date().toISOString(), ok ? 1 : 0, detail ?? null);
  },

  async alreadyAlerted(gigId) {
    const row = raw().prepare("SELECT 1 FROM alerts WHERE gig_id = ? AND ok = 1 LIMIT 1").get(gigId);
    return !!row;
  },

  async deferAlert(gigId, tier) {
    raw().prepare(
      `INSERT INTO deferred (gig_id, tier, queued_at) VALUES (?,?,?)
       ON CONFLICT(gig_id) DO NOTHING`
    ).run(gigId, tier, new Date().toISOString());
  },

  async pendingDeferred(): Promise<DeferredEntry[]> {
    const rows = raw().prepare(
      `SELECT d.gig_id, d.tier, d.queued_at, g.data
       FROM deferred d JOIN gigs g ON g.id = d.gig_id
       WHERE d.released_at IS NULL
       ORDER BY g.score DESC`
    ).all() as { gig_id: string; tier: string; queued_at: string; data: string }[];
    return rows.map((r) => ({ gig: JSON.parse(r.data) as Gig, tier: r.tier, queuedAt: r.queued_at }));
  },

  async markDeferredReleased(gigIds) {
    if (!gigIds.length) return;
    const stmt = raw().prepare("UPDATE deferred SET released_at = ? WHERE gig_id = ?");
    const now = new Date().toISOString();
    const tx = raw().transaction((ids: string[]) => { for (const id of ids) stmt.run(now, id); });
    tx(gigIds);
  },

  async recordSweep(found, newGigs, errors) {
    raw().prepare(
      "INSERT INTO sweeps (started_at, finished_at, found, new_gigs, errors) VALUES (?,?,?,?,?)"
    ).run(new Date().toISOString(), new Date().toISOString(), found, newGigs, errors.join("; ") || null);
  },

  async getProfile() {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
    if (!row) return DJ_EMY;
    try { return merge(DJ_EMY, JSON.parse(row.data)); } catch { return DJ_EMY; }
  },

  async saveProfile(patch) {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT data FROM profile WHERE id = 1").get() as { data: string } | undefined;
    const existing = row ? JSON.parse(row.data) : {};
    const next = merge(existing, patch);
    d.prepare(
      `INSERT INTO profile (id, data, updated_at) VALUES (1, @d, @t)
       ON CONFLICT(id) DO UPDATE SET data = @d, updated_at = @t`
    ).run({ d: JSON.stringify(next), t: new Date().toISOString() });
    return this.getProfile();
  },

  async getSettings() {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
    if (!row) return DEFAULT_SETTINGS;
    try { return merge(DEFAULT_SETTINGS, JSON.parse(row.data)); } catch { return DEFAULT_SETTINGS; }
  },

  async saveSettings(patch) {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id=1), data TEXT NOT NULL, updated_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
    const existing = row ? JSON.parse(row.data) : {};
    const next = merge(DEFAULT_SETTINGS, merge(existing, patch));
    next.alerts.quietStartHour = clamp(next.alerts.quietStartHour, 0, 23);
    next.alerts.quietEndHour = clamp(next.alerts.quietEndHour, 0, 23);
    for (const k of ["urgentFrom", "highFrom", "normalFrom", "digestFrom", "suppressBelow"] as const) {
      next.alerts[k] = clamp(next.alerts[k], 0, 100);
    }
    if (typeof next.hunting?.webScanOn !== "boolean") next.hunting.webScanOn = true;
    if (typeof next.branding?.accentColor !== "string") next.branding.accentColor = "#e11d48";
    d.prepare(
      `INSERT INTO settings (id, data, updated_at) VALUES (1, @d, @t)
       ON CONFLICT(id) DO UPDATE SET data = @d, updated_at = @t`
    ).run({ d: JSON.stringify(next), t: new Date().toISOString() });
    return this.getSettings();
  },

  async listMedia() {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, tags TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    const rows = d.prepare("SELECT * FROM media ORDER BY created_at DESC").all() as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      id: r.id as string, name: r.name as string, kind: r.kind as MediaItem["kind"], mime: r.mime as string,
      size: Number(r.size), tags: JSON.parse(r.tags as string), createdAt: r.created_at as string,
    }));
  },

  async addMedia(opts) {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, tags TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    const item: MediaItem = {
      id: opts.id, name: opts.name, kind: opts.kind, mime: opts.mime, size: opts.size, tags: opts.tags ?? [], createdAt: new Date().toISOString(),
    };
    d.prepare(
      `INSERT INTO media (id, name, kind, mime, size, tags, created_at) VALUES (?,?,?,?,?,?,?)`
    ).run(item.id, item.name, item.kind, item.mime, item.size, JSON.stringify(item.tags), item.createdAt);
    return item;
  },

  async getMediaFile(id) {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, tags TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT * FROM media WHERE id = ?").get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const path = join(mediaDir(), id);
    if (!existsSync(path)) return null;
    return {
      item: { id: row.id as string, name: row.name as string, kind: row.kind as MediaItem["kind"], mime: row.mime as string, size: Number(row.size), tags: JSON.parse(row.tags as string), createdAt: row.created_at as string },
      buffer: readFileSync(path),
    };
  },

  async deleteMedia(id) {
    const d = raw();
    d.prepare(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, tags TEXT NOT NULL, created_at TEXT NOT NULL)`).run();
    const row = d.prepare("SELECT * FROM media WHERE id = ?").get(id);
    if (!row) return false;
    d.prepare("DELETE FROM media WHERE id = ?").run(id);
    const path = join(mediaDir(), id);
    try { if (existsSync(path)) unlinkSync(path); } catch { /* best effort */ }
    return true;
  },
};
