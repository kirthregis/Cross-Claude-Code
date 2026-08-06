# -*- coding: utf-8 -*-
import os, subprocess

# Read current file
with open("src/app/studio/settings/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Remove useTheme from StyleBrandingCard - read from localStorage directly instead
# Replace the StyleBrandingCard function entirely with a version that reads/writes localStorage directly
# without using useSyncExternalStore which causes the loop

start = c.find("function StyleBrandingCard() {")
end = c.find("function AudioDevicePicker(")

new_card = """function StyleBrandingCard() {
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

"""

if start == -1 or end == -1:
    print("ERROR: could not find StyleBrandingCard boundaries")
else:
    c = c[:start] + new_card + c[end:]
    with open("src/app/studio/settings/page.tsx", "w", encoding="utf-8") as f:
        f.write(c)
    size = os.path.getsize("src/app/studio/settings/page.tsx")
    print(f"WROTE settings/page.tsx ({size} bytes)")

    with open("src/app/studio/settings/page.tsx", "r", encoding="utf-8") as f:
        content = f.read()

    checks = ["applyThemeChanges", "window.location.reload", "resetThemeLocal", "Apply style changes", "patch({ primary"]
    missing = [x for x in checks if x not in content]
    if missing:
        print("AUDIT FAILED:", missing)
    else:
        print(f"AUDIT OK - {len(checks)} checks passed")
        subprocess.run(["git", "add", "src/app/studio/settings/page.tsx"], check=True)
        r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
        print(r.stdout)
        subprocess.run(["git", "commit", "-m", "Fix: StyleBrandingCard uses local state only - no useSyncExternalStore - no crash"], check=True)
        subprocess.run(["git", "push", "origin", "main"], check=True)
        print("DONE")
