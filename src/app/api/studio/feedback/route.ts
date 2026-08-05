import { NextResponse } from "next/server";
import { addStudioFeedback, listStudioFeedback } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = listStudioFeedback();
  return NextResponse.json({ items, total: items.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const item = addStudioFeedback(message);

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}