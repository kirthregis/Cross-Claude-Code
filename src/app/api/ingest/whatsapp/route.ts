import { NextResponse } from "next/server";
import { z } from "zod";
import { processLeads } from "@/lib/ingest";
import type { RawLead } from "@/lib/types";

const Body = z.object({
  from: z.string().optional(),
  group: z.string().optional(),
  text: z.string().min(1),
  timestamp: z.string().optional(),
});

/** Inbound webhook for WhatsApp promoter groups. */
export async function POST(req: Request) {
  if (process.env.INGEST_KEY && req.headers.get("x-ingest-key") !== process.env.INGEST_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const { from, group, text, timestamp } = parsed.data;

  const lead: RawLead = {
    sourceKind: "whatsapp",
    sourceName: group ?? from ?? "WhatsApp",
    title: `WhatsApp: ${group ?? from ?? "message"}`,
    body: from ? `${text}\n(from ${from})` : text,
    postedAt: timestamp ?? new Date().toISOString(),
  };
  // Process immediately — WhatsApp gigs are the most time-sensitive of all.
  const r = await processLeads([lead]);
  return NextResponse.json({ newGigs: r.newGigs, alerted: r.alerted, gigs: r.gigs.map((g) => g.id) });
}
