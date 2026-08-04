/**
 * Persistence. SQLite via better-sqlite3 — synchronous, zero-config, fast
 * enough for a single artist's pipeline and trivially swappable for Postgres.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type { Gig, DealStage } from "./types";

const dbPath = () => process.env.DB_PATH ?? "./data/gigradar.db";

let _db: Database.Database | null = null;
let _openPath: string | null = null;

/** Close the current handle (tests, or switching database file). */
export function closeDb() {
  try { _db?.close(); } catch { /* already closed */ }
  _db = null;
  _openPath = null;
}

export function db(): Database.Database {
  const DB_PATH = dbPath();
  // Re-open if the configured path changed — otherwise a cached handle would
  // silently keep serving the previous database.
  if (_db && _openPath === DB_PATH) return _db;
  if (_db) closeDb();
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
  _openPath = DB_PATH;
  _db.pragma("journal_mode = WAL");
  _db.exec(`
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

    -- Gigs held back by quiet hours, released in the morning digest.
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

    -- EMY Studio: suggestions from the artist → improvement queue for the dev.
    CREATE TABLE IF NOT EXISTS studio_feedback (
      id TEXT PRIMARY KEY,
      client_id TEXT,
      text TEXT NOT NULL,
      device TEXT,
      category TEXT,
      priority TEXT,
      plan TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_client ON studio_feedback(client_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON studio_feedback(status);
  `);
  return _db;
}

export function upsertGig(g: Gig): { inserted: boolean } {
  const stmt = db().prepare(
    `INSERT INTO gigs (id, fingerprint, data, score, stage, event_date, discovered_at)
     VALUES (@id, @fingerprint, @data, @score, @stage, @event_date, @discovered_at)
     ON CONFLICT(fingerprint) DO NOTHING`
  );
  const info = stmt.run({
    id: g.id,
    fingerprint: g.fingerprint,
    data: JSON.stringify(g),
    score: g.score,
    stage: g.stage,
    event_date: g.eventDate ?? null,
    discovered_at: g.discoveredAt,
  });
  return { inserted: info.changes > 0 };
}

export function listGigs(opts: { stage?: DealStage; minScore?: number; limit?: number } = {}): Gig[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (opts.stage) { where.push("stage = @stage"); params.stage = opts.stage; }
  if (opts.minScore != null) { where.push("score >= @minScore"); params.minScore = opts.minScore; }
  const sql = `SELECT data FROM gigs ${where.length ? "WHERE " + where.join(" AND ") : ""}
               ORDER BY score DESC, discovered_at DESC LIMIT @limit`;
  const rows = db().prepare(sql).all({ ...params, limit: opts.limit ?? 100 }) as { data: string }[];
  return rows.map((r) => JSON.parse(r.data) as Gig);
}

export function getGig(id: string): Gig | null {
  const row = db().prepare("SELECT data FROM gigs WHERE id = ?").get(id) as { data: string } | undefined;
  return row ? (JSON.parse(row.data) as Gig) : null;
}

export function setStage(id: string, stage: DealStage): Gig | null {
  const g = getGig(id);
  if (!g) return null;
  g.stage = stage;
  db().prepare("UPDATE gigs SET data = ?, stage = ? WHERE id = ?").run(JSON.stringify(g), stage, id);
  return g;
}

export function logAlert(gigId: string, tier: string, channel: string, ok: boolean, detail?: string) {
  db().prepare(
    "INSERT INTO alerts (gig_id, tier, channel, sent_at, ok, detail) VALUES (?,?,?,?,?,?)"
  ).run(gigId, tier, channel, new Date().toISOString(), ok ? 1 : 0, detail ?? null);
}

export function alreadyAlerted(gigId: string): boolean {
  const row = db().prepare("SELECT 1 FROM alerts WHERE gig_id = ? AND ok = 1 LIMIT 1").get(gigId);
  return !!row;
}

/** Hold a gig for the morning digest instead of dropping it. */
export function deferAlert(gigId: string, tier: string) {
  db().prepare(
    `INSERT INTO deferred (gig_id, tier, queued_at) VALUES (?,?,?)
     ON CONFLICT(gig_id) DO NOTHING`
  ).run(gigId, tier, new Date().toISOString());
}

/** Gigs waiting in the digest queue, best first. */
export function pendingDeferred(): { gig: Gig; tier: string; queuedAt: string }[] {
  const rows = db().prepare(
    `SELECT d.gig_id, d.tier, d.queued_at, g.data
     FROM deferred d JOIN gigs g ON g.id = d.gig_id
     WHERE d.released_at IS NULL
     ORDER BY g.score DESC`
  ).all() as { gig_id: string; tier: string; queued_at: string; data: string }[];
  return rows.map((r) => ({ gig: JSON.parse(r.data) as Gig, tier: r.tier, queuedAt: r.queued_at }));
}

