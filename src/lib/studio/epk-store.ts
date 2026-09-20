/**
 * EMY Studio — EPK (Electronic Press Kit) storage.
 *
 * The artist uploads her own EPK file (PDF/text/image) and portrait; they're
 * stored on-device (IndexedDB) so she can view, download and replace them
 * anytime. Nothing about her press kit is hardcoded — her real EPK is the
 * file she uploads.
 */

export interface EpkFileInfo {
  name: string;
  sizeBytes: number;
  type: string;
  addedAt: number;
}

export type EpkFileKind = "pdf" | "portrait" | "techRider";

export interface EpkState {
  pdf: EpkFileInfo | null;
  portrait: EpkFileInfo | null;
  techRider: EpkFileInfo | null;
  notes: string;
}

const META_KEY = "emy-studio-epk-meta-v1";
const NOTES_KEY = "emy-studio-epk-notes-v1";

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return resolve(null);
    const req = window.indexedDB.open("emy-studio-epk", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) db.createObjectStore("files");
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

type MetaShape = { pdf: EpkFileInfo | null; portrait: EpkFileInfo | null; techRider: EpkFileInfo | null };

function readMeta(): MetaShape {
  if (typeof window === "undefined") return { pdf: null, portrait: null, techRider: null };
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return { pdf: null, portrait: null, techRider: null };
    const p = JSON.parse(raw) as Partial<MetaShape>;
    return { pdf: p.pdf ?? null, portrait: p.portrait ?? null, techRider: p.techRider ?? null };
  } catch {
    return { pdf: null, portrait: null, techRider: null };
  }
}

function writeMeta(meta: MetaShape): void {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* noop */
  }
}

export function loadEpkNotes(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NOTES_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveEpkNotes(notes: string): void {
  try {
    window.localStorage.setItem(NOTES_KEY, notes);
  } catch {
    /* noop */
  }
}

/** Save an uploaded or generated file for the given slot. Returns the new state. */
export async function saveEpkFile(file: File, kind: EpkFileKind): Promise<EpkState> {
  const info: EpkFileInfo = { name: file.name, sizeBytes: file.size, type: file.type || "application/octet-stream", addedAt: Date.now() };
  const db = await idb();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(["files", "meta"], "readwrite");
      tx.objectStore("files").put(file, kind);
      tx.objectStore("meta").put(JSON.stringify(info), kind);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  const m = readMeta();
  writeMeta({ ...m, [kind]: info });
  return getEpkState();
}

export async function getEpkBlob(kind: EpkFileKind): Promise<Blob | null> {
  const db = await idb();
  if (!db) return null;
  return new Promise((resolve) => {
    const req = db.transaction("files", "readonly").objectStore("files").get(kind);
    req.onsuccess = () => resolve((req.result as Blob) ?? null);
    req.onerror = () => resolve(null);
  });
}

export async function getEpkState(): Promise<EpkState> {
  const m = readMeta();
  return { pdf: m.pdf, portrait: m.portrait, techRider: m.techRider, notes: loadEpkNotes() };
}

export async function getEpkPortraitDataUrl(): Promise<string | null> {
  const blob = await getEpkBlob("portrait");
  if (!blob) return null;
  return await new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(blob);
  });
}

export async function removeEpkFile(kind: EpkFileKind): Promise<void> {
  const db = await idb();
  if (db) {
    await new Promise<void>((resolve) => {
      const tx = db.transaction(["files", "meta"], "readwrite");
      tx.objectStore("files").delete(kind);
      tx.objectStore("meta").delete(kind);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
  const m = readMeta();
  writeMeta({ ...m, [kind]: null });
}
