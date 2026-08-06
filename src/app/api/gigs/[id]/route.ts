import { NextResponse } from "next/server";
import { getGig, saveGigs, getGigs } from "@/lib/db";
import { quoteFor, generateWhatsAppLink, generatePitch, negotiationPlaybook } from "@/lib/outreach";
import type { GigStage } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quote = quoteFor(gig);
  const playbook = negotiationPlaybook(gig);
  const pitches = {
    whatsapp: generateWhatsAppLink(gig),
    email: generatePitch(gig),
  };

  return NextResponse.json({
    gig,
    quote: {
      fee: quote.fee ?? quote.askAed,
      currency: quote.currency || "AED",
      note: quote.note || `Suggested fee for ${gig.title}`,
    },
    pitches,
    playbook: {
      openingOffer: playbook.openingOffer ?? quote.askAed,
      minimumAcceptable: playbook.minimumAcceptable ?? quote.walkAwayAed,
      tips: playbook.tips || [],
    },
  });
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
