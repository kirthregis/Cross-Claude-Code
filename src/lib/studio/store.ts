/**
 * EMY Studio — persistence.
 *
 * Project metadata + settings live in localStorage (survives restarts,
 * offline-first). Large blobs (artwork, exported masters) live in IndexedDB
 * keyed by project id; the audio file itself is re-imported from her machine
 * each session by design — a 66-minute mix in the browser is held in memory
 * while the project is open, not duplicated to disk.
 */

"use client";

import { useSyncExternalStore } from "react";
import type { Project, StudioSettings } from "./types";
import { DEFAULT_SETTINGS } from "./types";
import { newId } from "./id";

const PROJECTS_KEY = "emy-studio-projects-v1";
const SETTINGS_KEY = "emy-studio-settings-v1";
const ART_KEY = (id: string) => `emy-studio-art:${id}`;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage write failed", e);
  }
}

// ---- settings ----

export function loadSettings(): StudioSettings {
  return { ...DEFAULT_SETTINGS, ...readJSON<Partial<StudioSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(s: StudioSettings): void {
  writeJSON(SETTINGS_KEY, s);
  emit();
}

// ---- projects ----

export function loadProjects(): Project[] {
  const list = readJSON<Project[]>(PROJECTS_KEY, []);
  return list.sort((a, b) => b.meta.updatedAt - a.meta.updatedAt);
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
  return {
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

export function useProjects(): Project[] {
  return useSyncExternalStore(subscribe, loadProjects, () => []);
}

export function useSettings(): StudioSettings {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}
