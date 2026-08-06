import type { Gig, GigStage, RevenueStats } from "./types";

const GIG_KEY = "emy-gigs-db";
const SWEEP_KEY = "emy-sweep-log";
const ALERT_KEY = "emy-alert-log";
const DEFER_KEY = "emy-defer-log";
const FEEDBACK_KEY = "emy-studio-feedback";
const SETLIST_KEY = "emy-setlists";

// In-memory / file fallback for server or tests where localStorage is absent
const memoryStore = new Map<string, string>();

function getDbStore(): { getItem: (k: string) => string | null; setItem: (k: string, v: string) => void; removeItem: (k: string) => void; clear: () => void } {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  // When running in Node with DB_PATH or tests:
  const prefix = process.env.DB_PATH ? `${process.env.DB_PATH}:` : "";
  return {
    getItem: (k: string) => memoryStore.get(prefix + k) ?? null,
    setItem: (k: string, v: string) => { memoryStore.set(prefix + k, v); },
    removeItem: (k: string) => { memoryStore.delete(prefix + k); },
    clear: () => {
      if (prefix) {
        for (const k of Array.from(memoryStore.keys())) {
          if (k.startsWith(prefix)) memoryStore.delete(k);
        }
      } else {
        memoryStore.clear();
      }
    },
  };
}

export function closeDb(): void {
  getDbStore().clear();
}

// ── Gig CRUD ─────────────────────────────────────────────────

