import { NextResponse } from "next/server";
import { getGig } from "@/lib/db";
import { generateDealPack } from "@/lib/contract";
import { registerProfileLoader } from "@/lib/profile-store";

registerProfileLoader();
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const pack = generateDealPack(gig);
    return NextResponse.json({ ok: true, pack });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gig = getGig(id);
  if (!gig) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const overrides = await req.json().catch(() => ({}));
    const pack = generateDealPack(gig, overrides);
    return NextResponse.json({ ok: true, pack });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
