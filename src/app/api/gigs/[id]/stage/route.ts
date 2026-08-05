import { NextResponse } from "next/server";
import { setStage } from "@/lib/db";
import { GigStage } from "@/lib/types";
import { z } from "zod";

export const dynamic = "force-dynamic";

const VALID_STAGES: GigStage[] = [
  "new",
  "contacted",
  "negotiating",
  "confirmed",
  "paid",
  "archived",
];

const Body = z.object({
  stage: z.enum([
    "new",
    "contacted",
    "negotiating",
    "confirmed",
    "paid",
    "archived",
  ]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    );
  }

  setStage(id, parsed.data.stage);

  return NextResponse.json({
    ok: true,
    id,
    stage: parsed.data.stage,
    validStages: VALID_STAGES,
  });
}