/**
 * EMY Studio — music library.
 *
 * Tracks she imports live in IndexedDB (blobs) so they survive restarts and
 * work offline. Playback is on-device; nothing is uploaded anywhere.
 * (client-only module — never import from server code)
 */

export interface LibraryTrack {
  id: string;
  name: string;
  sizeBytes: number;
  type: string;
  durationSec: number | null;
  addedAt: number;
}

const DB_NAME = "emy-studio-library";
const STORE = "tracks";
const META_KEY = "meta";

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return resolve(null);
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function saveLibraryTrack(file: File): Promise<LibraryTrack> {
  const db = await idb();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const track: LibraryTrack = {
    id,
    name: file.name,
    sizeBytes: file.size,
    type: file.type || "audio/*",
    durationSec: null,
    addedAt: Date.now(),
  };
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction([STORE, "meta"], "readwrite");
      tx.objectStore(STORE).put(file, id);
      tx.objectStore("meta").put(JSON.stringify(track), id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  // Try to read duration from the audio element (best-effort).
  try {
    const url = URL.createObjectURL(file);
    track.durationSec = await new Promise<number | null>((resolve) => {
      const a = document.createElement("audio");
      a.preload = "metadata";
      a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : null);
      a.onerror = () => resolve(null);
      a.src = url;
      setTimeout(() => resolve(null), 4000);
    });
    URL.revokeObjectURL(url);
  } catch {
    /* noop */
  }
  return track;
}

export async function listLibraryTracks(): Promise<LibraryTrack[]> {
  const db = await idb();
  if (!db) return [];
  const keys: string[] = await new Promise((resolve) => {
    const req = db.transaction("meta", "readonly").objectStore("meta").getAllKeys();
    req.onsuccess = () => resolve((req.result as IDBValidKey[]).map(String).filter((k) => !k.startsWith("size-")));
    req.onerror = () => resolve([]);
  });
  const tracks: LibraryTrack[] = [];
  for (const k of keys) {
    const raw = await getMeta(k);
    if (!raw) continue;
    try {
      const t = JSON.parse(raw) as LibraryTrack;
      if (t && t.id && t.name) tracks.push(t);
    } catch {
      /* skip */
    }
  }
  return tracks.sort((a, b) => b.addedAt - a.addedAt);
}

async function getMeta(id: string): Promise<string | null> {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    const req = db.transaction("meta", "readonly").objectStore("meta").get(id);
    req.onsuccess = () => resolve((req.result as string) ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function getLibraryBlob(id: string): Promise<Blob | null> {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function deleteLibraryTrack(id: string): Promise<void> {
  const db = await idb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction([STORE, "meta"], "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.objectStore("meta").delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

export function isDirectoryPickerAvailable(): boolean {
  return typeof window !== "undefined" && "showDirectoryPicker" in window;
}

/** Add a whole folder of audio files (Chrome/Edge). Returns added count. */
export async function importDirectory(): Promise<number> {
  if (!isDirectoryPickerAvailable()) return 0;
  const w = window as unknown as {
    showDirectoryPicker: () => Promise<{ values: () => AsyncIterable<FileSystemFileHandle> }>;
  };
  const dir = await w.showDirectoryPicker();
  const AUDIO = /\.(mp3|wav|m4a|flac|aac|aiff?|ogg|opus)$/i;
  let count = 0;
  for await (const entry of dir.values()) {
    if (entry.kind !== "file") continue;
    const file = await entry.getFile();
    if (AUDIO.test(file.name)) {
      await saveLibraryTrack(file);
      count++;
    }
  }
  return count;
}
