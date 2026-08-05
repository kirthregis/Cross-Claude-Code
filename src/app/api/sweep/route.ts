import { NextResponse } from "next/server";
import { uaeSourcesAsLeads } from "@/lib/sources/uae";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = uaeSourcesAsLeads();
    
    return NextResponse.json({
      ok: true,
      found: leads.length,
      leads: leads,
      message: `Successfully found ${leads.length} verified UAE venues`,
      scannedAt: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: "Sweep engine failed", 
      details: String(e) 
    }, { status: 500 });
  }
}
