/**
 * EMY Studio — fal.ai image generation client (browser-side, REST).
 *
 * fal.ai aggregates top open image models (Flux, Recraft, Ideogram…).
 * Pay-per-image from the user's own fal.ai key (they get free credits on
 * signup). The key is stored only on the device, like the Gemini key.
 *
 * API shape: POST a job to https://queue.fal.run/<model>, poll
 * /requests/<id>/status until COMPLETED, then GET the result.
 */

const FAL_QUEUE = "https://queue.fal.run";

export const FAL_MODELS = [
  { id: "fal-ai/flux/dev", label: "Flux Dev — best all-round" },
  { id: "fal-ai/flux-pro/v1.1", label: "Flux Pro — highest quality" },
  { id: "fal-ai/recraft-v3", label: "Recraft V3 — best for text & design" },
  { id: "fal-ai/ideogram/v2", label: "Ideogram V2 — great typography" },
] as const;

export interface FalImageResult {
  dataUrl: string;
  mimeType: string;
  /** optional caption returned by the model */
  caption?: string;
}

export function isFalConfigured(settings: { falKey: string }): boolean {
  return settings.falKey.trim().length > 10;
}

export function falHeaders(key: string): Record<string, string> {
  return { Authorization: `Key ${key}`, "Content-Type": "application/json" };
}

export function falRequestUrl(model: string): string {
  return `${FAL_QUEUE}/${model}`;
}

export function falStatusUrl(model: string, requestId: string): string {
  return `${FAL_QUEUE}/${model}/requests/${requestId}/status`;
}

export function falResultUrl(model: string, requestId: string): string {
  return `${FAL_QUEUE}/${model}/requests/${requestId}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function imageUrlToDataUrl(url: string): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fal.ai image fetch failed (${res.status}) — try again.`);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve({ dataUrl: String(fr.result), mimeType: blob.type || "image/jpeg" });
    fr.onerror = () => reject(new Error("Could not read the generated image."));
    fr.readAsDataURL(blob);
  });
}

interface FalSubmitJson {
  request_id?: string;
  images?: { url: string }[];
  prompt?: string;
  detail?: unknown;
  error?: { message?: string };
  output?: { images?: { url: string }[] };
}

function extractImages(json: FalSubmitJson | null): { url: string }[] | null {
  // Most fal models return { images: [{ url }] }; some nest under output.
  const direct = json?.images;
  const nested = json?.output?.images;
  const list = Array.isArray(direct) && direct.length ? direct : Array.isArray(nested) && nested.length ? nested : null;
  return list;
}

/**
 * Generate an image on fal.ai. Submit → poll status → fetch result.
 * Times out after ~2.5 minutes (most models finish in 5–40s).
 */
export async function falImage(opts: {
  key: string;
  model: string;
  prompt: string;
}): Promise<FalImageResult> {
  const headers = falHeaders(opts.key);

  const submit = await fetch(falRequestUrl(opts.model), {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt: opts.prompt }),
  });
  const submitJson = await submit.json().catch(() => null);
  if (!submit.ok) {
    const detail = submitJson?.detail || submitJson?.error?.message;
    throw new Error(`fal.ai ${submit.status}${detail ? `: ${detail}` : ""}`);
  }

  // Fast models sometimes return the image inline.
  const inline = extractImages(submitJson);
  if (inline) {
    const img = await imageUrlToDataUrl(inline[0].url);
    return { ...img, caption: submitJson?.prompt ?? undefined };
  }

  const requestId = submitJson?.request_id;
  if (!requestId) throw new Error("fal.ai returned an unexpected response.");

  for (let i = 0; i < 100; i++) {
    await sleep(1500);
    const status = await (await fetch(falStatusUrl(opts.model, requestId), { headers })).json().catch(() => null);
    if (status?.status === "COMPLETED") {
      const result = await (await fetch(falResultUrl(opts.model, requestId), { headers })).json().catch(() => null);
      const images = extractImages(result);
      if (!images) throw new Error("fal.ai finished but returned no image.");
      const img = await imageUrlToDataUrl(images[0].url);
      return { ...img, caption: result?.prompt ?? undefined };
    }
    if (status?.status === "FAILED") {
      throw new Error(`fal.ai generation failed${status?.error ? `: ${status.error}` : ""}. Try a different prompt or model.`);
    }
    if (status?.status === "CANCELLED" || status?.status === "REJECTED") {
      throw new Error("fal.ai cancelled the request.");
    }
  }
  throw new Error("fal.ai timed out — try again in a moment.");
}
