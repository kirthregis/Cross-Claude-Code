/**
 * Persistence for engine settings + media library.
 *
 * Settings are stored as one JSON row in SQLite (git-ignored), exactly like the
 * profile overrides. Media files live under /data/media with metadata in SQLite
 * so Emy can upload pics/videos as artwork and reuse them as backdrops.
 *
 * NOTE on hosting: SQLite and the local /data/media folder persist on her own
 * machine but reset on Vercel's ephemeral filesystem per deploy. For a permanent
 * Vercel setup you'd point the media store at a blob service; the structure here
 * keeps that a contained change.
 */

import { db } from "./db";
import { mkdirSync, writeFileSync, existsSync, readFileSync, unlinkSync, renameSync } from "fs";
import { join } from "path";
import {
  DEFAULT_SETTINGS,
  setSettingsLoader,
  invalidateSettingsCache,
  type EngineSettings,
} from "./engine-settings";

/* ------------------------------------------------------------------ *
 * Settings
 * ------------------------------------------------------------------ */
function ensureSettings() {
  db().exec(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`);
}

/** Deep-merge over an existing value so a partial save never drops a field. */
function merge<T>(base: T, over: unknown): T {
  if (over === null || over === undefined) return base;
  if (typeof base !== "object" || Array.isArray(base) || typeof over !== "object" || Array.isArray(over)) {
    return (over as T) || base;
  }
  const out: Record<string, unknown> = { ...(base as unknown as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    out[k] = k in out ? merge((base as unknown as Record<string, unknown>)[k], v) : v;
  }
  return out as unknown as T;
}

export function getSettings(): EngineSettings {
  ensureSettings();
  const row = db().prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
  if (!row) return DEFAULT_SETTINGS;
  try {
    return merge(DEFAULT_SETTINGS, JSON.parse(row.data));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const RATE_KEYS = ["urgentFrom", "highFrom", "normalFrom", "digestFrom", "suppressBelow"] as const;

export function saveSettings(patch: Partial<EngineSettings>): EngineSettings {
  ensureSettings();
  const row = db().prepare("SELECT data FROM settings WHERE id = 1").get() as { data: string } | undefined;
  const existing: unknown = row ? JSON.parse(row.data) : {};
  const next = merge(DEFAULT_SETTINGS, merge(existing as EngineSettings, patch));
  // Clamp numbers to sane ranges.
  next.alerts.quietStartHour = clamp(next.alerts.quietStartHour, 0, 23);
  next.alerts.quietEndHour = clamp(next.alerts.quietEndHour, 0, 23);
  for (const k of RATE_KEYS) next.alerts[k] = clamp(next.alerts[k], 0, 100);
  if (typeof next.hunting?.webScanOn !== "boolean") next.hunting.webScanOn = true;
  if (typeof next.branding?.accentColor !== "string") next.branding.accentColor = "#e11d48";

  db().prepare(
    `INSERT INTO settings (id, data, updated_at) VALUES (1, @d, @t)
     ON CONFLICT(id) DO UPDATE SET data = @d, updated_at = @t`
  ).run({ d: JSON.stringify(next), t: new Date().toISOString() });
  invalidateSettingsCache();
  return getSettings();
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

/** Registers the DB-backed loader so `activeSettings()` reflects saved values. */
export function registerSettingsLoader() {
  setSettingsLoader(getSettings);
}

/* ------------------------------------------------------------------ *
 * Media library
 * ------------------------------------------------------------------ */
export interface MediaItem {
  id: string;
  name: string;
  kind: "image" | "video";
  mime: string;
  size: number;
  createdAt: string;
  /** Optional roles, e.g. ["backdrop", "press", "contract-logo"]. */
  tags: string[];
}

const mediaDir = () => process.env.MEDIA_DIR ?? "./data/media";

function ensureMedia() {
  mkdirSync(mediaDir(), { recursive: true });
  db().exec(`CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    tags TEXT NOT NULL,
    created_at TEXT NOT NULL
  );`);
}

export function listMedia(): MediaItem[] {
  ensureMedia();
  const rows = db().prepare("SELECT * FROM media ORDER BY created_at DESC").all() as Array<{
    id: string; name: string; kind: string; mime: string; size: number; tags: string; created_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id, name: r.name, kind: r.kind as MediaItem["kind"], mime: r.mime,
    size: r.size, tags: JSON.parse(r.tags), createdAt: r.created_at,
  }));
}

export function addMedia(opts: { id: string; name: string; kind: MediaItem["kind"]; mime: string; size: number; tags?: string[]; file: Buffer }): MediaItem {
  ensureMedia();
  mkdirSync(mediaDir(), { recursive: true });
  writeFileSync(join(mediaDir(), opts.id), opts.file);
  const item: MediaItem = {
    id: opts.id, name: opts.name, kind: opts.kind, mime: opts.mime,
    size: opts.size, tags: opts.tags ?? [], createdAt: new Date().toISOString(),
  };
  db().prepare(
    `INSERT INTO media (id, name, kind, mime, size, tags, created_at)
     VALUES (@id, @name, @kind, @mime, @size, @tags, @created_at)`
  ).run({
    id: item.id, name: item.name, kind: item.kind, mime: item.mime,
    size: item.size, tags: JSON.stringify(item.tags), created_at: item.createdAt,
  });
  return item;
}

export function getMediaFile(id: string): { item: MediaItem; buffer: Buffer } | null {
  ensureMedia();
  const row = db().prepare("SELECT * FROM media WHERE id = ?").get(id) as Record<string, string> | undefined;
  if (!row) return null;
  const path = join(mediaDir(), id);
  if (!existsSync(path)) return null;
  return {
    item: {
      id: row.id, name: row.name, kind: row.kind as MediaItem["kind"], mime: row.mime,
      size: Number(row.size), tags: JSON.parse(row.tags), createdAt: row.created_at,
    },
    buffer: readFileSync(path),
  };
}

export function deleteMedia(id: string): boolean {
  ensureMedia();
  const row = db().prepare("SELECT * FROM media WHERE id = ?").get(id);
  if (!row) return false;
  db().prepare("DELETE FROM media WHERE id = ?").run(id);
  const path = join(mediaDir(), id);
  try { if (existsSync(path)) unlinkSync(path); } catch { /* best effort */ }
  // Clear any backdrop reference.
  const settings = getSettings();
  if (settings.branding.backdropMediaId === id) {
    saveSettings({ branding: { ...settings.branding, backdropMediaId: undefined } });
  }
  return true;
}

// renameSync imported for forward-compat (file moves) — keeps this module's API
// surface stable if we later add rename support.
export { renameSync };
