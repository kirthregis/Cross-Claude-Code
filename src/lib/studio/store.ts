/**
 * EMY Studio — persistence layer.
 *
 * STORAGE MAP (all on-device, nothing uploaded):
 *
 * localStorage:
 *   emy-studio-projects-v1  → Project[] (metadata, master params/results, release, tracklist, collabs, links)
 *   emy-studio-settings-v1  → StudioSettings (artist name, keys, audio device, theme)
 *
 * IndexedDB "emy-studio" → "blobs" object store:
 *   emy-studio-art:{id}     → Cover artwork dataUrl (3000×3000 JPEG)
 *   emy-master:{id}         → Mastered WAV blob (24-bit/48kHz) — auto-saved after mastering
 *   emy-export:{id}:{bits}bit → Exported WAV blob — auto-saved on export
 *
 * IndexedDB "emy-studio-library" (see library-store.ts):
 *   tracks store            → Audio file blobs (imported + mastered + exported)
 *   meta store              → Track metadata
 *
 * IndexedDB "emy-studio-epk" (see epk-store.ts):
 *   files store             → EPK PDF + portrait photo blobs
 *
 * RAM only (not persisted):
 *   Raw uploaded mix AudioBuffer — too large (~700MB for 66min WAV) for IndexedDB
 *   After mastering, the mastered WAV IS persisted to IndexedDB automatically
 *
 * Audio playback routes through user-selected device via AudioContext.setSinkId()
 */

"use client";

import { useSyncExternalStore } from "react";
import type { Project, StudioSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { newId } from "./id";

const PROJECTS_KEY = "emy-studio-projects-v1";
const SETTINGS_KEY = "emy-studio-settings-v1";
const ART_KEY = (id: string) => `emy-studio-art:${id}`;

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

/** Raw-string read of a localStorage key. Returns null on server / absent. */
function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

// ---- settings ----

let settingsCache: { raw: string | null; s: StudioSettings } | null = null;

export function loadSettings(): StudioSettings {
  const raw = readRaw(SETTINGS_KEY);
  // Same raw value -> return the SAME object reference (React requires stable
  // snapshots; a fresh object each call caused an infinite re-render loop).
  if (settingsCache && settingsCache.raw === raw) return settingsCache.s;
  let parsed: Partial<StudioSettings> = {};
  if (raw) {
    try {
      parsed = JSON.parse(raw) as Partial<StudioSettings>;
    } catch {
      parsed = {};
    }
  }
  const s: StudioSettings = { ...DEFAULT_SETTINGS, ...parsed };
  settingsCache = { raw, s };
  return s;
}

export function saveSettings(s: StudioSettings): void {
  writeJSON(SETTINGS_KEY, s);
  emit();
}

// ---- projects ----

let projectsCache: { raw: string | null; list: Project[] } | null = null;

export function loadProjects(): Project[] {
  const raw = readRaw(PROJECTS_KEY);
  if (projectsCache && projectsCache.raw === raw) return projectsCache.list;
  let list: Project[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw) as Project[];
    } catch {
      list = [];
    }
  }
  list = list.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
  projectsCache = { raw, list };
  return list;
}

export function saveProjects(list: Project[]): void {
  writeJSON(PROJECTS_KEY, list);
  emit();
}

export function getProject(id: string): Project | undefined {
  return loadProjects().find((p) => p.meta.id === id);
}

export function upsertProject(p: Project): void {
  const list = loadProjects();
  const i = list.findIndex((x) => x.meta.id === p.meta.id);
  p.meta.updatedAt = Date.now();
  if (i >= 0) list[i] = p;
  else list.unshift(p);
  saveProjects(list);
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p) => p.meta.id !== id));
  deleteBlob(ART_KEY(id));
}

export function createProject(partial: { name: string; kind: "mix" | "track"; genre: string; mood: string }): Project {
  const now = Date.now();
  const project: Project = {
    meta: {
      id: newId(),
      name: partial.name,
      kind: partial.kind,
      genre: partial.genre,
      mood: partial.mood,
      createdAt: now,
      updatedAt: now,
      stage: "draft",
      mastered: false,
      artworkDone: false,
      releaseDone: false,
    },
    masterParams: {
      targetLufs: -14,
      lowGainDb: 0,
      midGainDb: 0,
      highGainDb: 0,
      rumbleFilter: true,
      compThreshold: -16,
      compRatio: 2.2,
      limiterDrive: 0.65,
      ceilingDb: -1,
    },
    chatHistory: [],
  };
  upsertProject(project);
  return project;
}

// ---- IndexedDB blobs (artwork, in case of large exports) ----

function idb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return resolve(null);
    const req = window.indexedDB.open("emy-studio", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("blobs");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function putBlob(key: string, value: Blob | string): Promise<void> {
  const db = await idb();
  if (!db) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("blobs", "readwrite");
      tx.objectStore("blobs").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn("blob save failed", e);
  }
}

export async function getBlob(key: string): Promise<Blob | string | null> {
  const db = await idb();
  if (!db) return null;
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("blobs", "readonly");
      const req = tx.objectStore("blobs").get(key);
      req.onsuccess = () => resolve((req.result as Blob | string) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteBlob(key: string): Promise<void> {
  const db = await idb();
  if (!db) return;
  try {
    await new Promise<void>((resolve) => {
      const tx = db.transaction("blobs", "readwrite");
      tx.objectStore("blobs").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* noop */
  }
}

export async function saveArtwork(projectId: string, dataUrl: string): Promise<void> {
  await putBlob(ART_KEY(projectId), dataUrl);
}

export async function loadArtwork(projectId: string): Promise<string | null> {
  const v = await getBlob(ART_KEY(projectId));
  return typeof v === "string" && v ? v : null;
}

// ---- reactive store for React ----

const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

// Stable server snapshots: a fresh []/object each call also trips React's
// "getServerSnapshot should be cached" guard during hydration.
const EMPTY_PROJECTS: Project[] = [];

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, loadProjects, () => EMPTY_PROJECTS);
}

export function useSettings(): StudioSettings {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}
