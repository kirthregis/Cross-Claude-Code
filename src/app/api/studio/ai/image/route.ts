import { NextResponse } from "next/server";

/**
 * EMY Studio — server-side image generation proxy (Gemini or fal.ai).
 *
 * Developer sets GEMINI_API_KEY and/or FAL_KEY in env once. The browser never
 * sees a key. If no server key for the requested provider exists, returns
 * ok:false and the client falls back to a device-local key if one is stored.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const FAL_QUEUE = "https://queue.fal.run";

interface FalImage { url?: string }
interface FalJson {
  request_id?: string;
  images?: FalImage[];
  output?: { images?: FalImage[] };
  status?: string;
  error?: unknown;
}
interface GeminiPart { text?: string; inlineData?: { data?: string; mimeType?: string } }
interface GeminiJson {
  candidates?: { content?: { parts?: GeminiPart[] } }[];
  error?: { message?: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geminiImageServer(prompt: string): Promise<{ dataUrl: string; mimeType: string }> {
  const key = process.env.GEMINI_API_KEY!;
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const candidates = [model, "gemini-2.5-flash-image", "gemini-2.0-flash-preview-image-generation", "gemini-image-generation-2"];
  let lastError: string | null = null;
  for (const m of candidates) {
    try {
      const res = await fetch(`${GEMINI_API_BASE}/models/${m}:generateContent?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "SQUARE" } },
        }),
      });
      const json: GeminiJson | null = await res.json().catch(() => null);
      if (!res.ok) {
        lastError = json?.error?.message || `Gemini ${res.status}`;
        continue;
      }
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const img = parts.find((p) => p.inlineData?.data);
      if (img?.inlineData?.data) {
        return { dataUrl: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`, mimeType: img.inlineData.mimeType || "image/png" };
      }
      lastError = "Gemini returned no image.";
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError || "Gemini image generation failed.");
}

async function falImageServer(prompt: string, model: string): Promise<{ dataUrl: string; mimeType: string }> {
  const key = process.env.FAL_KEY!;
  const headers = { Authorization: `Key ${key}`, "Content-Type": "application/json" };

  const submit = await fetch(`${FAL_QUEUE}/${model}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt }),
  });
  const submitJson: FalJson | null = await submit.json().catch(() => null);
  if (!submit.ok) {
    throw new Error(`fal.ai ${submit.status}${submitJson?.error ? `: ${String(submitJson.error)}` : ""}`);
  }
  const inline = submitJson?.images?.[0]?.url || submitJson?.output?.images?.[0]?.url;
  if (inline) return await urlToDataUrl(inline);

  const requestId = submitJson?.request_id;
  if (!requestId) throw new Error("fal.ai returned an unexpected response.");
  for (let i = 0; i < 100; i++) {
    await sleep(1500);
    const statusJson: FalJson | null = await (await fetch(`${FAL_QUEUE}/${model}/requests/${requestId}/status`, { headers })).json().catch(() => null);
    if (statusJson?.status === "COMPLETED") {
      const result: FalJson | null = await (await fetch(`${FAL_QUEUE}/${model}/requests/${requestId}`, { headers })).json().catch(() => null);
      const url = result?.images?.[0]?.url || result?.output?.images?.[0]?.url;
      if (!url) throw new Error("fal.ai finished but returned no image.");
      return await urlToDataUrl(url);
    }
    if (statusJson?.status === "FAILED") throw new Error(`fal.ai generation failed (${String(statusJson.error ?? "")}).`);
    if (statusJson?.status === "CANCELLED" || statusJson?.status === "REJECTED") throw new Error("fal.ai cancelled the request.");
  }
  throw new Error("fal.ai timed out — try again.");
}

async function urlToDataUrl(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch the generated image (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get("content-type") || "image/jpeg";
  return { dataUrl: `data:${mimeType};base64,${buf.toString("base64")}`, mimeType };
}

export async function POST(req: Request) {
  let body: { provider?: "gemini" | "fal"; prompt?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request body." }, { status: 400 });
  }
  const prompt = (body.prompt ?? "").trim();
  if (!prompt) return NextResponse.json({ ok: false, error: "No prompt." }, { status: 400 });

  if (body.provider === "fal") {
    if (!process.env.FAL_KEY) {
      return NextResponse.json({ ok: false, error: "FAL_KEY is not set on the server." }, { status: 200 });
    }
    try {
      const img = await falImageServer(prompt, body.model || "fal-ai/flux/dev");
      return NextResponse.json({ ok: true, ...img });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 200 });
    }
  }

  // default: Gemini
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY is not set on the server." }, { status: 200 });
  }
  try {
    const img = await geminiImageServer(prompt);
    return NextResponse.json({ ok: true, ...img });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 200 });
  }
}
