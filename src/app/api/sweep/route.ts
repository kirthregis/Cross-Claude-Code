import { NextResponse } from "next/server";
import { uaeSourcesAsLeads } from "@/lib/sources/uae";
import { UAE_VERIFIED_SOURCES } from "@/lib/sources/uae";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = uaeSourcesAsLeads();
    return NextResponse.json({ 
      ok: true,
      found: leads.length,
      leads: leads,
      sources: UAE_VERIFIED_SOURCES,
      message: `Found ${leads.length} verified UAE gig opportunities`,
      scannedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: String(e) 
    });
  }
}
