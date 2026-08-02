import { NextResponse } from "next/server";
import { z } from "zod";
import { processLeads } from "@/lib/ingest";

const Body = z.object({
  title: z.string().default("Manual lead"),
  text: z.string().min(1),
  sourceName: z.string().default("Manual entry"),
  sourceUrl: z.string().optional(),
});

/** Paste-a-lead: Emy sees something in a story or a chat and drops it in. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const { title, text, sourceName, sourceUrl } = parsed.data;
  const r = await processLeads([{
    sourceKind: "manual", sourceName, sourceUrl, title, body: text,
    postedAt: new Date().toISOString(),
  }]);
  return NextResponse.json({
    newGigs: r.newGigs, alerted: r.alerted,
    gigId: r.gigs[0]?.id ?? null,
    duplicate: r.newGigs === 0,
  });
}
