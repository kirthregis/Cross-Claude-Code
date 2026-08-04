/**
 * EMY Studio — AI capability resolution.
 *
 * The app is designed to be handed over fully working: the developer
 * configures keys ON THE SERVER (env vars) once, and the user never pastes
 * anything. If no server key exists (e.g. a plain local `npm run dev`), the
 * client falls back to a device-local key stored in Settings.
 *
 * All capability checks hit /api/studio/status, which returns booleans only
 * (never secrets), cached for the session.
 */

export interface ServerAiStatus {
  serverGemini: boolean;
  serverFal: boolean;
  emailConfigured: boolean;
}

let cache: ServerAiStatus | null = null;

export async function getServerAiStatus(force = false): Promise<ServerAiStatus> {
  if (cache && !force) return cache;
  const fallback: ServerAiStatus = { serverGemini: false, serverFal: false, emailConfigured: false };
  try {
    const res = await fetch("/api/studio/status", { cache: "no-store" });
    const j = await res.json();
    cache = {
      serverGemini: Boolean(j.serverGemini),
      serverFal: Boolean(j.serverFal),
      emailConfigured: Boolean(j.emailConfigured),
    };
  } catch {
    cache = fallback;
  }
  return cache ?? fallback;
}

export async function serverTextChat(system: string, messages: { role: "user" | "model"; parts: { text: string }[] }[]): Promise<string> {
  const res = await fetch("/api/studio/ai/text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages }),
  });
  const j = await res.json().catch(() => null);
  if (!j?.ok) throw new Error(j?.error || "Server AI failed.");
  return String(j.text ?? "");
}

export async function serverImage(prompt: string, provider: "gemini" | "fal", model?: string): Promise<{ dataUrl: string; mimeType: string }> {
  const res = await fetch("/api/studio/ai/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider, model }),
  });
  const j = await res.json().catch(() => null);
  if (!j?.ok) throw new Error(j?.error || "Server image generation failed.");
  return { dataUrl: String(j.dataUrl ?? ""), mimeType: String(j.mimeType ?? "image/jpeg") };
}
