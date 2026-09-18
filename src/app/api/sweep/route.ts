import { NextResponse } from "next/server";
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
    // The gigs themselves — not just counts. This route runs server-side
    // (serverless, no durable storage between invocations), so the caller
    // must persist these itself. Dropping this field here was why a sweep
    // could report "12 new gigs" and the dashboard would still show nothing:
    // the gigs were found and scored, then discarded with the response.
    gigs: r.gigs,
    at: new Date().toISOString(),
  });
}