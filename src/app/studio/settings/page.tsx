"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Card, SectionLabel, Toggle } from "@/components/studio/ui";
import { geminiChat, isGeminiConfigured } from "@/lib/studio/gemini";
import { FAL_MODELS, isFalConfigured } from "@/lib/studio/fal";
import type { ProjectKind, StudioSettings } from "@/lib/studio/types";
import { DEFAULT_SETTINGS } from "@/lib/studio/types";
import { useSettings, saveSettings } from "@/lib/studio/store";
import { BACKGROUND_OPTIONS, FONT_OPTIONS, RADIUS_OPTIONS, THEME_PRESETS, downscaleLogo, resetTheme, saveTheme, useTheme, type ThemeSettings } from "@/lib/studio/theme";

export default function StudioSettingsPage() {
  const settings = useSettings();
  const [draft, setDraft] = useState<StudioSettings>(settings);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ configured: boolean; to: string } | null>(null);
  const [installEvt, setInstallEvt] = useState<{ prompt: () => Promise<void>; userChoice: Promise<unknown> } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showFalKey, setShowFalKey] = useState(false);
  const [audioDeviceLabel, setAudioDeviceLabel] = useState<string | null>(null);
  const [serverAi, setServerAi] = useState<{ serverGemini: boolean; serverFal: boolean; adminConfigured: boolean } | null>(null);

  useEffect(() => { setDraft(settings); }, [settings]);

  useEffect(() => {
    fetch("/api/studio/status").then(r => r.json()).then(j => {
      setEmailStatus({ configured: !!j.emailConfigured, to: j.emailTo || "" });
      setServerAi({ serverGemini: !!j.serverGemini, serverFal: !!j.serverFal, adminConfigured: !!j.adminConfigured });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as unknown as { prompt: () => Promise<void>; userChoice: Promise<unknown> }); };
    window.addEventListener("beforeinstallprompt", h);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  const update = useCallback((patch: Partial<StudioSettings>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const saveAll = useCallback(() => {
    saveSettings(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, [draft]);

  const testGemini = useCallback(async () => {
    setTesting(true); setTestResult(null);
    try {
      const res = await geminiChat({ key: draft.geminiKey, model: draft.geminiTextModel, messages: [{ role: "user", parts: [{ text: "Reply with exactly: OK" }] }] });
      setTestResult({ ok: true, text: res.text.slice(0, 80) });
    } catch (e) { setTestResult({ ok: false, text: e instanceof Error ? e.message : "Failed" }); }
    finally { setTesting(false); }
  }, [draft.geminiKey, draft.geminiTextModel]);

  const install = useCallback(async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice;
    setInstallEvt(null);
  }, [installEvt]);

  const resetAll = useCallback(() => {
    if (!confirm("Reset ALL studio data on this device? This cannot be undone.")) return;
    try {
      window.localStorage.removeItem("emy-studio-projects-v1");
      window.localStorage.removeItem("emy-studio-settings-v1");
      window.indexedDB.deleteDatabase("emy-studio");
    } catch {}
    window.location.reload();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        <div className="flex items-center gap-2">
          {savedFlash && <span className="text-xs font-semibold text-emerald-300">Saved</span>}
          <Button onClick={saveAll}>Save changes</Button>
        </div>
      </div>

      <StyleBrandingCard />

      <Card className="p-4 sm:p-5">
        <SectionLabel>Artist profile</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Used in release titles, descriptions and file names.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Artist name" value={draft.artistName} onChange={v => update({ artistName: v })} />
          <Field label="YouTube handle" value={draft.youtubeChannel} onChange={v => update({ youtubeChannel: v })} />
          <Field label="Instagram" value={draft.instagram} onChange={v => update({ instagram: v })} />
          <Field label="TikTok" value={draft.tiktok} onChange={v => update({ tiktok: v })} />
          <Field label="Default genre" value={draft.defaultGenre} onChange={v => update({ defaultGenre: v })} />
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Default project type</span>
            <select value={draft.defaultKind} onChange={e => update({ defaultKind: e.target.value as ProjectKind })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="mix">DJ Mix</option>
              <option value="track">Track</option>
            </select>
          </label>
          <Field label="Default loudness target (LUFS)" value={String(draft.defaultTargetLufs)} onChange={v => update({ defaultTargetLufs: parseFloat(v) || -14 })} />
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Analytics - YouTube Data API</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Get your free YouTube Data API v3 key from <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">Google Cloud Console</a>, then paste it below.</p>
        <div className="mt-3">
          <Field label="YouTube Data API Key" value={draft.youtubeApiKey ?? ""} onChange={v => update({ youtubeApiKey: v })} />
        </div>
        {draft.youtubeApiKey && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">API key saved</span>
            <a href="/studio/analytics" className="text-xs text-fuchsia-400 hover:underline">Open Analytics</a>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <SectionLabel>AI - chat (Gemini)</SectionLabel>
          {serverAi?.serverGemini ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Configured by developer</span>
          ) : isGeminiConfigured(draft) ? (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Connected (this device)</span>
          ) : (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-300">Not configured</span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">Get a free key at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">aistudio.google.com/apikey</a>.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Gemini API key</span>
            <div className="mt-1 flex gap-2">
              <input type={showKey ? "text" : "password"} value={draft.geminiKey} onChange={e => update({ geminiKey: e.target.value })} placeholder="AIza..."
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none" />
              <Button variant="ghost" className="!px-3" onClick={() => setShowKey(v => !v)}>{showKey ? "Hide" : "Show"}</Button>
            </div>
          </label>
          <div className="grid gap-3">
            <Field label="Chat model" value={draft.geminiTextModel} onChange={v => update({ geminiTextModel: v })} />
            <Field label="Image model" value={draft.geminiImageModel} onChange={v => update({ geminiImageModel: v })} />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button variant="ghost" onClick={() => void testGemini()} disabled={testing || !draft.geminiKey.trim()}>{testing ? "Testing..." : "Test connection"}</Button>
          {testResult && <span className={"text-xs " + (testResult.ok ? "text-emerald-300" : "text-red-300")}>{testResult.ok ? "Gemini says: " + testResult.text : testResult.text}</span>}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Analytics - Spotify</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Get a free Client ID at <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" className="text-fuchsia-400 hover:underline">developer.spotify.com/dashboard</a>.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Spotify Client ID" value={draft.spotifyClientId ?? ""} onChange={v => update({ spotifyClientId: v })} />
          <Field label="Spotify Artist ID" value={draft.spotifyArtistId ?? ""} onChange={v => update({ spotifyArtistId: v })} />
        </div>
        {draft.spotifyClientId && draft.spotifyArtistId && (
          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Credentials saved</span>
            <a href="/studio/analytics" className="text-xs text-fuchsia-400 hover:underline">Open Analytics</a>
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Image generation</SectionLabel>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {serverAi?.serverFal && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 sm:col-span-2">
              fal.ai is pre-configured on the server.
            </div>
          )}
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Default image engine</span>
            <select value={draft.imageProvider} onChange={e => update({ imageProvider: e.target.value as "gemini" | "fal" })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="gemini">Gemini - free tier</option>
              <option value="fal">fal.ai - Flux / Recraft / Ideogram</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">fal.ai model</span>
            <select value={draft.falModel} onChange={e => update({ falModel: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              {FAL_MODELS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              fal.ai API key
              {isFalConfigured(draft) && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-normal text-emerald-300">Saved</span>}
            </span>
            <div className="mt-1 flex gap-2">
              <input type={showFalKey ? "text" : "password"} value={draft.falKey} onChange={e => update({ falKey: e.target.value })} placeholder="Your fal.ai key"
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none" />
              <Button variant="ghost" className="!px-3" onClick={() => setShowFalKey(v => !v)}>{showFalKey ? "Hide" : "Show"}</Button>
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Audio output</SectionLabel>
        <div className="mt-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Playback device</span>
            <select value={draft.audioOutputDevice} onChange={e => update({ audioOutputDevice: e.target.value })}
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="">Default speakers / headphones</option>
              <option value="__ddj__">DDJ-800 / controller (auto-detect)</option>
            </select>
          </label>
          <AudioDevicePicker current={draft.audioOutputDevice} onPick={(id, label) => { update({ audioOutputDevice: id }); setAudioDeviceLabel(label); }} />
          {audioDeviceLabel && <p className="mt-2 text-[11px] text-zinc-500">Currently: {audioDeviceLabel}</p>}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <SectionLabel>Notifications</SectionLabel>
        <div className="mt-3 space-y-2">
          <Toggle label="Sound replies from the assistant" checked={draft.soundOn} onChange={v => update({ soundOn: v })} />
          <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-3 py-2.5">
            <span className="text-sm text-zinc-300">Assistant voice</span>
            <select value={draft.voiceGender} onChange={e => update({ voiceGender: e.target.value as "male" | "female" | "auto" })}
              className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="auto">Auto</option>
            </select>
          </label>
          <Toggle label="Email me when a master / export is ready" checked={draft.emailPing} onChange={v => update({ emailPing: v })} />
          {draft.emailPing && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
              {emailStatus === null ? "Checking email setup..." : emailStatus.configured ? "Email pings will go to " + emailStatus.to : "Email not wired up yet - add RESEND_API_KEY in Vercel env."}
            </div>
          )}
        </div>
        <div className="mt-4">
          <SectionLabel>Install as an app</SectionLabel>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button onClick={() => void install()} disabled={!installEvt}>Install EMY Studio on this device</Button>
            <span className="text-xs text-zinc-500">Adds it to home screen - offline capable.</span>
          </div>
        </div>
      </Card>

      {serverAi?.adminConfigured ? (
        <Card className="p-4 sm:p-5">
          <SectionLabel>Developer</SectionLabel>
          <div className="mt-3">
            <a href="/studio/admin" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-fuchsia-500/60">
              Open the suggestion back end
            </a>
          </div>
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          <SectionLabel>Developer</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">Set <span className="font-mono text-zinc-300">STUDIO_ADMIN_TOKEN</span> in the app environment, then open <span className="font-mono text-zinc-300">/studio/admin</span>.</p>
        </Card>
      )}

      <Card className="border-red-900/40 p-4 sm:p-5">
        <SectionLabel>Danger zone</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Removes all projects and settings stored on this device.</p>
        <div className="mt-3">
          <Button variant="danger" onClick={resetAll}>Reset all studio data</Button>
        </div>
      </Card>
    </div>
  );
}

function StyleBrandingCard() {
  const [themeDraft, setThemeDraft] = useState(() => {
    try {
      const raw = localStorage.getItem("emy-studio-theme-v1");
      return raw ? { primary: "#c026d3", accent: "#f59e0b", background: "#0a0a0f", font: "inter", radius: "soft", logoDataUrl: null, ...JSON.parse(raw) } : { primary: "#c026d3", accent: "#f59e0b", background: "#0a0a0f", font: "inter", radius: "soft", logoDataUrl: null };
    } catch { return { primary: "#c026d3", accent: "#f59e0b", background: "#0a0a0f", font: "inter", radius: "soft", logoDataUrl: null }; }
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const patch = (p: Partial<ThemeSettings>) => setThemeDraft((prev: ThemeSettings) => ({ ...prev, ...p }));
  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    try { const dataUrl = await downscaleLogo(file); patch({ logoDataUrl: dataUrl }); } catch {}
  };
  const applyThemeChanges = () => {
    try { localStorage.setItem("emy-studio-theme-v1", JSON.stringify(themeDraft)); } catch {}
    window.location.reload();
  };
  const resetThemeLocal = () => {
    try { localStorage.removeItem("emy-studio-theme-v1"); } catch {}
    setThemeDraft({ primary: "#c026d3", accent: "#f59e0b", background: "#0a0a0f", font: "inter", radius: "soft", logoDataUrl: null });
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionLabel>Style and branding</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">Pick your style, then click Apply. The page reloads to apply the theme.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={resetThemeLocal}>Reset</Button>
          <Button onClick={applyThemeChanges}>Apply style changes</Button>
        </div>
      </div>
      <div className="mt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Preset themes</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_PRESETS.map(p => (
            <button key={p.id} onClick={() => patch({ primary: p.primary, accent: p.accent, background: p.background })}
              className={"flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition " + (themeDraft.primary === p.primary ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500")}
              style={{ borderLeft: "4px solid " + p.primary }}>
              <span className="h-3 w-3 rounded-full" style={{ background: "linear-gradient(135deg, " + p.primary + ", " + p.accent + ")" }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Primary color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={themeDraft.primary} onChange={e => patch({ primary: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={themeDraft.primary} onChange={e => patch({ primary: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Accent color</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={themeDraft.accent} onChange={e => patch({ accent: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={themeDraft.accent} onChange={e => patch({ accent: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Background</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={themeDraft.background} onChange={e => patch({ background: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-zinc-700 bg-zinc-950" />
            <input value={themeDraft.background} onChange={e => patch({ background: e.target.value })} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-200" />
          </div>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {BACKGROUND_OPTIONS.map(b => (
          <button key={b.id} onClick={() => patch({ background: b.value })}
            className={"flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition " + (themeDraft.background === b.value ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300")}>
            <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ background: b.value }} />{b.label}
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Font</span>
          <select value={themeDraft.font} onChange={e => patch({ font: e.target.value as ThemeSettings["font"] })}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
            {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <div className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Corners</span>
          <div className="mt-1 flex gap-1.5">
            {RADIUS_OPTIONS.map(r => (
              <button key={r.id} onClick={() => patch({ radius: r.id })}
                className={"flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition " + (themeDraft.radius === r.id ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400")}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={e => void onLogo(e.target.files?.[0])} />
        <div className="brand-grad flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-xl font-black text-white shadow-lg">
          {themeDraft.logoDataUrl ? <img src={themeDraft.logoDataUrl} alt="Logo" className="h-full w-full object-cover" /> : "E"}
        </div>
        <div>
          <div className="text-xs font-semibold text-zinc-300">{themeDraft.logoDataUrl ? "Custom logo" : "Default E mark"}</div>
          <div className="mt-1 flex gap-2">
            <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => logoInputRef.current?.click()}>Upload logo</Button>
            {themeDraft.logoDataUrl && <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => patch({ logoDataUrl: null })}>Remove</Button>}
          </div>
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
    if (!navigator.mediaDevices?.enumerateDevices) { setError("This browser cannot list output devices."); setLoaded(true); return; }
    void navigator.mediaDevices.enumerateDevices().then(list => {
      setDevices(list.filter(d => d.kind === "audiooutput").map(d => ({ id: d.deviceId, label: d.label || "Audio output" })));
      setLoaded(true);
    }).catch(() => { setError("Could not list devices."); setLoaded(true); });
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <Button variant="ghost" onClick={load}>{loaded ? "Refresh devices" : "Detect devices"}</Button>
      {devices.length > 0 && (
        <select value={current && current !== "__ddj__" ? current : ""} onChange={e => { const d = devices.find(x => x.id === e.target.value); onPick(d?.id ?? "", d?.label ?? "Device"); }}
          className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
          <option value="">Default</option>
          {devices.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
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
      <input value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none" />
    </label>
  );
}