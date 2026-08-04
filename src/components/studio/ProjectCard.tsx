"use client";

import Link from "next/link";
import type { Project } from "@/lib/studio/types";
import { formatDuration } from "@/lib/studio/dsp";

export function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
  const { meta } = project;
  const stages = [
    { key: "mastered", label: "Master", done: meta.mastered },
    { key: "artworkDone", label: "Art", done: meta.artworkDone },
    { key: "releaseDone", label: "Release", done: meta.releaseDone },
  ];
  const date = new Date(meta.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 transition hover:border-fuchsia-500/50 hover:bg-zinc-900">
      <Link href={`/studio/p/${meta.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-zinc-100">{meta.name}</div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              {meta.kind === "mix" ? "🎧 Mix" : "🎵 Track"} · {meta.genre} · updated {date}
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
            {project.audio ? formatDuration(project.audio.durationSec) : "no audio"}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {stages.map((s) => (
            <span
              key={s.key}
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                s.done ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-600"
              }`}
            >
              {s.done ? "✓" : "○"} {s.label}
            </span>
          ))}
        </div>
      </Link>
      <div className="flex items-center justify-between border-t border-zinc-800/70 px-4 py-2">
        <Link href={`/studio/p/${meta.id}`} className="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300">
          Open project →
        </Link>
        <button
          onClick={() => {
            if (confirm(`Delete "${meta.name}"? The files stay on your device — only the project is removed.`)) onDelete(meta.id);
          }}
          className="text-xs text-zinc-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
