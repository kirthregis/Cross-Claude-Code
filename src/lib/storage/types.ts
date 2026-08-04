/**
 * Storage abstraction. The whole app talks to this interface, which has two
 * backends: SQLite (local, zero-config, default) and Postgres (permanent,
 * used when DATABASE_URL is set — i.e. on Vercel/Neon/Supabase).
 *
 * Making this async is what lets us use a durable Postgres store instead of an
 * ephemeral SQLite file, so data survives redeploys.
 */

import type { Gig, DealStage } from "../types";
import type { ArtistProfile } from "../artist";
import type { EngineSettings } from "../engine-settings";
import type { MediaItem } from "../settings-store";

export interface DeferredEntry {
  gig: Gig;
  tier: string;
  queuedAt: string;
}

/** A suggestion Emy submits from the app ("Suggest an improvement"). */
export interface Feedback {
  id: string;
  createdAt: string;
  /** The idea, in her words. */
  message: string;
  /** Optional category: "hunting" | "alerts" | "pricing" | "contracts" | "look" | "other". */
  category?: string;
  /** Optional contact / context she wants you to have. */
  contact?: string;
  status: "new" | "in_progress" | "done";
}

export interface Storage {
  // Gigs
  upsertGig(g: Gig): Promise<{ inserted: boolean }>;
  listGigs(opts?: { stage?: DealStage; minScore?: number; limit?: number }): Promise<Gig[]>;
  getGig(id: string): Promise<Gig | null>;
  setStage(id: string, stage: DealStage): Promise<Gig | null>;
  stats(): Promise<{ total: number; byStage: { stage: string; c: number }[]; lastSweep?: { finished_at: string; found: number; new_gigs: number } }>;

  // Alerts
  logAlert(gigId: string, tier: string, channel: string, ok: boolean, detail?: string): Promise<void>;
  alreadyAlerted(gigId: string): Promise<boolean>;

  // Deferred (quiet-hours) queue
  deferAlert(gigId: string, tier: string): Promise<void>;
  pendingDeferred(): Promise<DeferredEntry[]>;
  markDeferredReleased(gigIds: string[]): Promise<void>;

  // Sweeps
  recordSweep(found: number, newGigs: number, errors: string[]): Promise<void>;

  // Profile / settings / media
  getProfile(): Promise<ArtistProfile>;
  saveProfile(patch: Partial<ArtistProfile>): Promise<ArtistProfile>;
  getSettings(): Promise<EngineSettings>;
  saveSettings(patch: Partial<EngineSettings>): Promise<EngineSettings>;
  listMedia(): Promise<MediaItem[]>;
  addMedia(opts: { id: string; name: string; kind: MediaItem["kind"]; mime: string; size: number; tags?: string[] }): Promise<MediaItem>;
  getMediaFile(id: string): Promise<{ item: MediaItem; buffer: Buffer } | null>;
  deleteMedia(id: string): Promise<boolean>;

  // Feedback ("Suggest an improvement")
  addFeedback(f: Feedback): Promise<void>;
  listFeedback(): Promise<Feedback[]>;
  setFeedbackStatus(id: string, status: Feedback["status"]): Promise<boolean>;

  // Close / reset (tests)
  close(): Promise<void>;
}
