import { NextResponse } from "next/server";
import { listGigs, stats } from "@/lib/db";
import { registerProfileLoader } from "@/lib/profile-store";
import { registerSettingsLoader } from "@/lib/settings-store";
import { scoreGig } from "@/lib/score";
import { quoteFor } from "@/lib/outreach";
import type { DealStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await Promise.all([registerProfileLoader(), registerSettingsLoader()]);
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") as DealStage | null;
  const minScore = url.searchParams.get("minScore");
  const gigs = await listGigs({
    stage: stage ?? undefined,
    minScore: minScore ? Number(minScore) : undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({
    stats: await stats(),
    gigs: gigs.map((g) => ({ ...g, scored: scoreGig(g), quote: quoteFor(g) })),
  });
}
