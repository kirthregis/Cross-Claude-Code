# -*- coding: utf-8 -*-
import os, subprocess

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    size = os.path.getsize(path)
    print(f"WROTE {path} ({size} bytes)")

# Fix sweep route to return the actual gigs in the response
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
    gigs: r.gigs ?? [],
    at: new Date().toISOString(),
  });
}
''')

# Fix the gigradar page to save returned gigs into localStorage
with open("src/app/studio/gigradar/page.tsx", "r", encoding="utf-8") as f:
    page = f.read()

old_sweep = '''      const res = await fetch("/api/sweep");
      const data = await res.json();
      const errCount = data.errors?.length ?? 0;
      const srcCount = (data.sources ?? []).filter((s: {found: number}) => s.found > 0).length;
      setSweepResult(
        "Scanned " + srcCount + " sources. Found " + data.found + " leads. " +
        data.newGigs + " new gigs added." +
        (data.alerted > 0 ? " " + data.alerted + " alerts sent." : "") +
        (errCount > 0 ? " (" + errCount + " sources offline)" : " All sources OK.")
      );
      refresh();'''

new_sweep = '''      const res = await fetch("/api/sweep");
      const data = await res.json();
      const errCount = data.errors?.length ?? 0;
      const srcCount = (data.sources ?? []).filter((s: {found: number}) => s.found > 0).length;
      // Save returned gigs into browser localStorage so they appear in the UI
      if (data.gigs && data.gigs.length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem("emy-gigs-db") || "[]");
          const existingIds = new Set(existing.map((g: {id: string}) => g.id));
          const incoming = (data.gigs as {id: string}[]).filter(g => !existingIds.has(g.id));
          const merged = [...incoming, ...existing].slice(0, 500);
          localStorage.setItem("emy-gigs-db", JSON.stringify(merged));
        } catch {}
      }
      setSweepResult(
        "Scanned " + srcCount + " sources. Found " + data.found + " leads. " +
        data.newGigs + " new gigs added." +
        (data.alerted > 0 ? " " + data.alerted + " alerts sent." : "") +
        (errCount > 0 ? " (" + errCount + " sources offline)" : " All sources OK.")
      );
      refresh();'''

if old_sweep in page:
    page = page.replace(old_sweep, new_sweep)
    print("PATCHED: sweep saves gigs to localStorage")
else:
    print("WARNING: sweep pattern not found - checking...")
    idx = page.find("setSweepResult")
    print(f"  setSweepResult found at char {idx}")
    print(f"  Context: {page[max(0,idx-200):idx+100]}")

with open("src/app/studio/gigradar/page.tsx", "w", encoding="utf-8") as f:
    f.write(page)
print(f"WROTE gigradar/page.tsx ({os.path.getsize('src/app/studio/gigradar/page.tsx')} bytes)")

# AUDIT
checks = {
    "src/app/api/sweep/route.ts": ["gigs", "sources", "found", "newGigs"],
    "src/app/studio/gigradar/page.tsx": [
        "emy-gigs-db", "incoming", "merged", "localStorage.setItem",
        "existingIds", "srcCount", "Built-in UAE sources",
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
    subprocess.run(["git", "commit", "-m", "Fix: sweep returns gigs in response and UI saves them to localStorage"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("DONE - DEPLOYED")
else:
    print("FAILURES - NOT PUSHING")
