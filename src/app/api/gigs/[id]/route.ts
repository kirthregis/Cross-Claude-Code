import { NextResponse } from "next/server";
import { getGig } from "@/lib/db";
import { registerProfileLoader } from "@/lib/profile-store";
import { registerSettingsLoader } from "@/lib/settings-store";
import { scoreGig } from "@/lib/score";
import { quoteFor, pitch, negotiationPlaybook, contactStrategy } from "@/lib/outreach";

registerProfileLoader();
registerSettingsLoader();

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGig(id);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  const strategy = contactStrategy(g);
  return NextResponse.json({
    gig: g,
    scored: scoreGig(g),
    quote: quoteFor(g),
    strategy,
    pitches: {
      whatsapp: pitch(g, "whatsapp", strategy[0]?.contact),
      instagram_dm: pitch(g, "instagram_dm", strategy[0]?.contact),
      email: pitch(g, "email", strategy[0]?.contact),
    },
    playbook: negotiationPlaybook(g),
  });
}
