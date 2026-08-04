import { NextResponse } from "next/server";
import { sourceStatus } from "@/lib/sources";
import { channelStatus } from "@/lib/channels";
import { registerSettingsLoader } from "@/lib/settings-store";

export const dynamic = "force-dynamic";
export async function GET() {
  await registerSettingsLoader();
  return NextResponse.json({ sources: sourceStatus(), channels: channelStatus() });
}
