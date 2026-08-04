"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card, SectionLabel, Toggle } from "@/components/studio/ui";
import { geminiChat } from "@/lib/studio/gemini";
import { isGeminiConfigured } from "@/lib/studio/gemini";
import { FAL_MODELS, isFalConfigured } from "@/lib/studio/fal";
import type { ProjectKind, StudioSettings } from "@/lib/studio/types";
import { DEFAULT_SETTINGS } from "@/lib/studio/types";
import { loadSettings, saveSettings } from "@/lib/studio/store";

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings>(loadSettings());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; to: string } | null>(null);
  const [installEvt, setInstallEvt] = useState<{ prompt: () => Promise<void>; userChoice: Promise<unknown> } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showFalKey, setShowFalKey] = useState(false);
  const [serverAi, setServerAi] = useState<{ serverGemini: boolean; serverFal: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/studio/status")
      .then((r) => r.json())
      .then((j) => {
        setEmailStatus({ configured: !!j.emailConfigured, to: j.emailTo || "" });
        setServerAi({ serverGemini: !!j.serverGemini, serverFal: !!j.serverFal });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/studio/status")
      .then((r) => r.json())
      .then((j) => setEmailStatus({ configured: !!j.emailConfigured, to: j.emailTo || "" }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as unknown as { prompt: () => Promise<void>; userChoice: Promise<unknown> });
    };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const update = useCallback((patch: Partial<StudioSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, []);

  const testGemini = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await geminiChat({
        key: settings.geminiKey,
        model: settings.geminiTextModel,
        messages: [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }],
      });
      setTestResult({ ok: true, text: res.text.slice(0, 80) });
    } catch (e) {
      setTestResult({ ok: false, text: e instanceof Error ? e.message : "Failed" });
    } finally {
      setTesting(false);
    }
  }, [settings.geminiKey, settings.geminiTextModel]);

  const install = useCallback(async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  }, [installEvt]);

  const resetAll = useCallback(() => {
    if (!confirm("Reset ALL studio data (projects, artwork, settings) on this device? This cannot be undone.")) return;
    try {
      window.localStorage.removeItem("emy-studio-projects-v1");
      window.localStorage.removeItem("emy-studio-settings-v1");
      window.indexedDB.deleteDatabase("emy-studio");
    } catch {
      /* noop */
    }
    setSettings({ ...DEFAULT_SETTINGS });
    window.location.reload();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">✓ Saved on this device</span>}
      </div>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Artist profile</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Used in release titles, descriptions and file names.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Artist name" value={settings.artistName} onChange={(v) => update({ artistName: v })} />
          <Field label="YouTube handle" value={settings.youtubeChannel} onChange={(v) => update({ youtubeChannel: v })} />
          <Field label="Instagram" value={settings.instagram} onChange={(v) => update({ instagram: v })} />
          <Field label="TikTok" value={settings.tiktok} onChange={(v) => update({ tiktok: v })} />
          <Field label="Default genre" value={settings.defaultGenre} onChange={(v) => update({ defaultGenre: v })} />
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Default project type</span>
            <select
              value={settings.defaultKind}
              onChange={(e) => update({ defaultKind: e.target.value as ProjectKind })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="mix">DJ Mix</option>
              <option value="track">Track</option>
            </select>
          </label>
          <Field label="Default loudness target (LUFS)" value={String(settings.defaultTargetLufs)} onChange={(v) => update({ defaultTargetLufs: parseFloat(v) || -14 })} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>AI — chat (Gemini)</SectionLabel>
          {serverAi?.serverGemini ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Configured by the developer ✓</span>
          ) : isGeminiConfigured(settings) ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected (this device)</span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Not configured</span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          The developer sets <span className="font-mono text-zinc-300">GEMINI_API_KEY</span> in the app&apos;s environment once — then open questions and copywriting just work everywhere with nothing to enter.
          For a personal local setup, paste a free key here instead (get one at{" "}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">
            aistudio.google.com/apikey
          </a>
          ). Either way the key never leaves your machine.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Gemini API key</span>
            <div className="mt-1 flex gap-2">
              <input
                type={showKey ? "text" : "password"}
                value={settings.geminiKey}
                onChange={(e) => update({ geminiKey: e.target.value })}
                placeholder="AIza…"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
              />
              <Button variant="ghost" className="!px-3" onClick={() => setShowKey((v) => !v)}>
                {showKey ? "Hide" : "Show"}
              </Button>
            </div>
          </label>
          <div className="grid gap-3">
            <Field label="Chat model" value={settings.geminiTextModel} onChange={(v) => update({ geminiTextModel: v })} />
            <Field label="Image model" value={settings.geminiImageModel} onChange={(v) => update({ geminiImageModel: v })} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="ghost" onClick={() => void testGemini()} disabled={testing || !settings.geminiKey.trim()}>
            {testing ? "Testing…" : "Test connection"}
          </Button>
          {testResult && (
            <span className={`text-xs ${testResult.ok ? "text-emerald-300" : "text-red-300"}`}>
              {testResult.ok ? `✓ Gemini says: ${testResult.text}` : `✗ ${testResult.text}`}
            </span>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Image generation — choose the engine</SectionLabel>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Cover art can be made by <span className="text-zinc-300">Gemini</span> (free tier) or{" "}
          <span className="text-zinc-300">fal.ai</span> (top open models like Flux, Recraft and Ideogram — pay-per-image, free credits on signup at{" "}
          <a href="https://fal.ai" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">
            fal.ai
          </a>
          ). Both keys stay on this device only.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {serverAi?.serverFal && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:col-span-2">
              ✓ fal.ai is pre-configured on the server (<span className="font-mono">FAL_KEY</span> set) — AI covers work with nothing to enter here.
            </div>
          )}
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Default image engine</span>
            <select
              value={settings.imageProvider}
              onChange={(e) => update({ imageProvider: e.target.value as "gemini" | "fal" })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="gemini">Gemini — free tier</option>
              <option value="fal">fal.ai — Flux / Recraft / Ideogram</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">fal.ai model</span>
            <select
              value={settings.falModel}
              onChange={(e) => update({ falModel: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              {FAL_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              fal.ai API key
              {isFalConfigured(settings) && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-normal text-emerald-300">Saved</span>}
            </span>
            <div className="mt-1 flex gap-2">
              <input
                type={showFalKey ? "text" : "password"}
                value={settings.falKey}
                onChange={(e) => update({ falKey: e.target.value })}
                placeholder="Your fal.ai key (starts with a UUID)"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
              />
              <Button variant="ghost" className="!px-3" onClick={() => setShowFalKey((v) => !v)}>
                {showFalKey ? "Hide" : "Show"}
              </Button>
            </div>
            <span className="mt-1 block text-[11px] text-zinc-600">
              Find it at fal.ai → Settings → Keys. Or the developer sets <span className="font-mono">FAL_KEY</span> in the app environment and it works everywhere with nothing to enter.
            </span>
          </label>
          <div className="flex items-end pb-1">
            <span className="text-[11px] text-zinc-500">
              You can also switch engine per-project in the Artwork tab — the choice here is just the default.
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Pings & notifications</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">When a master finishes or an export is ready, the studio can alert you.</p>
        <div className="mt-3 space-y-2">
          <Toggle label="Sound replies from the assistant (speech)" checked={settings.soundOn} onChange={(v) => update({ soundOn: v })} />
          <Toggle label="Email me when a master / export is ready" checked={settings.emailPing} onChange={(v) => update({ emailPing: v })} />
          {settings.emailPing && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
              {emailStatus === null
                ? "Checking email setup…"
                : emailStatus.configured
                  ? `✓ Email pings will go to ${emailStatus.to}`
                  : "Email isn't wired up yet — add RESEND_API_KEY + STUDIO_NOTIFY_TO in .env.local (or Vercel env) to turn it on. The in-app ping & phone notification work right now."}
            </div>
          )}
        </div>
        <div className="mt-4">
          <SectionLabel>Install as an app</SectionLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button onClick={() => void install()} disabled={!installEvt}>
              📲 Install EMY Studio on this device
            </Button>
            <span className="text-xs text-zinc-500">Adds it to her home screen like a real app — offline capable, gets notifications.</span>
          </div>
        </div>
      </Card>

      <Card className="border-red-900/40 p-4 sm:p-5">
        <SectionLabel>Danger zone</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Removes all projects and settings stored on this device. Your audio files and uploads are never touched.</p>
        <div className="mt-3">
          <Button variant="danger" onClick={resetAll}>Reset all studio data</Button>
        </div>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none"
      />
    </label>
  );
}
