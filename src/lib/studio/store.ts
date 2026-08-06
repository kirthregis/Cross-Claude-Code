"use client";
import { useSyncExternalStore } from "react";
import { newId } from "./id";
import { DEFAULT_SETTINGS } from "./types";

const PROJECTS_KEY = "emy-studio-projects-v1";
const SETTINGS_KEY = "emy-studio-settings-v1";

let settingsCache = null;
let projectsCache = null;

function readRaw(key) {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function loadSettings() {
  const raw = readRaw(SETTINGS_KEY);
  if (settingsCache && settingsCache.raw === raw) return settingsCache.s;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    const s = { ...DEFAULT_SETTINGS, ...parsed };
    settingsCache = { raw, s };
    return s;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function loadProjects() {
  const raw = readRaw(PROJECTS_KEY);
  if (projectsCache && projectsCache.raw === raw) return projectsCache.list;
  try {
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) list = [];
    list.sort((a, b) => (b.meta?.updatedAt || 0) - (a.meta?.updatedAt || 0));
    projectsCache = { raw, list };
    return list;
  } catch {
    return [];
  }
}

export function saveSettings(s) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("storage"));
}

export function saveProjects(list) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

export function getProject(id) {
  return loadProjects().find((p) => p.meta?.id === id);
}

export function upsertProject(p) {
  const list = loadProjects();
  const i = list.findIndex((x) => x.meta?.id === p.meta?.id);
  if (p.meta) p.meta.updatedAt = Date.now();
  if (i >= 0) list[i] = p;
  else list.unshift(p);
  saveProjects(list);
}

export function createProject(partial) {
  const now = Date.now();
  return {
    meta: { id: newId(), name: partial.name, kind: partial.kind, genre: partial.genre, mood: partial.mood, createdAt: now, updatedAt: now, stage: "draft", mastered: false, artworkDone: false, releaseDone: false },
    masterParams: { targetLufs: -14, lowGainDb: 0, midGainDb: 0, highGainDb: 0, rumbleFilter: true, compThreshold: -16, compRatio: 2.2, limiterDrive: 0.65, ceilingDb: -1 },
    chatHistory: [],
  };
}

export function deleteProject(id) {
  saveProjects(loadProjects().filter((p) => p.meta?.id !== id));
}

function subscribe(l) {
  window.addEventListener("storage", l);
  return () => window.removeEventListener("storage", l);
}

export function useProjects() {
  return useSyncExternalStore(subscribe, loadProjects, () => []);
}

export function useSettings() {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}