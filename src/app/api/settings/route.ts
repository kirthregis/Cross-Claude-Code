import { NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/settings-store";
import { registerSettingsLoader } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export async function GET() {
  await registerSettingsLoader();
  return NextResponse.json({ settings: await getSettings() });
}

export async function POST(req: Request) {
  await registerSettingsLoader();
  const patch = await req.json();
  return NextResponse.json({ settings: await saveSettings(patch) });
}
