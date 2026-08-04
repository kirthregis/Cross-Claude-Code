/**
 * Storage router. Returns the active backend:
 *   - Postgres when DATABASE_URL is set (production: Vercel + Neon/Supabase)
 *   - SQLite otherwise (local dev, zero-config)
 *
 * `setStorage` lets tests inject a backend (e.g. pg-mem-backed Postgres or a
 * throwaway SQLite file).
 */

import type { Storage } from "./types";
import { sqliteStorage } from "./sqlite";
import { createPostgresStorage } from "./postgres";

let _storage: Storage | null = null;
let _initialized = false;

/** Test hook: force a specific backend. */
export function setStorage(s: Storage) {
  _storage = s;
  _initialized = true;
}

export function usesPostgres(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function getStorage(): Promise<Storage> {
  if (_storage) return _storage;
  if (_initialized) throw new Error("storage not set");
  const url = process.env.DATABASE_URL;
  if (url) {
    // Lazy import so `pg` isn't loaded in local/SQLite builds.
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5 });
    _storage = createPostgresStorage(pool);
  } else {
    _storage = sqliteStorage;
  }
  _initialized = true;
  return _storage;
}

/** Close the active backend (used by tests / CLI exit). */
export async function closeStorage() {
  if (_storage) { await _storage.close(); }
  _storage = null;
  _initialized = false;
}
