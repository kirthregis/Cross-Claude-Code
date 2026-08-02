import { NextResponse } from "next/server";
import { getGig } from "@/lib/db";
import { generateDealPack } from "@/lib/contract";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGig(id);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  const fee = new URL(req.url).searchParams.get("fee");
  return NextResponse.json(generateDealPack(g, fee ? { agreedFeeAed: Number(fee) } : {}));
}
