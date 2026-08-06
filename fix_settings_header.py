# -*- coding: utf-8 -*-
import os, subprocess

path = "src/app/studio/settings/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

# 1. Replace the header with a safe save button version
old_header = '''<div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">? Saved on this device</span>}
      </div>'''

new_header = '''<div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Settings</h1>
        <div className="flex items-center gap-2">
          {savedFlash && <span className="text-xs font-semibold text-emerald-300">Saved</span>}
          <Button onClick={saveAll}>Save changes</Button>
        </div>
      </div>'''

if old_header in c:
    c = c.replace(old_header, new_header)
    print("PATCHED HEADER")
else:
    print("HEADER NOT FOUND")

# 2. Ensure saveAll exists, if not inject it after update()
if 'const saveAll = useCallback(() => {' not in c:
    marker = '''  const update = useCallback((patch: Partial<StudioSettings>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);'''
    replacement = '''  const update = useCallback((patch: Partial<StudioSettings>) => {
    setDraft(prev => ({ ...prev, ...patch }));
  }, []);

  const saveAll = useCallback(() => {
    saveSettings(draft);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }, [draft]);'''
    if marker in c:
        c = c.replace(marker, replacement)
        print("PATCHED saveAll")
    else:
        print("saveAll marker not found")
else:
    print("saveAll already exists")

# 3. Write file
with open(path, "w", encoding="utf-8") as f:
    f.write(c)

print(f"WROTE {path} ({os.path.getsize(path)} bytes)")

# 4. Audit
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

checks = [
    'const [draft, setDraft] = useState<StudioSettings>(settings);',
    'const saveAll = useCallback(() => {',
    '<Button onClick={saveAll}>Save changes</Button>',
    'const [themeDraft, setThemeDraft] = useState<ThemeSettings>(themeLive);',
    'Apply style changes',
    'setDraft(prev => ({ ...prev, ...patch }));',
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
    subprocess.run(["git", "commit", "-m", "Fix: settings page save button and local draft flow completed"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("DONE")
