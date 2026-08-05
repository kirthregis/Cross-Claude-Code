import { uaeSourcesAsLeads } from "./uae";
import { fetchUaeJobs } from "./uae-jobs";
import { upsertGig } from "../db";
import { normalise } from "../extract";

export async function runAllSources() {
  let found = 0;
  let inserted = 0;
  const errors: string[] = [];

  try {
    const uaeLeads = uaeSourcesAsLeads();
    found += uaeLeads.length;
    for (const lead of uaeLeads) {
      try {
        const gig = { ...normalise(lead), id: `uae-${Date.now()}-${Math.random().toString(36).slice(2)}`, score: 0, stage: "new" as const };
        const result = upsertGig(gig);
        if (result.inserted) inserted++;
      } catch {}
    }
  } catch (e) {
    errors.push("UAE sources: " + String(e));
  }

  try {
    const jobLeads = await fetchUaeJobs();
    found += jobLeads.length;
    for (const lead of jobLeads) {
      try {
        const gig = { ...normalise(lead), id: `job-${Date.now()}-${Math.random().toString(36).slice(2)}`, score: 0, stage: "new" as const };
        const result = upsertGig(gig);
        if (result.inserted) inserted++;
      } catch {}
    }
  } catch (e) {
    errors.push("Job boards: " + String(e));
  }

  return { found, inserted, errors };
}

export function sourceStatus() {
  return [
    { id: "uae", label: "UAE Verified Sources", setup: "Live UAE club and event sources", configured: true },
    { id: "jobs", label: "UAE Job Boards", setup: "Dubizzle, Indeed, LinkedIn UAE", configured: true }
  ];
}

export function channelStatus() {
  return [
    { id: "whatsapp", label: "WhatsApp", setup: "Auto-pitch via wa.me links", configured: true },
    { id: "email", label: "Email", setup: "mailto: links with pre-filled pitch", configured: true }
  ];
}
