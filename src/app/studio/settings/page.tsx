"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, SectionLabel, Toggle } from "@/components/studio/ui";
import { geminiChat } from "@/lib/studio/gemini";
import { isGeminiConfigured } from "@/lib/studio/gemini";
import { FAL_MODELS, isFalConfigured } from "@/lib/studio/fal";
import type { ProjectKind, StudioSettings } from "@/lib/studio/types";
import { DEFAULT_SETTINGS } from "@/lib/studio/types";
import { loadSettings, saveSettings } from "@/lib/studio/store";
import {
  BACKGROUND_OPTIONS,
  DEFAULT_THEME,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  THEME_PRESETS,
  downscaleLogo,
  resetTheme,
  saveTheme,
  useTheme,
  type ThemeSettings,
} from "@/lib/studio/theme";

export default function StudioSettingsPage() {
  const [settings, setSettings] = useState<StudioSettings>(loadSettings());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; to: string } | null>(null);
  const [installEvt, setInstallEvt] = useState<{ prompt: () => Promise<void>; userChoice: Promise<unknown> } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showFalKey, setShowFalKey] = useState(false);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState<string | null>(null);
  const [serverAi, setServerAi] = useState<{ serverGemini: boolean; serverFal: boolean; adminConfigured: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/studio/status")
      .then((r) => r.json())
      .then((j) => {
        setEmailStatus({ configured: !!j.emailConfigured, to: j.emailTo || "" });
        setServerAi({ serverGemini: !!j.serverGemini, serverFal: !!j.serverFal, adminConfigured: !!j.adminConfigured });
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
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">âœ“ Saved on this device</span>}
      </div>

      <StyleBrandingCard />

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
          <SectionLabel>AI â€” chat (Gemini)</SectionLabel>
          {serverAi?.serverGemini ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Configured by the developer âœ“</span>
          ) : isGeminiConfigured(settings) ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected (this device)</span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Not configured</span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          The developer sets <span className="font-mono text-zinc-300">GEMINI_API_KEY</span> in the app&apos;s environment once â€” then open questions and copywriting just work everywhere with nothing to enter.
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
                placeholder="AIzaâ€¦"
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
            {testing ? "Testingâ€¦" : "Test connection"}
          </Button>
          {testResult && (
            <span className={`text-xs ${testResult.ok ? "text-emerald-300" : "text-red-300"}`}>
              {testResult.ok ? `âœ“ Gemini says: ${testResult.text}` : `âœ— ${testResult.text}`}
            </span>
          )}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Image generation â€” choose the engine</SectionLabel>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Cover art can be made by <span className="text-zinc-300">Gemini</span> (free tier) or{" "}
          <span className="text-zinc-300">fal.ai</span> (top open models like Flux, Recraft and Ideogram â€” pay-per-image, free credits on signup at{" "}
          <a href="https://fal.ai" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">
            fal.ai
          </a>
          ). Both keys stay on this device only.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {serverAi?.serverFal && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:col-span-2">
              âœ“ fal.ai is pre-configured on the server (<span className="font-mono">FAL_KEY</span> set) â€” AI covers work with nothing to enter here.
            </div>
          )}
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Default image engine</span>
            <select
              value={settings.imageProvider}
              onChange={(e) => update({ imageProvider: e.target.value as "gemini" | "fal" })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="gemini">Gemini â€” free tier</option>
              <option value="fal">fal.ai â€” Flux / Recraft / Ideogram</option>
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
              Find it at fal.ai â†’ Settings â†’ Keys. Or the developer sets <span className="font-mono">FAL_KEY</span> in the app environment and it works everywhere with nothing to enter.
            </span>
          </label>
          <div className="flex items-end pb-1">
            <span className="text-[11px] text-zinc-500">
              You can also switch engine per-project in the Artwork tab â€” the choice here is just the default.
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Audio output</SectionLabel>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          Route the studio&apos;s playback (library + master A/B preview) to a specific device â€” like the DDJ&apos;s sound card â€” instead of the laptop speakers. Pick the device, then play from the Library or Master tab.
        </p>
        <div className="mt-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Playback device</span>
            <select
              value={settings.audioOutputDevice}
              onChange={(e) => update({ audioOutputDevice: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="">Default speakers / headphones</option>
              <option value="__ddj__">ðŸŽš DDJ-800 / controller (auto-detect)</option>
            </select>
          </label>
          <AudioDevicePicker current={settings.audioOutputDevice} onPick={(id, label) => { update({ audioOutputDevice: id }); setAudioDeviceLabel(label); }} />
          {audioDeviceLabel && <p className="mt-2 text-[11px] text-zinc-500">Currently: {audioDeviceLabel} â€” output is set.</p>}
          <p className="mt-2 text-[11px] text-zinc-600">
            For the DDJ to be the sound card: plug it in via USB, pick its device name below, and Chrome/Edge will play through it. Full deck mixing (jog wheels) still needs Rekordbox.
          </p>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Pings & notifications</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">When a master finishes or an export is ready, the studio can alert you.</p>
        <div className="mt-3 space-y-2">
          <Toggle label="Sound replies from the assistant (speech)" checked={settings.soundOn} onChange={(v) => update({ soundOn: v })} />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
            <span className="text-sm text-zinc-300">Assistant voice</span>
            <select
              value={settings.voiceGender}
              onChange={(e) => update({ voiceGender: e.target.value as "male" | "female" | "auto" })}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <Toggle label="Email me when a master / export is ready" checked={settings.emailPing} onChange={(v) => update({ emailPing: v })} />
          {settings.emailPing && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
              {emailStatus === null
                ? "Checking email setupâ€¦"
                : emailStatus.configured
                  ? `âœ“ Email pings will go to ${emailStatus.to}`
                  : "Email isn't wired up yet â€” add RESEND_API_KEY + STUDIO_NOTIFY_TO in .env.local (or Vercel env) to turn it on. The in-app ping & phone notification work right now."}
            </div>
          )}
        </div>
        <div className="mt-4">
          <SectionLabel>Install as an app</SectionLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button onClick={() => void install()} disabled={!installEvt}>
              ðŸ“² Install EMY Studio on this device
            </Button>
            <span className="text-xs text-zinc-500">Adds it to her home screen like a real app â€” offline capable, gets notifications.</span>
          </div>
        </div>
      </Card>

      {serverAi?.adminConfigured ? (
        <Card className="p-4 sm:p-5">
          <SectionLabel>Developer</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">View artist improvement suggestions and the AI implementation plans â€” everything she sends lands here.</p>
          <div className="mt-3">
            <a href="/studio/admin" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-fuchsia-500/60 hover:text-fuchsia-300">
              ðŸ”§ Open the suggestion back end
            </a>
          </div>
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          <SectionLabel>Developer</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">
            Suggestions from the app are stored server-side. To view them, set{" "}
            <span className="font-mono text-zinc-300">STUDIO_ADMIN_TOKEN</span> in the app environment, then open{" "}
            <span className="font-mono text-zinc-300">/studio/admin</span> with that token.
          </p>
        </Card>
      )}

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

function StyleBrandingCard() {
  const theme = useTheme();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const patch = (p: Partial<ThemeSettings>) => saveTheme({ ...theme, ...p });

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await downscaleLogo(file);
      patch({ logoDataUrl: dataUrl });
    } catch {
      /* noop */
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionLabel>Style & branding â€” make it yours</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">Colors, font, background, corners and logo â€” applied live to the whole app, stored on this device, no code.</p>
        </div>
        <Button variant="ghost" onClick={() => resetTheme()}>Reset to default</Button>
      </div>

      {/* presets */}
      <div className="mt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Preset themes</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => saveTheme({ ...theme, primary: p.primary, accent: p.accent, background: p.background })}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                theme.primary === p.primary ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500"
              }`}
              style={{ borderLeft: `4px solid ${p.primary}` }}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.accent})` }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* custom colors */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Primary color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={theme.primary} onChange={(e) => patch({ primary: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={theme.primary} onChange={(e) => patch({ primary: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Accent color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={theme.accent} onChange={(e) => patch({ accent: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={theme.accent} onChange={(e) => patch({ accent: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Background</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={theme.background} onChange={(e) => patch({ background: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={theme.background} onChange={(e) => patch({ background: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {BACKGROUND_OPTIONS.map((b) => (
          <button
            key={b.id}
            onClick={() => patch({ background: b.value })}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              theme.background === b.value ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ background: b.value }} />
            {b.label}
          </button>
        ))}
      </div>

      {/* font + radius */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Font</span>
          <select value={theme.font} onChange={(e) => patch({ font: e.target.value as ThemeSettings["font"] })} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
            {FONT_OPTIONS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </label>
        <div className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Corners</span>
          <div className="mt-1 flex gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => patch({ radius: r.id })}
                className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  theme.radius === r.id ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* logo */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onLogo(e.target.files?.[0])} />
        <div className="brand-grad flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-xl font-black text-white shadow-lg">
          {theme.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={theme.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            "E"
          )}
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-300">{theme.logoDataUrl ? "Custom logo" : "Default 'E' mark"}</div>
          <div className="mt-1 flex gap-2">
            <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => logoInputRef.current?.click()}>â¬† Upload logo</Button>
            {theme.logoDataUrl && <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => patch({ logoDataUrl: null })}>Remove</Button>}
          </div>
        </div>
      </div>

      {/* live preview */}
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Live preview</span>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="brand-grad rounded-xl px-4 py-2 text-sm font-bold text-white brand-shadow">Primary button</div>
          <div className="brand-text-grad text-lg font-extrabold">Headline in brand</div>
          <div className="brand-soft brand-border rounded-xl px-3 py-1.5 text-xs text-zinc-200">Highlight chip</div>
        </div>
      </div>
    </Card>
  );
}

function AudioDevicePicker({ current, onPick }: { current: string; onPick: (id: string, label: string) => void }) {
  const [devices, setDevices] = useState<{ id: string; label: string }[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setError("This browser can't list output devices â€” use Chrome or Edge.");
      setLoaded(true);
      return;
    }
    void navigator.mediaDevices.enumerateDevices().then((list) => {
      const outs = list.filter((d) => d.kind === "audiooutput").map((d) => ({ id: d.deviceId, label: d.label || "Audio output" }));
      setDevices(outs);
      setLoaded(true);
    }).catch(() => {
      setError("Couldn't list devices â€” click again after interacting with the page.");
      setLoaded(true);
    });
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={load}>{loaded ? "â†» Refresh devices" : "Detect devices"}</Button>
      {devices.length > 0 && (
        <select
          value={current && current !== "__ddj__" ? current : ""}
          onChange={(e) => {
            const d = devices.find((x) => x.id === e.target.value);
            onPick(d?.id ?? "", d?.label ?? "Device");
          }}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
        >
          <option value="">Default</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
      )}
      {error && <span className="text-[11px] text-red-300">{error}</span>}
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
