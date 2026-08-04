import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { listMedia, addMedia } from "@/lib/settings-store";
import { registerSettingsLoader } from "@/lib/settings-store";

registerSettingsLoader();

export const dynamic = "force-dynamic";

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);
const VIDEO_MIME = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const MAX_BYTES = 40 * 1024 * 1024; // 40 MB

export async function GET() {
  return NextResponse.json({ media: listMedia() });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 40 MB)" }, { status: 413 });
    }
    const kind = IMAGE_MIME.has(file.type) ? "image" : VIDEO_MIME.has(file.type) ? "video" : null;
    if (!kind) {
      return NextResponse.json({ error: "Unsupported type — upload an image (JPG/PNG/WebP) or video (MP4/WebM)" }, { status: 415 });
    }
    const tags = (String(form.get("tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean));
    const id = nanoid(16);
    const buffer = Buffer.from(await file.arrayBuffer());
    const item = addMedia({ id, name: file.name, kind, mime: file.type, size: file.size, tags, file: buffer });
    return NextResponse.json({ media: item });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
