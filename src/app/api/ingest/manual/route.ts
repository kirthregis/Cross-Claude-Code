import { NextResponse } from "next/server";
import { processLeads } from "@/lib/ingest";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Body = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  sourceName: z.string().optional().default("manual"),
  sourceUrl: z.string().optional(),
});

export async function POST(req: Request) {
  const key = process.env.INGEST_KEY;
  if (key && req.headers.get("x-ingest-key") !== key) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues },
      { status: 400 }
    );
  }

  const { title, text, sourceName, sourceUrl } = parsed.data;

  const r = await processLeads([{
    sourceKind: "gig_board",
    sourceName: sourceName ?? "manual",
    sourceUrl,
    title,
    body: text,
    postedAt: new Date().toISOString(),
  }]);

  return NextResponse.json({
    ok: true,
    found: r.found,
    newGigs: r.newGigs,
    alerted: r.alerted,
    errors: r.errors,
  });
}