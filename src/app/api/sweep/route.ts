import { NextResponse } from "next/server";
import { uaeSourcesAsLeads } from "@/lib/sources/uae";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = uaeSourcesAsLeads();
    return NextResponse.json({ 
      ok: true,
      found: leads.length,
      message: `Found ${leads.length} UAE venues`,
      time: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json({ 
      ok: false, 
      error: String(e) 
    });
  }
}
