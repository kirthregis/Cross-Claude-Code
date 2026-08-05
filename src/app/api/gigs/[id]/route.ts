import { NextResponse } from "next/server";
import { getGig, updateGigStage } from "@/lib/db";
import { pitch, quoteFor, contactStrategy, negotiationPlaybook } from "@/lib/outreach";
import { registerProfileLoader } from "@/lib/profile-store";
import { GigStage } from "@/lib/types";

registerProfileLoader();

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const g = getGig(id);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });

  const strategy = contactStrategy(g);
  const quote = quoteFor(g);
  const playbook = negotiationPlaybook(g);

  return NextResponse.json({
    gig: g,
    quote,
    playbook,
    strategy,
    pitches: {
      whatsapp: pitch(g),
      instagram_dm: pitch(g),
      email: pitch(g),
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const g = getGig(id);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const body = await req.json();
    const { stage, feeAed, notes, venueName } = body;

    if (stage) {
      updateGigStage(id, stage as GigStage, { feeAed, notes, venueName });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}