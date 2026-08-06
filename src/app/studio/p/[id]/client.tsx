"use client";
import { useEffect, useState } from "react";
import { getProject } from "@/lib/studio/store";
import type { Project } from "@/lib/studio/types";

const PLATFORM_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  spotify: { label: "Spotify", icon: "🟢", color: "bg-[#1DB954] hover:bg-[#1ed760]" },
  appleMusic: { label: "Apple Music", icon: "🍎", color: "bg-[#fc3c44] hover:bg-[#ff4d55]" },
  youtube: { label: "YouTube", icon: "▶", color: "bg-[#FF0000] hover:bg-[#cc0000]" },
  soundcloud: { label: "SoundCloud", icon: "☁", color: "bg-[#ff5500] hover:bg-[#ff6a1a]" },
  tidal: { label: "Tidal", icon: "〰", color: "bg-zinc-900 hover:bg-zinc-800 border border-zinc-700" },
  bandcamp: { label: "Bandcamp", icon: "🎵", color: "bg-[#1da0c3] hover:bg-[#22b5da]" },
};

export default function PublicPageClient({ id }: { id: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (p) setProject(p);
    else setNotFound(true);
  }, [id]);

  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🎵</div>
        <p className="text-2xl font-black text-white">Release not found</p>
        <p className="mt-2 text-zinc-500 text-sm">This link may have expired or been removed.</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
    </div>
  );

  const links = project.smartLinks ?? {};
  const activeLinks = Object.entries(links).filter(([, v]) => v && v.trim() !== "");
  const artwork = project.artwork?.dataUrl;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center">
          <div className="mx-auto h-56 w-56 overflow-hidden rounded-3xl shadow-2xl shadow-black/80 ring-1 ring-white/10">
            {artwork
              ? <img src={artwork} alt={project.meta.name} className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center bg-zinc-900 text-6xl">🎵</div>
            }
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-white tracking-tight">{project.meta.name}</h1>
          <p className="mt-1 text-sm text-zinc-400">{project.meta.genre} · {project.meta.kind === "mix" ? "DJ Mix" : "Track"}</p>
          {project.meta.mood && <p className="mt-0.5 text-xs text-zinc-600">{project.meta.mood}</p>}
        </div>

        {activeLinks.length > 0 ? (
          <div className="space-y-2.5">
            <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-zinc-600">Listen on</p>
            {activeLinks.map(([key, url]) => {
              const platform = PLATFORM_LABELS[key] ?? { label: key, icon: "🔗", color: "bg-zinc-800 hover:bg-zinc-700" };
              return (
                <a key={key} href={url} target="_blank" rel="noreferrer"
                  className={"flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition " + platform.color}>
                  <span>{platform.icon}</span>
                  <span>Listen on {platform.label}</span>
                </a>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
            <p className="text-sm text-zinc-500">Platform links coming soon</p>
            <p className="mt-1 text-xs text-zinc-700">Check back after the release drops</p>
          </div>
        )}

        {(project.collaborators ?? []).length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-2">Credits</p>
            <div className="space-y-1">
              {(project.collaborators ?? []).map(c => (
                <div key={c.id} className="flex justify-between text-xs">
                  <span className="text-zinc-300">{c.name}</span>
                  <span className="text-zinc-600">{c.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-2">
          <p className="text-[10px] text-zinc-700">Powered by <span className="text-zinc-600 font-semibold">EMY Studio</span></p>
        </div>
      </div>
    </div>
  );
}