import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-store";
import { registerSettingsLoader } from "@/lib/settings-store";

registerSettingsLoader();

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ settings: getSettings() });
}

export async function POST(req: Request) {
  const patch = await req.json();
  return NextResponse.json({ settings: saveSettings(patch) });
}
