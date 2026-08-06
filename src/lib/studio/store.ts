"use client";
import { useSyncExternalStore } from "react";
import { newId } from "./id";
import { DEFAULT_SETTINGS } from "./types";

const PROJECTS_KEY = "emy-studio-projects-v1";
const SETTINGS_KEY = "emy-studio-settings-v1";

// Module-level cache � same raw string = same object reference = no re-render
let settingsCache: { raw: string | null; s: any } | null = null;
let projectsCache: { raw: string | null; list: any[] } | null = null;

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function loadSettings(): any {
  const raw = readRaw(SETTINGS_KEY);
  if (settingsCache && settingsCache.raw === raw) return settingsCache.s;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad");
    const s = { ...DEFAULT_SETTINGS, ...parsed };
    settingsCache = { raw, s };
    return s;
  } catch {
    try { window.localStorage.removeItem(SETTINGS_KEY); } catch {}
    settingsCache = { raw: null, s: DEFAULT_SETTINGS };
    return DEFAULT_SETTINGS;
  }
}

export function loadProjects(): any[] {
  const raw = readRaw(PROJECTS_KEY);
  if (projectsCache && projectsCache.raw === raw) return projectsCache.list;
  try {
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) throw new Error("bad");
    list = list.filter((p: any) => p && p.meta && p.meta.id);
    list.sort((a: any, b: any) => (b.meta?.updatedAt || 0) - (a.meta?.updatedAt || 0));
    projectsCache = { raw, list };
    return list;
  } catch {
    try { window.localStorage.removeItem(PROJECTS_KEY); } catch {}
    projectsCache = { raw: null, list: [] };
    return [];
  }
}

// Internal listener set � NOT the storage event (avoids cross-tab loops)
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function saveSettings(s: any): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    settingsCache = null; // bust cache so next read picks up new value
  } catch {}
  emit();
}

export function saveProjects(list: any[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    projectsCache = null; // bust cache
  } catch {}
  emit();
}

export function getProject(id: string): any {
  return loadProjects().find((p: any) => p.meta?.id === id);
}

export function upsertProject(p: any): void {
  const list = loadProjects();
  const i = list.findIndex((x: any) => x.meta?.id === p.meta?.id);
  if (p.meta) p.meta.updatedAt = Date.now();
  if (i >= 0) list[i] = p; else list.unshift(p);
  saveProjects(list);
}

export function createProject(partial: any): any {
  const now = Date.now();
  return {
    meta: { id: newId(), name: partial.name, kind: partial.kind, genre: partial.genre, mood: partial.mood, createdAt: now, updatedAt: now, stage: "draft", mastered: false, artworkDone: false, releaseDone: false },
    masterParams: { targetLufs: -14, lowGainDb: 0, midGainDb: 0, highGainDb: 0, rumbleFilter: true, compThreshold: -16, compRatio: 2.2, limiterDrive: 0.65, ceilingDb: -1 },
    chatHistory: [],
  };
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p: any) => p.meta?.id !== id));
}

const EMPTY: any[] = [];
export function useProjects(): any[] {
  return useSyncExternalStore(subscribe, loadProjects, () => EMPTY);
}
export function useSettings(): any {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}
