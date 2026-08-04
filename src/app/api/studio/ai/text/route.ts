import { NextResponse } from "next/server";

/**
 * EMY Studio — server-side Gemini text chat proxy.
 *
 * The developer sets GEMINI_API_KEY (and optionally GEMINI_TEXT_MODEL) in
 * .env.local / Vercel env once. The key never ships to the browser and the
 * user never pastes anything — the app just works when handed over.
 * Falls back to device-local keys only when no server key is set.
 */

interface Part {
  text?: string;
}
interface Content {
  role?: string;
  parts?: Part[];
}
interface GeminiResponse {
  candidates?: { content?: { parts?: Part[] } }[];
  error?: { message?: string };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY is not set on the server." }, { status: 200 });
  }
  let body: { system?: string; messages?: Content[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request body." }, { status: 400 });
  }
  const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: body.system ? { parts: [{ text: body.system }] } : undefined,
        contents: body.messages ?? [],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    },
  );
  const json: GeminiResponse | null = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: json?.error?.message || `Gemini returned ${res.status}` }, { status: 200 });
  }
  const text = (json?.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
  return NextResponse.json({ ok: true, text });
}
