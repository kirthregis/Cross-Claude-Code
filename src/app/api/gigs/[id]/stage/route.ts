import { NextResponse } from "next/server";
import { updateGigStage, getGig } from "@/lib/db";
import type { GigStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { stage } = (await req.json()) as { stage: GigStage };
    const valid: GigStage[] = ["new", "contacted", "negotiating", "confirmed", "paid", "archived"];
    if (!valid.includes(stage)) {
      return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
    }
    updateGigStage(id, stage);
    const gig = getGig(id);
    return NextResponse.json({ ok: true, gig });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
