"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AssistantPanel } from "@/components/studio/AssistantPanel";
import { ProjectCard } from "@/components/studio/ProjectCard";
import { StudioGuide } from "@/components/studio/StudioGuide";
import { FeedbackBox } from "@/components/studio/FeedbackBox";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import type { ProjectKind } from "@/lib/studio/types";
import { createProject, deleteProject, upsertProject, useSettings, saveSettings, useProjects } from "@/lib/studio/store";
import { getEpkPortraitDataUrl } from "@/lib/studio/epk-store";

export default function StudioHome() {
  const router = useRouter();
  const projects = useProjects();
  const settings = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [epkPortrait, setEpkPortrait] = useState<string | null>(null);
  useEffect(() => { void getEpkPortraitDataUrl().then(u => setEpkPortrait(u)); }, []);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ProjectKind>(settings.defaultKind);
  const [genre, setGenre] = useState(settings.defaultGenre);
  const [mood, setMood] = useState("Deep, energetic, hypnotic");

  const makeProject = (projectName: string, k: ProjectKind = kind, g = genre, m = mood, initialTab = "assistant") => {
    const p = createProject({ name: projectName, kind: k, genre: g, mood: m });
    upsertProject(p);
    saveSettings({ ...settings, defaultKind: k, defaultGenre: g });
    router.push("/studio/p/" + p.meta.id + "?tab=" + initialTab);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Your studio, one place</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">Master the mix, design the cover, package the release, pass the platform checks — no engineer, no designer, no hours of grunt work.</p>
        </div>
        <Button onClick={() => setShowForm(v => !v)}>{showForm ? "Cancel" : "+ New project"}</Button>
      </div>

      <Link href="/studio/epk" className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3 transition brand-hover-border">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900">
          {epkPortrait ? <img src={epkPortrait} alt="Portrait" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-lg">🎤</div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-bold text-zinc-100">{settings.artistName}</div>
          <div className="truncate text-xs text-zinc-500">Press kit — upload, view, download</div>
        </div>
        <span className="brand-text shrink-0 text-xs font-semibold">EPK →</span>
      </Link>

      <StudioGuide onCreateProject={(n, k) => makeProject(n, k)} />

      {showForm && (
        <Card className="p-4 sm:p-5">
          <SectionLabel>New project</SectionLabel>
          <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={e => { e.preventDefault(); if (!name.trim()) return; makeProject(name.trim()); }}>
            <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Project name — e.g. Afro House Mix 2026"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none sm:col-span-2" />
            <div className="flex gap-2">
              {(["mix", "track"] as ProjectKind[]).map(k => (
                <button key={k} type="button" onClick={() => setKind(k)}
                  className={"flex-1 rounded-xl border px-3 py-2 text-sm font-semibold capitalize " + (kind === k ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300" : "border-zinc-700 bg-zinc-950 text-zinc-400")}>
                  {k === "mix" ? "🎧 DJ Mix" : "🎵 Track"}
                </button>
              ))}
            </div>
            <input value={genre} onChange={e => setGenre(e.target.value)} placeholder="Genre — e.g. Afro House"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none" />
            <input value={mood} onChange={e => setMood(e.target.value)} placeholder="Mood for the cover — e.g. golden sunset, deep and hypnotic"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none sm:col-span-2" />
            <Button type="submit" disabled={!name.trim()} className="sm:col-span-2">Create project</Button>
          </form>
        </Card>
      )}

      <AssistantPanel onNavigate={router.push} onCreateProject={(n, k) => makeProject(n, k)} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Projects</SectionLabel>
          <span className="text-[11px] text-zinc-600">{projects.length} total</span>
        </div>
        {projects.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-3xl">💿</div>
            <div className="text-sm font-semibold text-zinc-300">No projects yet</div>
            <p className="max-w-sm text-xs text-zinc-500">Create a project, drop in your mix, and the studio takes it from raw file to upload-ready release.</p>
            <Button className="mt-2" onClick={() => setShowForm(true)}>+ Start a project</Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => <ProjectCard key={p.meta.id} project={p} onDelete={id => { deleteProject(id); }} />)}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: "🎛", title: "Master in-browser", text: "EQ, compression, limiting and loudness to -14 LUFS — on the device, no internet needed.", tab: "master" as const },
          { icon: "🎨", title: "Cover art in seconds", text: "AI-designed covers (Gemini or fal.ai) or offline templates, exported at 3000×3000.", tab: "artwork" as const },
          { icon: "📦", title: "Release-ready", text: "Title, description, tags, checks — formatted so YouTube and labels accept it first time.", tab: "release" as const },
        ].map(f => (
          <button key={f.title} onClick={() => {
            if (projects.length === 0) {
              makeProject("Afro House Mix", "mix", undefined, undefined, f.tab);
              return;
            }
            router.push("/studio/p/" + projects[0].meta.id + "?tab=" + f.tab);
          }}
            className="group rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4 text-left transition brand-hover-border hover:bg-zinc-900"
          >
            <div className="text-2xl">{f.icon}</div>
            <div className="mt-2 text-sm font-semibold text-zinc-200 group-hover:text-fuchsia-300">{f.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-500">{f.text}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/studio/gigradar" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">GigRadar</div>
              <div className="text-xs text-zinc-500">Find gigs, generate AI pitch emails, track revenue from UAE venues.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
        <Link href="/studio/library" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">Music Library</div>
              <div className="text-xs text-zinc-500">Offline track storage & Pioneer DDJ audio output routing.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
        <Link href="/studio/planner" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">Gig Planner & Riders</div>
              <div className="text-xs text-zinc-500">Setlists, custom tech riders, contracts and auto-invoices.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
        <Link href="/studio/analytics" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">Analytics</div>
              <div className="text-xs text-zinc-500">Live YouTube stats, subscribers, views and recent video performance.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
        <Link href="/studio/distribute" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📤</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">Distribute</div>
              <div className="text-xs text-zinc-500">Smart links, royalty splits, and free distribution to Spotify + Apple Music.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
        <Link href="/studio/community" className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900/70 to-zinc-900/30 px-4 py-3.5 transition hover:border-fuchsia-500/50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <div className="text-sm font-bold text-zinc-100">MENA Community</div>
              <div className="text-xs text-zinc-500">Connect with artists across UAE, Saudi Arabia, Egypt and the region.</div>
            </div>
          </div>
          <span className="brand-text shrink-0">Open →</span>
        </Link>
      </div>

      <FeedbackBox />
    </div>
  );
}
