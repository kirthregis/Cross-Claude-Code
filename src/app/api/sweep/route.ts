import { NextResponse } from "next/server";
import { uaeSourcesAsLeads } from "@/lib/sources/uae";
import { fetchUaeJobs } from "@/lib/sources/uae-jobs";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const uaeLeads = uaeSourcesAsLeads();
    let jobLeads: unknown[] = [];
    try {
      jobLeads = await fetchUaeJobs();
    } catch {}

    const allLeads = [...uaeLeads, ...jobLeads];

    return NextResponse.json({
      ok: true,
      found: allLeads.length,
      leads: allLeads,
      message: `Found ${allLeads.length} gig opportunities across UAE sources`,
      scannedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
