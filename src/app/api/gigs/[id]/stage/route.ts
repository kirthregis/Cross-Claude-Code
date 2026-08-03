import { NextResponse } from "next/server";
import { setStage } from "@/lib/db";
import { z } from "zod";

const Body = z.object({
  stage: z.enum(["new","alerted","pitched","negotiating","agreed","contracted","confirmed","performed","invoiced","paid","lost"]),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const g = setStage(id, parsed.data.stage);
  if (!g) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ gig: g });
}
