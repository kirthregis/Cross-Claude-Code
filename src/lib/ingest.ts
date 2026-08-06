/**
 * The sweep: pull every source, normalise, dedupe, score, alert.
 * Runs on a cron every 60 seconds via /api/sweep.
 */

import { nanoid } from "nanoid";
import { ALL_SOURCES } from "./sources";
import { normalise } from "./extract";
import { scoreGig } from "./score";
import { alert, sendMorningDigest, isDigestTime } from "./notify";
import { upsertGig, alreadyAlerted, logAlert, recordSweep } from "./db";
import type { Gig, RawLead } from "./types";
import { registerProfileLoader } from "./profile-store";

registerProfileLoader();

export interface SweepResult {
  found: number;
  newGigs: number;
  alerted: number;
  digested?: number;
  errors: string[];
  sources: { id: string; found: number; errors: string[] }[];
  gigs: Gig[];
}

export async function processLeads(leads: RawLead[]): Promise<SweepResult> {
  const errors: string[] = [];
  const fresh: Gig[] = [];

  for (const lead of leads) {
    try {
      const base = normalise(lead);
      const s = scoreGig(base);
      if (s.tier === "suppress") continue; // skip low quality before storage
      const gig: Gig = { ...base, id: nanoid(10), score: s.score, stage: "new" };
      const { inserted } = upsertGig(gig);
      if (inserted) fresh.push(gig);
    } catch (e) {
      errors.push(`normalise failed for "${lead.title}": ${e}`);
    }
  }

  let alerted = 0;
  for (const g of fresh) {
    if (alreadyAlerted(g.id)) continue;
    const s = scoreGig(g);
    try {
      const r = await alert(g, s);
      // Always mark as alerted so we do not re-process on next sweep
      // even if no channels are configured
      logAlert(g.id);
      if (r.sent.length) alerted++;
    } catch (e) {
      errors.push(`alert failed for ${g.id}: ${e}`);
    }
  }

  return {
    found: leads.length,
    newGigs: fresh.length,
    alerted,
    errors,
    sources: [],
    gigs: fresh,
  };
}

export async function sweep(): Promise<SweepResult> {
  const errors: string[] = [];
  const leads: RawLead[] = [];
  const sourceStats: SweepResult["sources"] = [];

  const results = await Promise.allSettled(
    ALL_SOURCES.filter(s => s.configured()).map(async s => {
      const sourceLeads = await s.fetch();
      return { id: s.id, leads: sourceLeads, errors: [] as string[] };
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      leads.push(...r.value.leads);
      sourceStats.push({ id: r.value.id, found: r.value.leads.length, errors: [] });
    } else {
      errors.push(String(r.reason));
      sourceStats.push({ id: "unknown", found: 0, errors: [String(r.reason)] });
    }
  }

  const out = await processLeads(leads);
  out.errors.push(...errors);
  out.sources = sourceStats;

  if (isDigestTime()) {
    try {
      const d = await sendMorningDigest();
      if (d.sent) out.digested = d.count;
    } catch (e) {
      out.errors.push(`digest failed: ${e}`);
    }
  }

  recordSweep(out.found, out.newGigs, out.errors);
  return out;
}
