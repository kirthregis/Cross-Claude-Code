"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AssistantPanel } from "@/components/studio/AssistantPanel";
import { MasterPanel } from "@/components/studio/MasterPanel";
import { ArtworkPanel } from "@/components/studio/ArtworkPanel";
import { ReleasePanel } from "@/components/studio/ReleasePanel";
import { CheckPanel } from "@/components/studio/CheckPanel";
import { Button } from "@/components/studio/ui";
import { getProject, upsertProject } from "@/lib/studio/store";

type Tab = "assistant" | "master" | "artwork" | "release" | "check";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "assistant", label: "Assistant", icon: "🎧" },
  { id: "master", label: "Master", icon: "🎚" },
  { id: "artwork", label: "Artwork", icon: "🎨" },
  { id: "release", label: "Release", icon: "📦" },
  { id: "check", label: "Check", icon: "✅" },
];

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolved = React.use(params);
  const [tab, setTab] = useState<Tab>("assistant");
  const [rev, setRev] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const tabInitialized = useRef(false);

  const project = getProject(resolved.id);

  useEffect(() => {
    if (tabInitialized.current || typeof window === "undefined") return;
    tabInitialized.current = true;
    const q = new URLSearchParams(window.location.search).get("tab");
    if (q && TABS.some((t) => t.id === q)) setTab(q as Tab);
  }, []);

  const onChanged = useCallback(() => setRev((r) => r + 1), []);

  if (!project) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="text-4xl">🔍</div>
        <div className="text-sm font-semibold text-zinc-300">Project not found</div>
        <Link href="/studio" className="text-sm text-fuchsia-400 hover:underline">← Back to studio</Link>
      </div>
    );
  }

  const selectTab = (t: Tab) => {
    setTab(t);
    router.replace(`/studio/p/${resolved.id}?tab=${t}`, { scroll: false });
  };

  const saveName = () => {
    if (nameDraft.trim()) {
      upsertProject({ ...project, meta: { ...project.meta, name: nameDraft.trim() } });
      setRev((r) => r + 1);
    }
    setEditingName(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">← All projects</Link>
          {editingName ? (
            <form
              className="mt-1 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                saveName();
              }}
            >
              <input autoFocus value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} className="rounded-xl border border-fuchsia-500/60 bg-zinc-950 px-3 py-1.5 text-lg font-bold text-white focus:outline-none" />
              <Button type="submit" className="!px-3 !py-1.5">Save</Button>
            </form>
          ) : (
            <h1 className="mt-1 flex items-center gap-2 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              <span className="truncate">{project.meta.name}</span>
              <button onClick={() => { setNameDraft(project.meta.name); setEditingName(true); }} className="text-zinc-600 hover:text-fuchsia-400" title="Rename">✎</button>
            </h1>
          )}
          <div className="mt-0.5 text-[11px] text-zinc-500">
            {project.meta.kind === "mix" ? "🎧 DJ Mix" : "🎵 Track"} · {project.meta.genre} · {project.meta.mood}
          </div>
        </div>
        <div className="flex gap-1.5">
          {TABS.filter((t) => t.id !== "assistant").map((t) => {
            const flag = t.id === "master" ? project.meta.mastered : t.id === "artwork" ? project.meta.artworkDone : project.meta.releaseDone;
            return (
              <span key={t.id} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${flag ? "bg-emerald-500/15 text-emerald-300" : "bg-zinc-800 text-zinc-600"}`}>
                {t.icon} {flag ? "✓" : "○"} {t.label}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-gradient-to-r from-fuchsia-600/90 to-fuchsia-500/90 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "assistant" && <AssistantPanel project={project} onNavigate={(p) => { if (p.startsWith("/studio")) router.push(p); }} />}
      {tab === "master" && <MasterPanel key={rev} project={project} onChanged={onChanged} />}
      {tab === "artwork" && <ArtworkPanel key={rev} project={project} onChanged={onChanged} />}
      {tab === "release" && <ReleasePanel key={rev} project={project} onChanged={onChanged} />}
      {tab === "check" && <CheckPanel key={rev} project={project} />}
    </div>
  );
}
