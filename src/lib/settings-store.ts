/**
 * Persistence for engine settings + media library.
 *
 * Settings are stored in one JSON row (SQLite locally, Postgres in
 * production). Media files live under /data/media (local) — on Vercel, media
 * persistence is handled by object/blob storage; see ROADMAP notes.
 *
 * Storage is async. The sync `activeSettings()` loader is fed from an in-memory
 * cache populated once from storage, so pure logic modules stay testable.
 */

import { getStorage } from "./storage";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import {
  DEFAULT_SETTINGS,
  setSettingsLoader,
  invalidateSettingsCache,
  type EngineSettings,
} from "./engine-settings";

let _cache: EngineSettings = DEFAULT_SETTINGS;
let _loaderReady = false;

/** Always reads fresh from storage (used by API routes). */
export async function getSettings(): Promise<EngineSettings> {
  const s = await getStorage();
  _cache = await s.getSettings();
  _loaderReady = true;
  return _cache;
}

export async function saveSettings(patch: Partial<EngineSettings>): Promise<EngineSettings> {
  const s = await getStorage();
  _cache = await s.saveSettings(patch);
  _loaderReady = true;
  invalidateSettingsCache();
  return _cache;
}

/** Registers the DB-backed loader so `activeSettings()` reflects saved values. */
export async function registerSettingsLoader(): Promise<void> {
  if (!_loaderReady) await getSettings();
  setSettingsLoader(() => _cache);
}

/* ------------------------------------------------------------------ *
 * Media library (delegates to the active backend)
 * ------------------------------------------------------------------ */
export interface MediaItem {
  id: string;
  name: string;
  kind: "image" | "video";
  mime: string;
  size: number;
  createdAt: string;
  tags: string[];
}

export async function listMedia(): Promise<MediaItem[]> {
  return (await getStorage()).listMedia();
}

export async function addMedia(opts: { id: string; name: string; kind: MediaItem["kind"]; mime: string; size: number; tags?: string[]; file: Buffer }): Promise<MediaItem> {
  // On SQLite the file also goes to disk; the storage backend handles metadata.
  const dir = process.env.MEDIA_DIR ?? "./data/media";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, opts.id), opts.file);
  return (await getStorage()).addMedia(opts);
}

export async function getMediaFile(id: string): Promise<{ item: MediaItem; buffer: Buffer } | null> {
  return (await getStorage()).getMediaFile(id);
}

export async function deleteMedia(id: string): Promise<boolean> {
  return (await getStorage()).deleteMedia(id);
}
