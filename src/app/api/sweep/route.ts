import { NextResponse } from "next/server";
import { uaeSourcesAsLeads } from "@/lib/sources/uae";

export const dynamic = "force-dynamic";

export async function GET() {
  const leads = uaeSourcesAsLeads();
  return NextResponse.json({
    ok: true,
    found: leads.length,
    leads: leads,
    message: `Found ${leads.length} verified UAE gig opportunities`,
    scannedAt: new Date().toISOString()
  });
}
