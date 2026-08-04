import { NextResponse } from "next/server";
import { getMediaFile } from "@/lib/settings-store";
import { registerSettingsLoader } from "@/lib/settings-store";

registerSettingsLoader();

export const dynamic = "force-dynamic";

/** Serves the raw media file so <img>/<video> tags can render it. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = getMediaFile(id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": found.item.mime,
    "Content-Length": String(found.item.size),
    "Cache-Control": "private, max-age=3600",
  };
  return new NextResponse(new Uint8Array(found.buffer), { status: 200, headers });
}
