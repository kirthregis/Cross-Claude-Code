/**
 * Persistence facade. All storage functions are now async and delegate to the
 * active backend from `./storage` — SQLite locally, Postgres in production
 * (when DATABASE_URL is set). Keeping the same exported names means callers
 * only need to `await` them.
 */

import { getStorage, closeStorage } from "./storage";
import type { Gig, DealStage } from "./types";
import type { DeferredEntry, Feedback } from "./storage/types";

export { closeStorage as closeDb };

/** Re-exported for callers that need to pick the backend explicitly. */
export { getStorage, usesPostgres, setStorage } from "./storage";

export async function upsertGig(g: Gig): Promise<{ inserted: boolean }> {
  return (await getStorage()).upsertGig(g);
}

export async function listGigs(opts: { stage?: DealStage; minScore?: number; limit?: number } = {}): Promise<Gig[]> {
  return (await getStorage()).listGigs(opts);
}

export async function getGig(id: string): Promise<Gig | null> {
  return (await getStorage()).getGig(id);
}

export async function setStage(id: string, stage: DealStage): Promise<Gig | null> {
  return (await getStorage()).setStage(id, stage);
}

export async function logAlert(gigId: string, tier: string, channel: string, ok: boolean, detail?: string): Promise<void> {
  return (await getStorage()).logAlert(gigId, tier, channel, ok, detail);
}

export async function alreadyAlerted(gigId: string): Promise<boolean> {
  return (await getStorage()).alreadyAlerted(gigId);
}

export async function deferAlert(gigId: string, tier: string): Promise<void> {
  return (await getStorage()).deferAlert(gigId, tier);
}

export async function pendingDeferred(): Promise<DeferredEntry[]> {
  return (await getStorage()).pendingDeferred();
}

export async function markDeferredReleased(gigIds: string[]): Promise<void> {
  return (await getStorage()).markDeferredReleased(gigIds);
}

export async function recordSweep(found: number, newGigs: number, errors: string[]): Promise<void> {
  return (await getStorage()).recordSweep(found, newGigs, errors);
}

export async function stats() {
  return (await getStorage()).stats();
}

export async function addFeedback(f: Feedback): Promise<void> {
  return (await getStorage()).addFeedback(f);
}

export async function listFeedback(): Promise<Feedback[]> {
  return (await getStorage()).listFeedback();
}

export async function setFeedbackStatus(id: string, status: Feedback["status"]): Promise<boolean> {
  return (await getStorage()).setFeedbackStatus(id, status);
}
