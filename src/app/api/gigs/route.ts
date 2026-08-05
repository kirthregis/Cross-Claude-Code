import { NextResponse } from "next/server";
import { listGigs, stats, upsertGig } from "@/lib/db";
import { scoreGig } from "@/lib/score";
import { quoteFor } from "@/lib/outreach";
import { registerProfileLoader } from "@/lib/profile-store";
import { GigStage } from "@/lib/types";

registerProfileLoader();

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage") as GigStage | null;
  const limit = parseInt(searchParams.get("limit") || "50");

  let gigs = listGigs();

  if (stage) {
    gigs = gigs.filter((g) => g.stage === stage);
  }

  gigs = gigs.slice(0, limit);

  const enriched = gigs.map((g) => ({
    ...g,
    score: scoreGig(g).score,
    quote: quoteFor(g),
  }));

  return NextResponse.json({
    gigs: enriched,
    stats: stats(),
    total: enriched.length,
    at: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, body: gigBody, sourceKind, sourceName, feeAed } = body;

    if (!title || !sourceKind || !sourceName) {
      return NextResponse.json(
        { error: "Missing required fields: title, sourceKind, sourceName" },
        { status: 400 }
      );
    }

    const { nanoid } = await import("nanoid");
    const gig = {
      id: nanoid(10),
      title,
      body: gigBody ?? "",
      sourceKind,
      sourceName,
      sourceUrl: body.sourceUrl,
      externalId: body.externalId,
      postedAt: new Date().toISOString(),
      score: 0,
      stage: "new" as GigStage,
      feeAed: feeAed ?? undefined,
    };

    const scored = scoreGig(gig);
    gig.score = scored.score;

    const { inserted } = upsertGig(gig);

    return NextResponse.json({
      ok: true,
      inserted,
      gig,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}