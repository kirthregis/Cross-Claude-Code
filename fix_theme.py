# -*- coding: utf-8 -*-
import subprocess, os

with open("src/lib/studio/theme.ts", "r", encoding="utf-8") as f:
    c = f.read()

old = "const KEY = \"emy-studio-theme-v1\";\n\nfunction read(): ThemeSettings {"
new = "const KEY = \"emy-studio-theme-v1\";\n\n// Memoised cache - same raw string = same object reference = no infinite loop\nlet themeCache: { raw: string | null; t: ThemeSettings } | null = null;\n\nfunction read(): ThemeSettings {"

if old in c:
    c = c.replace(old, new)
    print("PATCHED: added themeCache declaration")
else:
    print("PATTERN 1 NOT FOUND")

old2 = "  if (typeof window === \"undefined\") return DEFAULT_THEME;\n  try {\n    const raw = window.localStorage.getItem(KEY);\n    if (!raw) return DEFAULT_THEME;\n    const p = JSON.parse(raw) as Partial<ThemeSettings>;\n    return {"
new2 = "  if (typeof window === \"undefined\") return DEFAULT_THEME;\n  try {\n    const raw = window.localStorage.getItem(KEY);\n    if (!raw) { themeCache = null; return DEFAULT_THEME; }\n    if (themeCache && themeCache.raw === raw) return themeCache.t;\n    const p = JSON.parse(raw) as Partial<ThemeSettings>;\n    const t = {"

if old2 in c:
    c = c.replace(old2, new2)
    print("PATCHED: added cache check")
else:
    print("PATTERN 2 NOT FOUND")

old3 = "      logoDataUrl: typeof p.logoDataUrl === \"string\" ? p.logoDataUrl : null,\n    };\n  } catch {"
new3 = "      logoDataUrl: typeof p.logoDataUrl === \"string\" ? p.logoDataUrl : null,\n    };\n    themeCache = { raw, t };\n    return t;\n  } catch {"

if old3 in c:
    c = c.replace(old3, new3)
    print("PATCHED: added cache save")
else:
    print("PATTERN 3 NOT FOUND")

old4 = "export function saveTheme(t: ThemeSettings): void {\n  try {\n    window.localStorage.setItem(KEY, JSON.stringify(t));\n  } catch {\n    /* noop */\n  }\n  emit();\n}"
new4 = "export function saveTheme(t: ThemeSettings): void {\n  try {\n    window.localStorage.setItem(KEY, JSON.stringify(t));\n    themeCache = null; // bust cache so next read picks up new value\n  } catch {\n    /* noop */\n  }\n  emit();\n}"

if old4 in c:
    c = c.replace(old4, new4)
    print("PATCHED: bust cache on save")
else:
    print("PATTERN 4 NOT FOUND")

old5 = "export function resetTheme(): void {\n  try {\n    window.localStorage.removeItem(KEY);\n  } catch {\n    /* noop */\n  }\n  emit();\n}"
new5 = "export function resetTheme(): void {\n  try {\n    window.localStorage.removeItem(KEY);\n    themeCache = null; // bust cache\n  } catch {\n    /* noop */\n  }\n  emit();\n}"

if old5 in c:
    c = c.replace(old5, new5)
    print("PATCHED: bust cache on reset")
else:
    print("PATTERN 5 NOT FOUND")

with open("src/lib/studio/theme.ts", "w", encoding="utf-8") as f:
    f.write(c)

print(f"WROTE src/lib/studio/theme.ts ({os.path.getsize('src/lib/studio/theme.ts')} bytes)")

with open("src/lib/studio/theme.ts", "r", encoding="utf-8") as f:
    content = f.read()

checks = ["themeCache", "themeCache.raw === raw", "themeCache = null", "themeCache = { raw, t }"]
missing = [x for x in checks if x not in content]
if missing:
    print("AUDIT FAILED:", missing)
else:
    print(f"AUDIT OK - {len(checks)} checks passed")
    subprocess.run(["git", "add", "src/lib/studio/theme.ts"], check=True)
    r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
    print(r.stdout)
    subprocess.run(["git", "commit", "-m", "Fix: theme store memoisation - stops infinite loop crash on settings page"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)
    print("DONE")
