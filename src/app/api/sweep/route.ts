import { NextResponse } from "next/server";
import { sweep } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cron target. Call every 60s: GET /api/sweep with header x-cron-key. */
export async function GET(req: Request) {
  const key = process.env.CRON_KEY;
  if (key && req.headers.get("x-cron-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const r = await sweep();
  return NextResponse.json({
    found: r.found, newGigs: r.newGigs, alerted: r.alerted,
    errors: r.errors, at: new Date().toISOString(),
  });
}