export function getGigs(): Gig[] {
  try {
    const raw = getDbStore().getItem(GIG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGigs(gigs: Gig[]): void {
  try {
    getDbStore().setItem(GIG_KEY, JSON.stringify(gigs));
  } catch {
    /* noop */
  }
}

export function getGig(id: string): Gig | undefined {
  return getGigs().find((g) => g.id === id);
}

export function listGigs(): Gig[] {
  return getGigs();
}

export function upsertGig(gig: Gig): { inserted: boolean } {
  const gigs = getGigs();
  const exists = gigs.find((g) => g.id === gig.id || (gig.externalId && g.externalId === gig.externalId));
  if (exists) {
    const idx = gigs.findIndex((g) => g.id === exists.id);
    gigs[idx] = { ...exists, ...gig };
    saveGigs(gigs);
    return { inserted: false };
  }
  gigs.unshift(gig);
  saveGigs(gigs.slice(0, 500));
  return { inserted: true };
}

export function updateGigStage(id: string, stage: GigStage, data?: Partial<Gig>): void {
  const gigs = getGigs();
  const idx = gigs.findIndex((g) => g.id === id);
  if (idx === -1) return;
  gigs[idx] = { ...gigs[idx], stage, ...data };
  saveGigs(gigs);
}

export function setStage(id: string, stage: GigStage): void {
  updateGigStage(id, stage);
}

export function stats(): RevenueStats {
  return getRevenueStats();
}

export function getRevenueStats(): RevenueStats {
  const gigs = getGigs();
  return gigs.reduce(
    (acc, g) => {
      const fee = g.feeAed || 0;
      const comm = g.commissionAed || 0;
      acc.gigCount++;
      if (g.stage === "paid") {
        acc.totalEarned += fee;
        acc.totalCommission += comm;
        acc.paidAed += fee;
      } else if (g.stage === "confirmed") {
        acc.pendingAed += fee;
      }
      return acc;
    },
    { totalEarned: 0, totalCommission: 0, pendingAed: 0, paidAed: 0, gigCount: 0 },
  );
}

// ── Alert Logging ─────────────────────────────────────────────

export function alreadyAlerted(id: string): boolean {
  try {
    const log: string[] = JSON.parse(getDbStore().getItem(ALERT_KEY) || "[]");
    return log.includes(id);
  } catch {
    return false;
  }
}

export function logAlert(id: string): void {
  try {
    const log: string[] = JSON.parse(getDbStore().getItem(ALERT_KEY) || "[]");
    if (!log.includes(id)) log.push(id);
    getDbStore().setItem(ALERT_KEY, JSON.stringify(log.slice(-500)));
  } catch {
    /* noop */
  }
}

// ── Deferred Alerts (quiet hours) ────────────────────────────

export interface DeferredAlert {
  id: string;
  gigId: string;
  released: boolean;
  createdAt: string;
  gig: Gig;
}

export function deferAlert(gigId: string): void {
  try {
    const raw = getDbStore().getItem(DEFER_KEY);
    const log: Array<Omit<DeferredAlert, "gig">> = raw ? JSON.parse(raw) : [];
    // Do not double-queue if already pending
    if (log.some((d) => d.gigId === gigId && !d.released)) return;
    log.push({
      id: `def-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      gigId,
      released: false,
      createdAt: new Date().toISOString(),
    });
    getDbStore().setItem(DEFER_KEY, JSON.stringify(log));
  } catch {
    /* noop */
  }
}

export function pendingDeferred(): DeferredAlert[] {
  try {
    const raw = getDbStore().getItem(DEFER_KEY);
    const log: Array<Omit<DeferredAlert, "gig">> = raw ? JSON.parse(raw) : [];
    const unreleased = log.filter((d) => !d.released);
    const gigs = getGigs();
    const result: DeferredAlert[] = [];
    for (const item of unreleased) {
      const gig = gigs.find((g) => g.id === item.gigId) || {
        id: item.gigId,
        sourceKind: "manual",
        sourceName: "unknown",
        title: "Deferred Gig",
        body: "",
        postedAt: item.createdAt,
        score: 50,
        stage: "new",
      };
      result.push({ ...item, gig });
    }
    // Rank by score descending
    return result.sort((a, b) => (b.gig.score ?? 0) - (a.gig.score ?? 0));
  } catch {
    return [];
  }
}

export function markDeferredReleased(ids: string[]): void {
  try {
    const raw = getDbStore().getItem(DEFER_KEY);
    const log: Array<Omit<DeferredAlert, "gig">> = raw ? JSON.parse(raw) : [];
    const updated = log.map((d) => (ids.includes(d.id) ? { ...d, released: true } : d));
    getDbStore().setItem(DEFER_KEY, JSON.stringify(updated));
  } catch {
    /* noop */
  }
}

// ── Feedback ──────────────────────────────────────────────────

export interface StudioFeedback {
  id: string;
  clientId?: string;
  text: string;
  message?: string;
  category?: string;
  priority?: string;
  plan?: string;
  status: "new" | "open" | "planned" | "done" | "rejected";
  createdAt: string;
}

export function addStudioFeedback(
  input: string | Partial<StudioFeedback>,
): StudioFeedback {
  const store = getDbStore();
  const items: StudioFeedback[] = JSON.parse(store.getItem(FEEDBACK_KEY) || "[]");
  const now = new Date().toISOString();
  let item: StudioFeedback;

  if (typeof input === "string") {
    item = {
      id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      text: input,
      message: input,
      status: "new",
      createdAt: now,
    };
  } else {
    item = {
      id: input.id || `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      clientId: input.clientId,
      text: input.text || input.message || "",
      message: input.message || input.text || "",
      category: input.category || "other",
      priority: input.priority || "medium",
      plan: input.plan,
      status: input.status || "new",
      createdAt: input.createdAt || now,
    };
  }

  items.unshift(item);
  store.setItem(FEEDBACK_KEY, JSON.stringify(items.slice(0, 500)));
  return item;
}

export function getStudioFeedback(id: string): StudioFeedback | undefined {
  return allStudioFeedback().find((i) => i.id === id);
}

export function listStudioFeedback(clientId?: string): StudioFeedback[] {
  const all = allStudioFeedback();
  if (!clientId) return all;
  return all.filter((i) => i.clientId === clientId);
}

export function allStudioFeedback(): StudioFeedback[] {
  try {
    return JSON.parse(getDbStore().getItem(FEEDBACK_KEY) || "[]");
  } catch {
    return [];
  }
}

export function studioFeedbackStats(): {
  total: number;
  open: number;
  done: number;
  byStatus: Record<string, number>;
} {
  const items = allStudioFeedback();
  const byStatus: Record<string, number> = { new: 0, open: 0, planned: 0, done: 0, rejected: 0 };
  for (const item of items) {
    const s = item.status || "new";
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  return {
    total: items.length,
    open: (byStatus.new || 0) + (byStatus.open || 0),
    done: byStatus.done || 0,
    byStatus,
  };
}

export function setStudioFeedbackStatus(
  id: string,
  status: "new" | "open" | "planned" | "done" | "rejected",
): StudioFeedback | undefined {
  const store = getDbStore();
  const items = allStudioFeedback();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return undefined;
  items[idx].status = status;
  store.setItem(FEEDBACK_KEY, JSON.stringify(items));
  return items[idx];
}

// ── Sweep Log ─────────────────────────────────────────────────

export function recordSweep(found: number, news: number, errors: string[]): void {
  try {
    const store = getDbStore();
    const log = JSON.parse(store.getItem(SWEEP_KEY) || "[]");
    log.unshift({ at: new Date().toISOString(), found, news, errors });
    store.setItem(SWEEP_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {
    /* noop */
  }
}

// ── Simple key-value store (used by profile-store) ────────────

export const db = {
  get(key: string): unknown {
    try {
      const val = getDbStore().getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown): void {
    try {
      getDbStore().setItem(key, JSON.stringify(value));
    } catch {
      /* noop */
    }
  },
  delete(key: string): void {
    try {
      getDbStore().removeItem(key);
    } catch {
      /* noop */
    }
  },
};

// ── Setlist Storage ──────────────────────────────────────────────────────

export interface SetlistTrack {
  id: string;
  name: string;
  artist: string;
  bpm?: number;
  key?: string;
  durationSec?: number;
  notes?: string;
}

export interface Setlist {
  id: string;
  gigName: string;
  venueName: string;
  date: string;
  tracks: SetlistTrack[];
  createdAt: string;
  updatedAt: string;
}

export function getSetlists(): Setlist[] {
  try {
    return JSON.parse(getDbStore().getItem(SETLIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveSetlists(setlists: Setlist[]): void {
  try {
    getDbStore().setItem(SETLIST_KEY, JSON.stringify(setlists));
  } catch {
    /* noop */
  }
}

export function upsertSetlist(s: Setlist): void {
  const all = getSetlists();
  const idx = all.findIndex((x) => x.id === s.id);
  s.updatedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = s;
  else all.unshift(s);
  saveSetlists(all);
}

export function deleteSetlist(id: string): void {
  saveSetlists(getSetlists().filter((s) => s.id !== id));
}
