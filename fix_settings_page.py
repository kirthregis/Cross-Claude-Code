# -*- coding: utf-8 -*-
import os, subprocess

path = "src/app/studio/settings/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1) Add local draft state for StudioSettings
old = '  const settings = useSettings();'
new = '''  const settings = useSettings();
  const [draft, setDraft] = useState<StudioSettings>(settings);
  useEffect(() => {
    setDraft(settings);
  }, [settings]);'''
c = c.replace(old, new)

# 2) Replace instant-save update() with local-draft update()
old = '''  const update = useCallback((patch: Partial<StudioSettings>) => {
    saveSettings({ ...settings, ...patch });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, [settings]);'''
new = '''  const update = useCallback((patch: Partial<StudioSettings>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const saveAll = useCallback(() => {
    saveSettings(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, [draft]);'''
c = c.replace(old, new)

# 3) Replace settings. -> draft. everywhere in render and callbacks
c = c.replace("settings.", "draft.")

# 4) Add Save changes button in header
old = '''      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">? Saved on this device</span>}
      </div>'''
new = '''      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        <div className="flex items-center gap-2">
          {savedFlash && <span className="text-xs font-semibold text-emerald-300">Saved</span>}
          <Button onClick={saveAll}>Save changes</Button>
        </div>
      </div>'''
c = c.replace(old, new)

# 5) Replace the entire StyleBrandingCard with a draft-based version
start = c.find('function StyleBrandingCard() {')
end = c.find('function AudioDevicePicker(')
if start == -1 or end == -1:
    raise SystemExit("Could not find StyleBrandingCard boundaries.")

new_style = r'''
function StyleBrandingCard() {
  const themeLive = useTheme();
  const [themeDraft, setThemeDraft] = useState<ThemeSettings>(themeLive);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setThemeDraft(themeLive);
  }, [themeLive.primary, themeLive.accent, themeLive.background, themeLive.font, themeLive.radius, themeLive.logoDataUrl]);

  const patch = (p: Partial<ThemeSettings>) => setThemeDraft(prev => ({ ...prev, ...p }));

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    try {
      const dataUrl = await downscaleLogo(file);
      patch({ logoDataUrl: dataUrl });
    } catch {}
  };

  const applyThemeChanges = () => {
    saveTheme(themeDraft);
  };

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionLabel>Style & branding</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">Edit safely here, then apply once.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => resetTheme()}>Reset</Button>
          <Button onClick={applyThemeChanges}>Apply style changes</Button>
        </div>
      </div>

      <div className="mt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Preset themes</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {THEME_PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => patch({ primary: p.primary, accent: p.accent, background: p.background })}
              className={"flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition " + (themeDraft.primary === p.primary ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500")}
              style={{ borderLeft: "4px solid " + p.primary }}
            >
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
          <button
            key={b.id}
            onClick={() => patch({ background: b.value })}
            className={"flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition " + (themeDraft.background === b.value ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-500 hover:text-zinc-300")}
          >
            <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ background: b.value }} />
            {b.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Font</span>
          <select
            value={themeDraft.font}
            onChange={e => patch({ font: e.target.value as ThemeSettings["font"] })}
            className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
          >
            {FONT_OPTIONS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </label>
        <div className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Corners</span>
          <div className="mt-1 flex gap-1.5">
            {RADIUS_OPTIONS.map(r => (
              <button
                key={r.id}
                onClick={() => patch({ radius: r.id })}
                className={"flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition " + (themeDraft.radius === r.id ? "border-fuchsia-500/70 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-950 text-zinc-400")}
              >
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

'''
c = c[:start] + new_style + c[end:]

with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print(f"WROTE {path} ({os.path.getsize(path)} bytes)")

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

checks = [
    "const [draft, setDraft] = useState<StudioSettings>(settings);",
    "saveAll",
    "Button onClick={saveAll}",
    "const [themeDraft, setThemeDraft]",
    "Apply style changes",
    "setDraft(prev => ({ ...prev, ...patch }))",
]
missing = [x for x in checks if x not in content]
if missing:
    print("AUDIT FAILED:")
    for m in missing:
        print("  MISSING:", m)
else:
    print(f"AUDIT OK - {len(checks)} checks passed")
    subprocess.run(["git", "add", path], check=True)
    r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    print(r.stdout)
    subprocess.run(["git", "commit", "-m", "Fix: Settings page uses local drafts and explicit save/apply - stops crash loop"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("DONE")
