"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getProject, loadSettings } from "@/lib/studio/store";
import type { Project } from "@/lib/studio/types";
import { MasterPanel } from "@/components/studio/MasterPanel";
import { ArtworkPanel } from "@/components/studio/ArtworkPanel";
import { ReleasePanel } from "@/components/studio/ReleasePanel";
import { CheckPanel } from "@/components/studio/CheckPanel";
import { AssistantPanel } from "@/components/studio/AssistantPanel";

type Tab = "assistant" | "master" | "artwork" | "release" | "check";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "assistant", label: "Assistant", icon: "🎧" },
  { id: "master", label: "Master", icon: "🎚" },
  { id: "artwork", label: "Artwork", icon: "🎨" },
  { id: "release", label: "Release", icon: "📦" },
  { id: "check", label: "Check", icon: "✅" },
];

function safeGetProject(id: string): Project | null {
  try {
    return getProject(id) ?? null;
  } catch {
    try { localStorage.removeItem("emy-studio-projects-v1"); } catch {}
    return null;
  }
}

export default function ProjectEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublic = searchParams.get("view") === "public";
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab | null) ?? "assistant");

  useEffect(() => {
    let attempts = 0;
    const load = () => {
      const p = safeGetProject(id);
      if (p) { setProject(p); return; }
      if (++attempts < 3) setTimeout(load, 200);
      else setNotFound(true);
    };
    load();
  }, [id]);

  const refresh = useCallback(() => {
    const p = safeGetProject(id);
    if (p) setProject({ ...p });
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-5xl">{isPublic ? "🎵" : "❌"}</div>
      <h1 className="text-xl font-black text-white">{isPublic ? "Release not found" : "Project not found"}</h1>
      <p className="text-zinc-500 text-sm max-w-sm">
        {isPublic
          ? "This link may have expired or been removed."
          : "This project no longer exists on this device. Projects are stored locally and do not sync between devices."}
      </p>
      <Link href="/studio" className="mt-2 rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 transition">
        Back to Studio
      </Link>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-zinc-500 text-sm animate-pulse">Loading project...</div>
    </div>
  );

  const settings = loadSettings();
  const stages = [
    { key: "mastered", label: "Master", done: project.meta.mastered, tab: "master" as Tab },
    { key: "artworkDone", label: "Art", done: project.meta.artworkDone, tab: "artwork" as Tab },
    { key: "releaseDone", label: "Release", done: project.meta.releaseDone, tab: "release" as Tab },
  ];
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/studio/p/${id}?view=public`;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0a0a0f]/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/studio" className="text-zinc-500 hover:text-white text-sm shrink-0">← Studio</Link>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{project.meta.name}</h1>
                <p className="text-[10px] text-zinc-500">{project.meta.kind === "mix" ? "🎧 Mix" : "🎵 Track"} · {project.meta.genre}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {stages.map((s) => (
                <button key={s.key} onClick={() => setTab(s.tab)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${s.done ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-600"}`}>
                  {s.done ? "✓" : "○"} {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {tab === "assistant" && (
          <div className="space-y-4">
            <AssistantPanel
              project={project}
              onNavigate={(path) => {
                const url = new URL(path, window.location.origin);
                const t = url.searchParams.get("tab") as Tab | null;
                if (t && TABS.find((x) => x.id === t)) setTab(t);
                else router.push(path);
              }}
              onCreateProject={() => router.push("/studio")}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              {stages.map((s) => (
                <button key={s.key} onClick={() => setTab(s.tab)}
                  className={`rounded-2xl border p-4 text-left transition ${s.done ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"}`}>
                  <div className={`text-lg ${s.done ? "text-emerald-400" : "text-zinc-600"}`}>{s.done ? "✅" : "⭕"}</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-200">{s.label}</div>
                  <div className="text-xs text-zinc-500">{s.done ? "Done — click to review" : "Not done — click to start"}</div>
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Public Artist Page</p>
              <p className="text-xs text-zinc-500 mb-3">Share this link with fans and promoters.</p>
              <div className="flex items-center gap-2">
                <input readOnly value={publicUrl} className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300" />
                <button onClick={() => void navigator.clipboard.writeText(publicUrl)}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">Copy</button>
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">Open</a>
              </div>
            </div>
          </div>
        )}
        {tab === "master" && <MasterPanel project={project} onChanged={refresh} />}
        {tab === "artwork" && <ArtworkPanel project={project} onChanged={refresh} />}
        {tab === "release" && <ReleasePanel project={project} onChanged={refresh} />}
        {tab === "check" && <CheckPanel project={project} />}
      </main>
    </div>
  );
}