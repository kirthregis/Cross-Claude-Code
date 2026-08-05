import { Gig, GigStage, RevenueStats } from "./types";

const GIG_KEY = "emy-gigs-db";
const SWEEP_KEY = "emy-sweep-log";
const ALERT_KEY = "emy-alert-log";
const DEFER_KEY = "emy-defer-log";

// ── Gig CRUD ─────────────────────────────────────────────────

export function getGigs(): Gig[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(GIG_KEY) || "[]");
  } catch { return []; }
}

export function saveGigs(gigs: Gig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(GIG_KEY, JSON.stringify(gigs));
}

export function getGig(id: string): Gig | undefined {
  return getGigs().find((g) => g.id === id);
}

export function listGigs(): Gig[] {
  return getGigs();
}

export function upsertGig(gig: Gig) {
  const gigs = getGigs();
  const exists = gigs.find(
    (g) => g.externalId && g.externalId === gig.externalId
  );
  if (exists) return { inserted: false };
  gigs.unshift(gig);
  saveGigs(gigs.slice(0, 500));
  return { inserted: true };
}

export function updateGigStage(id: string, stage: GigStage, data?: Partial<Gig>) {
  const gigs = getGigs();
  const idx = gigs.findIndex((g) => g.id === id);
  if (idx === -1) return;
  gigs[idx] = { ...gigs[idx], stage, ...data };
  saveGigs(gigs);
}

export function setStage(id: string, stage: GigStage) {
  updateGigStage(id, stage);
}

export function stats() {
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
    { totalEarned: 0, totalCommission: 0, pendingAed: 0, paidAed: 0, gigCount: 0 }
  );
}

// ── Alert Logging ─────────────────────────────────────────────

export function alreadyAlerted(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const log: string[] = JSON.parse(localStorage.getItem(ALERT_KEY) || "[]");
    return log.includes(id);
  } catch { return false; }
}

export function logAlert(id: string) {
  if (typeof window === "undefined") return;
  try {
    const log: string[] = JSON.parse(localStorage.getItem(ALERT_KEY) || "[]");
    if (!log.includes(id)) log.push(id);
    localStorage.setItem(ALERT_KEY, JSON.stringify(log.slice(-500)));
  } catch {}
}

// ── Deferred Alerts (quiet hours) ────────────────────────────

export interface DeferredAlert {
  id: string;
  gigId: string;
  released: boolean;
  createdAt: string;
}

export function deferAlert(gigId: string) {
  if (typeof window === "undefined") return;
  try {
    const log: DeferredAlert[] = JSON.parse(
      localStorage.getItem(DEFER_KEY) || "[]"
    );
    log.push({
      id: `def-${Date.now()}`,
      gigId,
      released: false,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(DEFER_KEY, JSON.stringify(log));
  } catch {}
}

export function pendingDeferred(): DeferredAlert[] {
  if (typeof window === "undefined") return [];
  try {
    const log: DeferredAlert[] = JSON.parse(
      localStorage.getItem(DEFER_KEY) || "[]"
    );
    return log.filter((d) => !d.released);
  } catch { return []; }
}

export function markDeferredReleased(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    const log: DeferredAlert[] = JSON.parse(
      localStorage.getItem(DEFER_KEY) || "[]"
    );
    const updated = log.map((d) =>
      ids.includes(d.id) ? { ...d, released: true } : d
    );
    localStorage.setItem(DEFER_KEY, JSON.stringify(updated));
  } catch {}
}

// ── Feedback ──────────────────────────────────────────────────

const FEEDBACK_KEY = "emy-studio-feedback";

export interface StudioFeedback {
  id: string;
  message: string;
  status: "open" | "done";
  createdAt: string;
}

export function addStudioFeedback(message: string): StudioFeedback {
  const items: StudioFeedback[] = JSON.parse(
    localStorage.getItem(FEEDBACK_KEY) || "[]"
  );
  const item: StudioFeedback = {
    id: `fb-${Date.now()}`,
    message,
    status: "open",
    createdAt: new Date().toISOString(),
  };
  items.unshift(item);
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items.slice(0, 200)));
  return item;
}

export function listStudioFeedback(): StudioFeedback[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
  } catch { return []; }
}

export function allStudioFeedback(): StudioFeedback[] {
  return listStudioFeedback();
}

export function studioFeedbackStats() {
  const items = listStudioFeedback();
  return {
    total: items.length,
    open: items.filter((i) => i.status === "open").length,
    done: items.filter((i) => i.status === "done").length,
  };
}

export function setStudioFeedbackStatus(id: string, status: "open" | "done") {
  const items = listStudioFeedback();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return;
  items[idx].status = status;
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(items));
}

// ── Sweep Log ─────────────────────────────────────────────────

export function recordSweep(found: number, news: number, errors: string[]) {
  if (typeof window === "undefined") return;
  try {
    const log = JSON.parse(localStorage.getItem(SWEEP_KEY) || "[]");
    log.unshift({ at: new Date().toISOString(), found, news, errors });
    localStorage.setItem(SWEEP_KEY, JSON.stringify(log.slice(0, 50)));
  } catch {}
}

// ── Simple key-value store (used by profile-store) ────────────

export const db = {
  get(key: string) {
    if (typeof window === "undefined") return null;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  },
  set(key: string, value: unknown) {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
  delete(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};