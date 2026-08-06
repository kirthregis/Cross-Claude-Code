import { NextResponse } from "next/server";
import { sourceStatus } from "@/lib/sources/index";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    sources: sourceStatus(),
    at: new Date().toISOString(),
  });
}