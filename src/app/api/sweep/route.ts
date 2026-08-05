import { NextResponse } from "next/server";
import { runAllSources } from "@/lib/sources";
import { recordSweep } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await runAllSources();
    recordSweep(result.found, result.inserted, result.errors);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
