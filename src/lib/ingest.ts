/**
 * The sweep: pull every source, normalise, dedupe, score, alert.
 * This is the heartbeat of the app. Run it on a cron every 60 seconds.
 */

import { nanoid } from "nanoid";
import { ALL_SOURCES } from "./sources";
import { normalise } from "./extract";
import { scoreGig } from "./score";
import { alert, sendMorningDigest, isDigestTime } from "./notify";
import { upsertGig, alreadyAlerted, recordSweep } from "./db";
import type { Gig, RawLead } from "./types";
import { registerProfileLoader } from "./profile-store";
import { registerSettingsLoader, getSettings } from "./settings-store";

let loadersReady: Promise<void> | null = null;
async function ensureLoaders() {
  if (!loadersReady) {
    loadersReady = Promise.all([registerProfileLoader(), registerSettingsLoader()]).then(() => undefined);
  }
  return loadersReady;
}

export interface SweepResult {
  found: number;
  newGigs: number;
  alerted: number;
  /** Gigs released from the overnight queue in a morning digest. */
  digested?: number;
  errors: string[];
  gigs: Gig[];
}

export async function processLeads(leads: RawLead[]): Promise<SweepResult> {
  await ensureLoaders();
  const errors: string[] = [];
  const fresh: Gig[] = [];

  // User blocklist applies to every source (see /customize → Hunting).
  const blocklist = (await getSettings()).hunting.blocklist.map((b) => b.toLowerCase().trim()).filter(Boolean);

  for (const lead of leads) {
    try {
      const hay = `${lead.title} ${lead.body}`.toLowerCase();
      if (blocklist.some((b) => hay.includes(b))) continue;
      const base = normalise(lead);
      const s = scoreGig(base);
      const gig: Gig = { ...base, id: nanoid(10), score: s.score, stage: "new" };
      const { inserted } = await upsertGig(gig);
      if (inserted) fresh.push(gig);
    } catch (e) {
      errors.push(`normalise failed for "${lead.title}": ${e}`);
    }
  }

  let alerted = 0;
  for (const g of fresh) {
    if (await alreadyAlerted(g.id)) continue;
    const s = scoreGig(g);
    try {
      const r = await alert(g, s);
      if (r.sent.length) alerted++;
    } catch (e) {
      errors.push(`alert failed for ${g.id}: ${e}`);
    }
  }

  return { found: leads.length, newGigs: fresh.length, alerted, errors, gigs: fresh };
}

export async function sweep(): Promise<SweepResult> {
  const errors: string[] = [];
  const leads: RawLead[] = [];

  // Run every configured source in parallel — one slow feed must not delay the rest.
  const results = await Promise.allSettled(
    ALL_SOURCES.filter((s) => s.configured()).map(async (s) => ({ id: s.id, leads: await s.fetch() }))
  );
  for (const r of results) {
    if (r.status === "fulfilled") leads.push(...r.value.leads);
    else errors.push(String(r.reason));
  }

  const out = await processLeads(leads);
  out.errors.push(...errors);

  // Release anything held overnight, once quiet hours are over.
  if (isDigestTime()) {
    try {
      const d = await sendMorningDigest();
      if (d.sent) out.digested = d.count;
    } catch (e) {
      out.errors.push(`digest failed: ${e}`);
    }
  }

  await recordSweep(out.found, out.newGigs, out.errors);
  return out;
}