export function markDeferredReleased(gigIds: string[]) {
  if (!gigIds.length) return;
  const stmt = db().prepare("UPDATE deferred SET released_at = ? WHERE gig_id = ?");
  const now = new Date().toISOString();
  const tx = db().transaction((ids: string[]) => { for (const id of ids) stmt.run(now, id); });
  tx(gigIds);
}

export function recordSweep(found: number, newGigs: number, errors: string[]) {
  db().prepare(
    "INSERT INTO sweeps (started_at, finished_at, found, new_gigs, errors) VALUES (?,?,?,?,?)"
  ).run(new Date().toISOString(), new Date().toISOString(), found, newGigs, errors.join("; ") || null);
}

export function stats() {
  const d = db();
  const total = (d.prepare("SELECT COUNT(*) c FROM gigs").get() as { c: number }).c;
  const byStage = d.prepare("SELECT stage, COUNT(*) c FROM gigs GROUP BY stage").all() as { stage: string; c: number }[];
  const lastSweep = d.prepare("SELECT * FROM sweeps ORDER BY id DESC LIMIT 1").get() as
    | { finished_at: string; found: number; new_gigs: number }
    | undefined;
  return { total, byStage, lastSweep };
}

// ─── EMY Studio feedback ────────────────────────────────────────────────

export interface StudioFeedbackRow {
  id: string;
  clientId: string | null;
  text: string;
  device: string | null;
  category: string | null;
  priority: string | null;
  plan: string | null; // JSON string
  status: string;
  createdAt: string;
  updatedAt: string | null;
}

export type FeedbackStatus = "new" | "planned" | "done" | "dismissed";

interface FeedbackRawRow {
  id: string;
  client_id: string | null;
  text: string;
  device: string | null;
  category: string | null;
  priority: string | null;
  plan: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
}

function rowToFeedback(r: FeedbackRawRow): StudioFeedbackRow {
  return {
    id: r.id, clientId: r.client_id, text: r.text, device: r.device,
    category: r.category, priority: r.priority, plan: r.plan,
    status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function addStudioFeedback(f: {
  id: string; clientId?: string | null; text: string; device?: string | null;
  category?: string | null; priority?: string | null; plan?: string | null;
}): StudioFeedbackRow {
  const now = new Date().toISOString();
  db().prepare(
    `INSERT INTO studio_feedback (id, client_id, text, device, category, priority, plan, status, created_at)
     VALUES (?,?,?,?,?,?,?,'new',?)`,
  ).run(f.id, f.clientId ?? null, f.text, f.device ?? null, f.category ?? null, f.priority ?? null, f.plan ?? null, now);
  return rowToFeedback(db().prepare("SELECT * FROM studio_feedback WHERE id = ?").get(f.id) as FeedbackRawRow);
}

export function getStudioFeedback(id: string): StudioFeedbackRow | null {
  const r = db().prepare("SELECT * FROM studio_feedback WHERE id = ?").get(id) as FeedbackRawRow | undefined;
  return r ? rowToFeedback(r) : null;
}

/** The artist's own suggestions (her device only). */
export function listStudioFeedback(clientId?: string | null): StudioFeedbackRow[] {
  const rows = clientId
    ? db().prepare("SELECT * FROM studio_feedback WHERE client_id = ? ORDER BY created_at DESC").all(clientId)
    : db().prepare("SELECT * FROM studio_feedback ORDER BY created_at DESC").all();
  return (rows as FeedbackRawRow[]).map(rowToFeedback);
}

/** Everything, for the developer's back end. */
export function allStudioFeedback(): StudioFeedbackRow[] {
  return listStudioFeedback(null);
}

export function setStudioFeedbackStatus(id: string, status: FeedbackStatus): StudioFeedbackRow | null {
  const r = db().prepare(
    "UPDATE studio_feedback SET status = ?, updated_at = ? WHERE id = ?",
  ).run(status, new Date().toISOString(), id);
  if (r.changes === 0) return null;
  return getStudioFeedback(id);
}

export function studioFeedbackStats() {
  const d = db();
  const rows = d.prepare("SELECT status, COUNT(*) c FROM studio_feedback GROUP BY status").all() as { status: string; c: number }[];
  const byStatus: Record<string, number> = { new: 0, planned: 0, done: 0, dismissed: 0 };
  for (const r of rows) byStatus[r.status] = r.c;
  const byCategory = d.prepare("SELECT category, COUNT(*) c FROM studio_feedback WHERE category IS NOT NULL GROUP BY category").all() as { category: string; c: number }[];
  return { total: rows.reduce((a, r) => a + r.c, 0), byStatus, byCategory };
}
