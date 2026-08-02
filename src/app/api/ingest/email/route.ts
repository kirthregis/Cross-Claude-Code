import { NextResponse } from "next/server";
import { z } from "zod";
import { processLeads } from "@/lib/ingest";
import type { RawLead } from "@/lib/types";

const Body = z.object({
  from: z.string().optional(),
  subject: z.string().default("Email enquiry"),
  text: z.string().min(1),
  receivedAt: z.string().optional(),
});

/** Inbound parse hook for the booking inbox (SendGrid / Cloudflare Email Workers). */
export async function POST(req: Request) {
  if (process.env.INGEST_KEY && req.headers.get("x-ingest-key") !== process.env.INGEST_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  const { from, subject, text, receivedAt } = parsed.data;

  const lead: RawLead = {
    sourceKind: "email",
    sourceName: from ?? "Booking inbox",
    title: subject,
    body: from ? `${text}\nFrom: ${from}` : text,
    postedAt: receivedAt ?? new Date().toISOString(),
  };
  const r = await processLeads([lead]);
  return NextResponse.json({ newGigs: r.newGigs, alerted: r.alerted, gigs: r.gigs.map((g) => g.id) });
}
