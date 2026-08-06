import { NextResponse } from "next/server";
import { addStudioFeedback, listStudioFeedback } from "@/lib/db";
import { analyzeSuggestion, thanksReply } from "@/lib/studio/improve";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || undefined;
  const items = listStudioFeedback(clientId);
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = (body.text || body.message || "").trim();
    const clientId = body.clientId;

    if (!text || text.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Feedback text is required." },
        { status: 400 },
      );
    }

    const analysis = analyzeSuggestion(text);
    const item = addStudioFeedback({
      clientId,
      text,
      message: text,
      category: analysis.category,
      priority: analysis.priority,
      plan: analysis.plan,
      status: "new",
    });

    const reply = thanksReply(analysis, item.id);

    return NextResponse.json({
      ok: true,
      id: item.id,
      reply,
      category: analysis.category,
      item,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 400 });
  }
}
