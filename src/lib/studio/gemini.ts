/**
 * EMY Studio — Gemini API client (browser-side, REST).
 *
 * Uses the free-tier Generative Language API with the user's own key, stored
 * only on the device. Text chat for the assistant, image generation for
 * cover art. Every call degrades gracefully to a helpful error message.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

async function genFetch(path: string, key: string, body: unknown): Promise<Response> {
  return fetch(`${API_BASE}${path}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function geminiChat(opts: {
  key: string;
  model: string;
  system?: string;
  messages: GeminiMessage[];
  temperature?: number;
}): Promise<{ text: string }> {
  // Google retires model names regularly (gemini-2.5-flash was retired early
  // in 2026) — try the requested model, then newer/current fallbacks.
  const candidates = [opts.model, "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash"];
  const seen = new Set<string>();
  let lastError: string | null = null;
  for (const model of candidates) {
    if (seen.has(model)) continue;
    seen.add(model);
    try {
      const res = await genFetch(`/models/${model}:generateContent`, opts.key, {
        systemInstruction: opts.system ? { parts: [{ text: opts.system }] } : undefined,
        contents: opts.messages,
        generationConfig: { temperature: opts.temperature ?? 0.7, maxOutputTokens: 1024 },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        lastError = json?.error?.message || `Gemini returned ${res.status}`;
        continue;
      }
      const text = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
      if (!text) {
        lastError = "Gemini returned an empty response.";
        continue;
      }
      return { text };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(lastError || "Gemini chat failed.");
}

export interface GeneratedImage {
  dataUrl: string;
  mimeType: string;
  /** text accompanying the image (often the prompt used) */
  caption?: string;
}

/**
 * Generate an image from a text prompt. Tries the configured model first,
 * then falls back through known image-capable model names.
 */
export async function geminiImage(opts: {
  key: string;
  model: string;
  prompt: string;
  aspect?: "SQUARE" | "LANDSCAPE" | "PORTRAIT";
}): Promise<GeneratedImage> {
  const candidates = [
    opts.model,
    "gemini-3.1-flash-image-preview",
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation",
    "gemini-image-generation-2",
  ];
  const seen = new Set<string>();
  let lastError: unknown = null;
  for (const model of candidates) {
    if (seen.has(model)) continue;
    seen.add(model);
    try {
      const res = await genFetch(`/models/${model}:generateContent`, opts.key, {
        contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: { aspectRatio: opts.aspect ?? "SQUARE" },
        },
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        lastError = new Error(json?.error?.message || `Gemini image API returned ${res.status}`);
        continue;
      }
      const parts: { inlineData?: { data?: string; mimeType?: string }; text?: string }[] = json?.candidates?.[0]?.content?.parts ?? [];
      const img = parts.find((p) => p.inlineData?.data);
      if (img?.inlineData?.data) {
        return {
          dataUrl: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`,
          mimeType: img.inlineData.mimeType || "image/png",
          caption: parts.map((p) => p.text ?? "").filter(Boolean).join(" "),
        };
      }
      lastError = new Error("No image in Gemini's response.");
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Image generation failed.");
}

export function isGeminiConfigured(settings: { geminiKey: string }): boolean {
  return settings.geminiKey.trim().length > 10;
}
