/**
 * Persistence. SQLite via better-sqlite3 — synchronous, zero-config, fast
 * enough for a single artist's pipeline and trivially swappable for Postgres.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname } from "path";
import type { Gig, DealStage } from "./types";

const DB_PATH = process.env.DB_PATH ?? "./data/gigradar.db";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);
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

    CREATE TABLE IF NOT EXISTS sweeps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      found INTEGER DEFAULT 0,
      new_gigs INTEGER DEFAULT 0,
      errors TEXT
    );
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
