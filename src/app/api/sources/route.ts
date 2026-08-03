import { NextResponse } from "next/server";
import { sourceStatus } from "@/lib/sources";
import { channelStatus } from "@/lib/channels";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ sources: sourceStatus(), channels: channelStatus() });
}
