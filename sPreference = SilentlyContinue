"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getProject, upsertProject, loadSettings } from "@/lib/studio/store";
import type { Project } from "@/lib/studio/types";
import { MasterPanel } from "@/components/studio/MasterPanel";
import { ArtworkPanel } from "@/components/studio/ArtworkPanel";
import { ReleasePanel } from "@/components/studio/ReleasePanel";
import { CheckPanel } from "@/components/studio/CheckPanel";
import { AssistantPanel } from "@/components/studio/AssistantPanel";

// Public release page imports
import { generateWhatsAppLink } from "@/lib/outreach";

const PLATFORM_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  spotify: { label: "Spotify", icon: "🟢", color: "bg-[#1DB954] hover:bg-[#1ed760]" },
  appleMusic: { label: "Apple Music", icon: "🍎", color: "bg-[#fc3c44] hover:bg-[#ff4d55]" },
  youtube: { label: "YouTube", icon: "▶", color: "bg-[#FF0000] hover:bg-[#cc0000]" },
  soundcloud: { label: "SoundCloud", icon: "☁", color: "bg-[#ff5500] hover:bg-[#ff6a1a]" },
  tidal: { label: "Tidal", icon: "〰", color: "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700" },
  bandcamp: { label: "Bandcamp", icon: "🎵", color: "bg-[#1da0c3] hover:bg-[#22b5da]" },
};

type Tab = "assistant" | "master" | "artwork" | "release" | "check";
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "assistant", label: "Assistant", icon: "🎧" },
  { id: "master", label: "Master", icon: "🎚" },
  { id: "artwork", label: "Artwork", icon: "🎨" },
  { id: "release", label: "Release", icon: "📦" },
  { id: "check", label: "Check", icon: "✅" },
];

export default function ProjectEditorClient({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublic = searchParams.get("view") === "public";

  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "assistant");

  useEffect(() => {
    const p = getProject(id);
    if (p) setProject(p);
    else setNotFound(true);
  }, [id]);

  const refresh = useCallback(() => {
    const p = getProject(id);
    if (p) setProject({ ...p });
  }, [id]);

  // ── PUBLIC VIEW ──────────────────────────────────────────────────────
  if (isPublic || (project && !getProject(id))) {
    if (notFound) return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🎵</div>
          <p className="text-2xl font-black text-white">Release not found</p>
          <p className="mt-2 text-zinc-500 text-sm">This link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-5xl">❌</div>
        <p className="text-xl font-black text-white">Project not found</p>
        <p className="text-zinc-500 text-sm">It may have been deleted from this device.</p>
        <Link href="/studio" className="inline-block mt-4 rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500">
          ← Back to Studio
        </Link>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-zinc-500 text-sm animate-pulse">Loading project…</div>
    </div>
  );

  const settings = loadSettings();
  const stages = [
    { key: "mastered", label: "Master", done: project.meta.mastered, tab: "master" as Tab },
    { key: "artworkDone", label: "Art", done: project.meta.artworkDone, tab: "artwork" as Tab },
    { key: "releaseDone", label: "Release", done: project.meta.releaseDone, tab: "release" as Tab },
  ];

  const publicUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/studio/p/${id}?view=public`;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-zinc-800 bg-[#0a0a0f]/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/studio" className="text-zinc-500 hover:text-white text-sm shrink-0">← Studio</Link>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{project.meta.name}</h1>
                <p className="text-[10px] text-zinc-500">
                  {project.meta.kind === "mix" ? "🎧 Mix" : "🎵 Track"} · {project.meta.genre}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {stages.map(s => (
                <button key={s.key} onClick={() => setTab(s.tab)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition ${s.done ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-600"}`}>
                  {s.done ? "✓" : "○"} {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="mt-2 flex gap-1 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition ${tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
        {tab === "assistant" && (
          <div className="space-y-4">
            <AssistantPanel
              project={project}
              onNavigate={(path) => {
                const url = new URL(path, window.location.origin);
                const t = url.searchParams.get("tab") as Tab | null;
                if (t && TABS.find(x => x.id === t)) {
                  setTab(t);
                } else {
                  router.push(path);
                }
              }}
              onCreateProject={() => router.push("/studio")}
            />

            {/* Project quick stats */}
            <div className="grid gap-3 sm:grid-cols-3">
              {stages.map(s => (
                <button key={s.key} onClick={() => setTab(s.tab)}
                  className={`rounded-2xl border p-4 text-left transition ${s.done ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900"}`}>
                  <div className={`text-lg ${s.done ? "text-emerald-400" : "text-zinc-600"}`}>{s.done ? "✅" : "⭕"}</div>
                  <div className="mt-1 text-sm font-semibold text-zinc-200">{s.label}</div>
                  <div className="text-xs text-zinc-500">{s.done ? "Done — click to review" : "Not done — click to start"}</div>
                </button>
              ))}
            </div>

            {/* Public page link */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Public Artist Page</p>
              <p className="text-xs text-zinc-500 mb-3">Share this link — fans see your artwork, bio, and all platform links in one place.</p>
              <div className="flex items-center gap-2">
                <input readOnly value={publicUrl}
                  className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300" />
                <button onClick={() => void navigator.clipboard.writeText(publicUrl)}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                  Copy
                </button>
                <a href={publicUrl} target="_blank" rel="noreferrer"
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                  Open →
                </a>
              </div>
            </div>
          </div>
        )}

        {tab === "master" && (
          <MasterPanel project={project} onChanged={refresh} />
        )}

        {tab === "artwork" && (
          <ArtworkPanel project={project} onChanged={refresh} />
        )}

        {tab === "release" && (
          <ReleasePanel project={project} onChanged={refresh} />
        )}

        {tab === "check" && (
          <CheckPanel project={project} />
        )}
      </main>
    </div>
  );
}
