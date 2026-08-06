# -*- coding: utf-8 -*-
import os, subprocess

def write(path, content):
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"WROTE {path} ({len(content)} bytes)")

# -- 1. SERVICE WORKER ---------------------------------------------------------
write("public/sw.js", r"""const STATIC = "emy-v9";
const DYN = "emy-dyn-v9";
const SHELL = "/studio";
const PRE = ["/studio","/studio/gigradar","/studio/analytics","/studio/distribute","/studio/community","/studio/epk","/manifest.json","/icon-192.png","/icon-512.png"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC).then(c => Promise.allSettled(PRE.map(u => c.add(u).catch(() => null)))));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== STATIC && k !== DYN).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(fetch(req).catch(() => new Response(JSON.stringify({error:"offline"}), {status:503,headers:{"Content-Type":"application/json"}})));
    return;
  }
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) caches.open(DYN).then(c => c.put(req, res.clone()));
        return res;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const shell = await caches.match(SHELL);
        return shell ?? new Response("<!DOCTYPE html><html><head><meta charset=utf-8><title>EMY Studio</title></head><body style='background:#0a0a0f;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;flex-direction:column;gap:16px'><img src='/icon-192.png' style='width:64px;border-radius:16px'><div style='font-size:20px;font-weight:900'>EMY Studio</div><div style='color:#71717a;font-size:14px'>You are offline. Reconnect and refresh.</div><a href='/studio' style='background:#7c3aed;color:#fff;padding:10px 28px;border-radius:12px;text-decoration:none;font-weight:700'>Open Studio</a></body></html>", {status:200,headers:{"Content-Type":"text/html"}});
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res.ok) caches.open(DYN).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached ?? new Response("", {status:408}));
      return cached ?? net;
    })
  );
});

self.addEventListener("message", e => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("push", e => {
  const d = e.data ? e.data.json() : {title:"EMY Studio",body:"New update"};
  e.waitUntil(self.registration.showNotification(d.title, {body:d.body,icon:"/icon-192.png"}));
});
""")

# -- 2. PWA REGISTER -----------------------------------------------------------
write("src/components/PwaRegister.tsx", '''"use client";
import { useEffect, useState } from "react";

// Heal corrupt localStorage before React boots
function healStorage() {
  ["emy-studio-projects-v1","emy-studio-settings-v1"].forEach(k => {
    try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
    catch { localStorage.removeItem(k); }
  });
}

export function PwaRegister() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    healStorage();
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(r => {
      r.addEventListener("updatefound", () => {
        const w = r.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) setReady(true);
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
  }, []);
  if (!ready) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl">
      <span className="text-sm text-zinc-200">Update ready</span>
      <button onClick={() => navigator.serviceWorker.controller?.postMessage({type:"SKIP_WAITING"})}
        className="rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500">
        Reload now
      </button>
    </div>
  );
}
''')

# -- 3. ERROR BOUNDARY ---------------------------------------------------------
write("src/components/ErrorBoundary.tsx", '''"use client";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { crashed: boolean; error?: string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError(e: Error): State {
    return { crashed: true, error: e?.message ?? "Unknown error" };
  }
  componentDidCatch() {
    // Heal storage on any crash � corrupt data is the most common cause
    try {
      ["emy-studio-projects-v1","emy-studio-settings-v1"].forEach(k => {
        try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
        catch { localStorage.removeItem(k); }
      });
    } catch {}
  }
  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <div style={{background:"#0a0a0f",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,padding:24,fontFamily:"sans-serif",color:"#fff",textAlign:"center"}}>
        <img src="/icon-192.png" style={{width:64,borderRadius:16}} alt="EMY Studio" />
        <div style={{fontSize:20,fontWeight:900}}>EMY Studio</div>
        <div style={{color:"#71717a",fontSize:14,maxWidth:320}}>Something went wrong. Your projects are safe � tap below to reload.</div>
        <button onClick={() => { this.setState({crashed:false}); window.location.reload(); }}
          style={{background:"#7c3aed",color:"#fff",padding:"10px 28px",borderRadius:12,border:"none",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          Reload Studio
        </button>
        <button onClick={() => { localStorage.removeItem("emy-studio-projects-v1"); localStorage.removeItem("emy-studio-settings-v1"); window.location.reload(); }}
          style={{background:"transparent",color:"#71717a",border:"1px solid #3f3f46",padding:"8px 20px",borderRadius:10,fontSize:12,cursor:"pointer"}}>
          Clear data and reload
        </button>
      </div>
    );
  }
}
''')

# -- 4. LAYOUT � add ErrorBoundary ---------------------------------------------
write("src/app/layout.tsx", '''import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { GlobalAssistant } from "@/components/studio/GlobalAssistant";
import { ThemeProvider } from "@/components/studio/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "EMY Studio � DJ Emy",
  description: "Master your mixes, design covers, package releases. Your whole production studio � laptop and phone, offline and online.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "EMY Studio" },
  icons: { icon: "/icon-512.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0f] text-zinc-100 antialiased">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <PwaRegister />
        <GlobalAssistant />
        <ThemeProvider />
      </body>
    </html>
  );
}
''')

