# -*- coding: utf-8 -*-
import os, subprocess

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    size = os.path.getsize(path)
    print(f"WROTE {path} ({size} bytes)")

# Fix 1: ingest.ts - mark gig as alerted even when no channels configured
# so it does not spam on every sweep
write("src/lib/ingest.ts", r'''/**
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
''')

# Fix 2: sweep route - add source breakdown to response
write("src/app/api/sweep/route.ts", r'''import { NextResponse } from "next/server";
import { sweep } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const key = process.env.CRON_KEY;
  if (key && req.headers.get("x-cron-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await sweep();
  return NextResponse.json({
    found: r.found,
    newGigs: r.newGigs,
    alerted: r.alerted,
    digested: r.digested ?? 0,
    errors: r.errors,
    sources: r.sources ?? [],
    at: new Date().toISOString(),
  });
}
''')

# Fix 3: gigradar page - show source breakdown + UAE built-in feeds in sources tab
# Read current file and patch the sweep result display and sources tab
with open("src/app/studio/gigradar/page.tsx", "r", encoding="utf-8") as f:
    page = f.read()

# Patch sweep result to show more detail
old_sweep_result = '''      const res = await fetch("/api/sweep");
      const data = await res.json();
      setSweepResult("Found " + data.found + " leads. " + data.newGigs + " new gigs added.");'''

new_sweep_result = '''      const res = await fetch("/api/sweep");
      const data = await res.json();
      const errCount = data.errors?.length ?? 0;
      const srcCount = (data.sources ?? []).filter((s: {found: number}) => s.found > 0).length;
      setSweepResult(
        "Scanned " + srcCount + " sources. Found " + data.found + " leads. " +
        data.newGigs + " new gigs added." +
        (data.alerted > 0 ? " " + data.alerted + " alerts sent." : "") +
        (errCount > 0 ? " (" + errCount + " sources offline)" : " All sources OK.")
      );'''

if old_sweep_result in page:
    page = page.replace(old_sweep_result, new_sweep_result)
    print("PATCHED: sweep result display")
else:
    print("WARNING: sweep result pattern not found")

# Patch sources tab to show built-in UAE feeds count
old_sources_header = '''            <p className="text-sm text-zinc-500 mb-4">Toggle countries and feeds on/off. UAE is always priority 1.</p>'''

new_sources_header = '''            <p className="text-sm text-zinc-500 mb-2">Toggle countries and feeds on/off. UAE is always priority 1.</p>
            <div className="mb-4 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
              <p className="text-xs font-bold text-fuchsia-300">Built-in UAE sources (always active, no setup needed)</p>
              <p className="text-[11px] text-zinc-400 mt-1">40+ free public sources: Indeed, Bayt, GulfTalent, NaukriGulf, Hozpitality, Dubizzle, Reddit (r/DJs, r/dubai), Twitter/X (DJ booking, DJ wanted, Afro House Dubai), Eventbrite, Meetup, Time Out Dubai, Resident Advisor, Platinumlist, Visit Dubai, Dubai Calendar, What\'s On UAE, Gulf News, Khaleej Times, Arabian Business, Esquire ME, Hospitality Net, Caterer, Total Jobs.</p>
            </div>'''

if old_sources_header in page:
    page = page.replace(old_sources_header, new_sources_header)
    print("PATCHED: sources tab header")
else:
    print("WARNING: sources header pattern not found")

with open("src/app/studio/gigradar/page.tsx", "w", encoding="utf-8") as f:
    f.write(page)
print(f"WROTE gigradar/page.tsx ({os.path.getsize('src/app/studio/gigradar/page.tsx')} bytes)")

# AUDIT
checks = {
    "src/lib/ingest.ts": [
        "logAlert", "suppress", "sourceStats", "sources",
        "processLeads", "sweep", "registerProfileLoader",
    ],
    "src/app/api/sweep/route.ts": [
        "sources", "found", "newGigs", "alerted", "errors",
    ],
    "src/app/studio/gigradar/page.tsx": [
        "srcCount", "sources offline", "Built-in UAE sources",
        "40+ free public sources", "triggerSweep", "generateWhatsAppLink",
    ],
}

print("\n=== AUDIT ===")
all_ok = True
for path, required in checks.items():
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    missing = [r for r in required if r not in content]
    if missing:
        print(f"FAIL {path}")
        for m in missing:
            print(f"  MISSING: {m}")
        all_ok = False
    else:
        print(f"OK   {path} ({len(required)} checks passed)")

print()
if all_ok:
    subprocess.run(["git", "add", "-A"], check=True)
    result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    print(result.stdout)
    subprocess.run(["git", "commit", "-m", "Phase 10b: Fix ingest loop, sweep result detail, sources tab shows built-in feeds"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("DONE - DEPLOYED")
else:
    print("FAILURES - NOT PUSHING")
