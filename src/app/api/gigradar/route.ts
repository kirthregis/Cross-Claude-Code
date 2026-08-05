import { NextResponse } from "next/server";
import { UAE_VERIFIED_SOURCES } from "@/lib/sources/uae";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    sources: UAE_VERIFIED_SOURCES,
    total: UAE_VERIFIED_SOURCES.length,
    updatedAt: new Date().toISOString(),
  });
}