# -- 5. STORE � fix subscribe to not loop -------------------------------------
write("src/lib/studio/store.ts", '''"use client";
import { useSyncExternalStore } from "react";
import { newId } from "./id";
import { DEFAULT_SETTINGS } from "./types";

const PROJECTS_KEY = "emy-studio-projects-v1";
const SETTINGS_KEY = "emy-studio-settings-v1";

// Module-level cache � same raw string = same object reference = no re-render
let settingsCache: { raw: string | null; s: any } | null = null;
let projectsCache: { raw: string | null; list: any[] } | null = null;

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(key); } catch { return null; }
}

export function loadSettings(): any {
  const raw = readRaw(SETTINGS_KEY);
  if (settingsCache && settingsCache.raw === raw) return settingsCache.s;
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad");
    const s = { ...DEFAULT_SETTINGS, ...parsed };
    settingsCache = { raw, s };
    return s;
  } catch {
    try { window.localStorage.removeItem(SETTINGS_KEY); } catch {}
    settingsCache = { raw: null, s: DEFAULT_SETTINGS };
    return DEFAULT_SETTINGS;
  }
}

export function loadProjects(): any[] {
  const raw = readRaw(PROJECTS_KEY);
  if (projectsCache && projectsCache.raw === raw) return projectsCache.list;
  try {
    let list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) throw new Error("bad");
    list = list.filter((p: any) => p && p.meta && p.meta.id);
    list.sort((a: any, b: any) => (b.meta?.updatedAt || 0) - (a.meta?.updatedAt || 0));
    projectsCache = { raw, list };
    return list;
  } catch {
    try { window.localStorage.removeItem(PROJECTS_KEY); } catch {}
    projectsCache = { raw: null, list: [] };
    return [];
  }
}

// Internal listener set � NOT the storage event (avoids cross-tab loops)
const listeners = new Set<() => void>();
function emit() { listeners.forEach(l => l()); }

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function saveSettings(s: any): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
    settingsCache = null; // bust cache so next read picks up new value
  } catch {}
  emit();
}

export function saveProjects(list: any[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
    projectsCache = null; // bust cache
  } catch {}
  emit();
}

export function getProject(id: string): any {
  return loadProjects().find((p: any) => p.meta?.id === id);
}

export function upsertProject(p: any): void {
  const list = loadProjects();
  const i = list.findIndex((x: any) => x.meta?.id === p.meta?.id);
  if (p.meta) p.meta.updatedAt = Date.now();
  if (i >= 0) list[i] = p; else list.unshift(p);
  saveProjects(list);
}

export function createProject(partial: any): any {
  const now = Date.now();
  return {
    meta: { id: newId(), name: partial.name, kind: partial.kind, genre: partial.genre, mood: partial.mood, createdAt: now, updatedAt: now, stage: "draft", mastered: false, artworkDone: false, releaseDone: false },
    masterParams: { targetLufs: -14, lowGainDb: 0, midGainDb: 0, highGainDb: 0, rumbleFilter: true, compThreshold: -16, compRatio: 2.2, limiterDrive: 0.65, ceilingDb: -1 },
    chatHistory: [],
  };
}

export function deleteProject(id: string): void {
  saveProjects(loadProjects().filter((p: any) => p.meta?.id !== id));
}

const EMPTY: any[] = [];
export function useProjects(): any[] {
  return useSyncExternalStore(subscribe, loadProjects, () => EMPTY);
}
export function useSettings(): any {
  return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS);
}
''')

# -- 6. VERCEL.JSON � correct cache headers ------------------------------------
write("vercel.json", '''{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ],
  "crons": [
    { "path": "/api/sweep", "schedule": "0 6 * * *" }
  ]
}
''')

# -- 7. STUDIO PAGE � restore logo ---------------------------------------------
path = "src/app/studio/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    c = f.read()

old = '        <div>\n          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Your studio, one place</h1>\n          <p className="mt-1 max-w-xl text-sm text-zinc-400">Master the mix, design the cover, package the release, pass the platform checks \u2014 no engineer, no designer, no hours of grunt work.</p>\n        </div>'

new = '        <div className="flex flex-col gap-1">\n          <div className="flex items-center gap-2">\n            <img src="/icon-192.png" alt="EMY Studio" className="h-9 w-9 rounded-xl shadow-lg" />\n            <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">EMY Studio</h1>\n          </div>\n          <p className="mt-1 max-w-xl text-sm text-zinc-400">Master the mix, design the cover, package the release, pass the platform checks \u2014 no engineer, no designer, no hours of grunt work.</p>\n        </div>'

if old in c:
    c = c.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(c)
    print("WROTE logo into studio/page.tsx")
else:
    print("WARNING: logo pattern not found in studio/page.tsx � skipping")

# -- GIT PUSH ------------------------------------------------------------------
subprocess.run(["git", "add", "-A"], check=True)
result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print(result.stdout)
subprocess.run(["git", "commit", "-m", "Phase 8: Full protection - ErrorBoundary + SW v9 + store fix + logo + vercel headers"], check=True)
subprocess.run(["git", "push", "origin", "main"], check=True)
print("DONE - ALL PROTECTION DEPLOYED")
