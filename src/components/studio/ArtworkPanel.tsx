"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ArtworkResult, Project } from "@/lib/studio/types";
import {
  ARTWORK_TEMPLATES,
  buildArtPrompt,
  downloadDataUrl,
  loadImageFromDataUrl,
  renderTemplateCover,
  squareCropToJpeg,
} from "@/lib/studio/artwork";
import { geminiImage, isGeminiConfigured } from "@/lib/studio/gemini";
import { falImage, isFalConfigured, FAL_MODELS } from "@/lib/studio/fal";
import { getServerAiStatus, serverImage } from "@/lib/studio/server-ai";
import { formatBytes } from "@/lib/studio/dsp";
import { notify, speak } from "@/lib/studio/speech";
import { loadArtwork, loadSettings, saveArtwork, saveSettings, upsertProject } from "@/lib/studio/store";
import { Button, Card, SectionLabel } from "./ui";

interface Draft {
  dataUrl: string;
  sizeBytes: number;
  width: number;
  height: number;
  source: "ai" | "template";
  templateId?: string;
  prompt?: string;
}

export function ArtworkPanel({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const settings = loadSettings();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState<Draft | null>(null);
  const [prompt, setPrompt] = useState(() => buildArtPrompt(project.meta, settings));
  const [generating, setGenerating] = useState<"ai" | string | null>(null); // "ai" or template id
  const [error, setError] = useState<string | null>(null);
  const [templatePreviews, setTemplatePreviews] = useState<Record<string, string>>({});
  const previewsStarted = useRef(false);

  const hasGemini = isGeminiConfigured(settings);
  const hasFal = isFalConfigured(settings);
  const [serverAi, setServerAi] = useState<{ serverGemini: boolean; serverFal: boolean } | null>(null);
  useEffect(() => {
    let alive = true;
    void getServerAiStatus().then((s) => {
      if (alive) setServerAi(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  const provider: "gemini" | "fal" = settings.imageProvider;
  const providerReady =
    provider === "gemini" ? hasGemini || !!serverAi?.serverGemini : hasFal || !!serverAi?.serverFal;
  const falModelLabel = FAL_MODELS.find((m) => m.id === settings.falModel)?.label ?? settings.falModel;

  const setProvider = useCallback(
    (p: "gemini" | "fal") => {
      saveSettings({ ...settings, imageProvider: p });
      setError(null);
    },
    [settings],
  );

  // restore persisted artwork (IndexedDB)
  useEffect(() => {
    let alive = true;
    void loadArtwork(project.meta.id).then((dataUrl) => {
      if (!alive || !dataUrl) return;
      const d: Draft = { dataUrl, sizeBytes: Math.round((dataUrl.length * 3) / 4), width: 3000, height: 3000, source: "template" };
      setSaved(d);
      setDraft(d);
    });
    return () => {
      alive = false;
    };
  }, [project.meta.id]);

  // tiny template previews for the picker
  useEffect(() => {
    if (previewsStarted.current) return;
    previewsStarted.current = true;
    for (const t of ARTWORK_TEMPLATES) {
      renderTemplateCover({ templateId: t.id, title: "Afro", subtitle: "DJ EMY" }, 420).then((r) => {
        setTemplatePreviews((m) => ({ ...m, [t.id]: r.dataUrl }));
      });
    }
  }, []);

  const finish = useCallback(
    (d: Draft, markDone: boolean) => {
      setDraft(d);
      if (markDone) {
        setSaved(d);
        const art: ArtworkResult = {
          source: d.source,
          prompt: d.prompt,
          templateId: d.templateId,
          width: d.width,
          height: d.height,
          sizeBytes: d.sizeBytes,
          generatedAt: Date.now(),
          dataUrl: d.dataUrl,
        };
        upsertProject({
          ...project,
          artwork: art,
          meta: { ...project.meta, artworkDone: true, stage: project.meta.stage === "master" || project.meta.stage === "draft" ? "art" : project.meta.stage },
        });
        void saveArtwork(project.meta.id, d.dataUrl);
        onChanged();
        notify("Cover art ready", `Artwork for ${project.meta.name} is saved at 3000×3000.`);
        speak(`Your cover art is ready.`, settings.soundOn, "en-US", settings.voiceGender);
      } else {
        upsertProject({ ...project, artwork: { source: d.source, prompt: d.prompt, templateId: d.templateId, width: d.width, height: d.height, sizeBytes: d.sizeBytes, generatedAt: Date.now(), dataUrl: d.dataUrl } });
        onChanged();
      }
    },
    [project, settings.soundOn, onChanged],
  );

  const generateAI = useCallback(async () => {
    setError(null);
    setGenerating("ai");
    try {
      const provider = settings.imageProvider;
      const server = await getServerAiStatus();
      const useServer = provider === "fal" ? server.serverFal : server.serverGemini;
      const img = useServer
        ? await serverImage(prompt, provider, provider === "fal" ? settings.falModel : undefined)
        : provider === "fal"
          ? await falImage({ key: settings.falKey, model: settings.falModel, prompt })
          : await geminiImage({ key: settings.geminiKey, model: settings.geminiImageModel, prompt });
      const el = await loadImageFromDataUrl(img.dataUrl);
      const cropped = await squareCropToJpeg(el, 3000, 0.92);
      finish({ ...cropped, source: "ai", prompt }, false);
    } catch (e) {
      setError(
        `AI generation failed (${settings.imageProvider === "fal" ? "fal.ai" : "Gemini"}): ${e instanceof Error ? e.message : "unknown error"}`,
      );
    } finally {
      setGenerating(null);
    }
  }, [settings, prompt, finish]);

  const generateTemplate = useCallback(
    async (templateId: string) => {
      setError(null);
      setGenerating(templateId);
      try {
        const t = ARTWORK_TEMPLATES.find((x) => x.id === templateId);
        const full = await renderTemplateCover(
          { templateId, title: project.meta.name || "Afro House Mix", subtitle: settings.artistName || "DJ EMY" },
          3000,
        );
        finish({ ...full, source: "template", templateId }, false);
        speak(`${t?.name ?? "Template"} cover rendered. Take a look and save it if you like it.`, settings.soundOn, "en-US", settings.voiceGender);
      } catch (e) {
        setError(`Template failed: ${e instanceof Error ? e.message : "unknown error"}`);
      } finally {
        setGenerating(null);
      }
    },
    [project.meta.name, settings.artistName, settings.soundOn, finish],
  );

  const preview = draft ?? saved;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* preview */}
        <Card className="p-4">
          <SectionLabel>Cover preview · 3000×3000</SectionLabel>
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-700">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.dataUrl} alt="Cover art" className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-zinc-950 text-center">
                <div className="text-4xl">🎨</div>
                <div className="px-6 text-xs text-zinc-500">Your cover will appear here — generate with AI or pick a template.</div>
              </div>
            )}
          </div>
          {preview && (
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-zinc-500">
              <span>{preview.width}×{preview.height}</span>
              <span>{formatBytes(preview.sizeBytes)}</span>
              <span className="text-zinc-400">{preview.source === "ai" ? "AI generated" : "Template"}</span>
            </div>
          )}
          {preview && (
            <div className="mt-3 flex flex-col gap-2">
              {saved?.dataUrl !== preview.dataUrl && (
                <Button onClick={() => finish(preview, true)}>✓ Save & use this cover</Button>
              )}
              {saved?.dataUrl === preview.dataUrl && <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-center text-xs text-emerald-300">✓ This is the cover on file</div>}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1 !px-2" onClick={() => downloadDataUrl(preview.dataUrl, `${project.meta.name.replace(/\s+/g, "_")}_cover_3000x3000.jpg`)}>
                  ⬇ JPEG
                </Button>
                <Button variant="ghost" className="flex-1 !px-2" onClick={() => downloadDataUrl(preview.dataUrl.replace("image/jpeg", "image/png"), `${project.meta.name.replace(/\s+/g, "_")}_cover.png`)}>
                  ⬇ PNG
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          {/* AI */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionLabel>AI cover design</SectionLabel>
              <div className="flex rounded-lg border border-zinc-700 p-0.5">
                {(["gemini", "fal"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setProvider(p)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                      provider === p ? "bg-fuchsia-500/20 text-fuchsia-300" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {p === "gemini" ? "Gemini (free)" : "fal.ai"}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Describe the vibe and I&apos;ll design a print-quality cover. The prompt is pre-filled from your project — tweak it and press Generate.
            </p>
            {provider === "fal" && (
              <div className="mt-2 text-[11px] text-zinc-500">
                Engine: <span className="font-semibold text-zinc-300">{falModelLabel}</span> · pay-per-image from your fal.ai credits · switch models in Settings.
              </div>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs leading-relaxed text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button onClick={() => void generateAI()} disabled={generating !== null || !providerReady}>
                {generating === "ai" ? "Designing…" : "✨ Generate cover"}
              </Button>
              <button onClick={() => setPrompt(buildArtPrompt(project.meta, settings))} className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline">
                reset prompt
              </button>
              {!providerReady && (
                <span className="text-[11px] text-amber-300">
                  {provider === "gemini" ? "Add a free Gemini key in Settings" : "Add your fal.ai key in Settings (free credits on signup)"}
                </span>
              )}
            </div>
          </Card>

          {/* templates */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Offline templates · work with no internet</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {ARTWORK_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => void generateTemplate(t.id)}
                  disabled={generating !== null}
                  className="group overflow-hidden rounded-xl border border-zinc-800 text-left transition hover:border-fuchsia-500/70 disabled:opacity-50"
                  title={t.blurb}
                >
                  <div className="aspect-square w-full bg-zinc-950">
                    {templatePreviews[t.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={templatePreviews[t.id]} alt={t.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-zinc-600">…</div>
                    )}
                  </div>
                  <div className="bg-zinc-900 px-2 py-1.5 text-[11px] font-medium text-zinc-300">
                    {generating === t.id ? "Rendering…" : t.name}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
    </div>
  );
}
