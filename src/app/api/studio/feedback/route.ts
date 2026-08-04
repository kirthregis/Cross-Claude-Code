import { NextResponse } from "next/server";
import { addStudioFeedback, listStudioFeedback } from "@/lib/db";
import { analyzeSuggestion, analysisPrompt, parseAnalysisJson, thanksReply, type SuggestionAnalysis } from "@/lib/studio/improve";
import { devAppUrl, devEmailTo, sendEmail } from "@/lib/studio/server-email";
import { newId } from "@/lib/studio/id";

export const runtime = "nodejs";

async function analyzeWithGemini(text: string): Promise<SuggestionAnalysis | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash"}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: analysisPrompt(text) }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 900 } }),
      },
    );
    const json = await res.json().catch(() => null);
    const raw = (json?.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("");
    return parseAnalysisJson(raw);
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  let body: { text?: string; clientId?: string; device?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request body." }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (text.length < 3 || text.length > 4000) {
    return NextResponse.json({ ok: false, error: "Suggestion must be 3–4000 characters." }, { status: 400 });
  }

  const ai = (await analyzeWithGemini(text)) ?? analyzeSuggestion(text);
  const id = newId();
  const row = addStudioFeedback({
    id,
    clientId: body.clientId || null,
    text,
    device: body.device || null,
    category: ai.category,
    priority: ai.priority,
    plan: JSON.stringify(ai),
  });

  // Ping the developer (best-effort, never blocks the reply).
  const devTo = devEmailTo();
  if (devTo) {
    void sendEmail({
      to: devTo,
      subject: `💡 EMY Studio suggestion #${id.slice(0, 6)} — ${ai.category} (${ai.priority})`,
      text: [
        `New improvement suggestion from the artist:`,
        ``,
        `"${row.text}"`,
        ``,
        `Category: ${ai.category} · Priority: ${ai.priority}`,
        ``,
        `AI plan: ${ai.plan}`,
        ``,
        devAppUrl() ? `Review it: ${devAppUrl()}/studio/admin` : "Review it in the app: /studio/admin",
      ].join("\n"),
    });
  }

  return NextResponse.json({
    ok: true,
    id: row.id,
    category: ai.category,
    priority: ai.priority,
    plan: ai.plan,
    reply: thanksReply(ai, row.id),
  });
}

/** The artist's own suggestions (her device). */
export async function GET(req: Request) {
  const clientId = new URL(req.url).searchParams.get("clientId");
  const rows = listStudioFeedback(clientId || null);
  return NextResponse.json({
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      text: r.text,
      category: r.category,
      priority: r.priority,
      status: r.status,
      createdAt: r.createdAt,
      plan: r.plan ? ((JSON.parse(r.plan) as SuggestionAnalysis)?.oneLine ?? null) : null,
    })),
  });
}
