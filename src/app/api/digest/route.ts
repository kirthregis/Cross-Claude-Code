import { NextResponse } from "next/server";
import { sendMorningDigest } from "@/lib/notify";
import { pendingDeferred } from "@/lib/db";
import { registerProfileLoader } from "@/lib/profile-store";
import { registerSettingsLoader } from "@/lib/settings-store";

registerProfileLoader();
registerSettingsLoader();

export const dynamic = "force-dynamic";

/** What's currently held for the morning digest. */
export async function GET() {
  const pending = pendingDeferred();
  return NextResponse.json({
    count: pending.length,
    gigs: pending.map((p) => ({ id: p.gig.id, venue: p.gig.venueName, score: p.gig.score, queuedAt: p.queuedAt })),
  });
}

/** Force-send the digest now (also fires automatically at 09:00 Dubai). */
export async function POST(req: Request) {
  const key = process.env.CRON_KEY;
  if (key && req.headers.get("x-cron-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await sendMorningDigest());
}
