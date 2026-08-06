import { NextResponse } from "next/server";
import { getGig, saveGigs, getGigs } from "@/lib/db";
import type { GigStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ gig });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await req.json()) as { stage?: GigStage; feeAed?: number; notes?: string };
    const gigs = getGigs();
    const idx = gigs.findIndex((g) => g.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (body.stage) gigs[idx].stage = body.stage;
    if (body.feeAed !== undefined) gigs[idx].feeAed = body.feeAed;
    if (body.notes !== undefined) gigs[idx].notes = body.notes;
    saveGigs(gigs);
    return NextResponse.json({ ok: true, gig: gigs[idx] });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
