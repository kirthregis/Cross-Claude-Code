import { NextResponse } from "next/server";
import { deleteMedia, getMediaFile } from "@/lib/settings-store";
import { registerSettingsLoader } from "@/lib/settings-store";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await registerSettingsLoader();
  const found = await getMediaFile(id);
  if (!found) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ item: found.item });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await registerSettingsLoader();
  const ok = await deleteMedia(id);
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
