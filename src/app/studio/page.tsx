"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AssistantPanel } from "@/components/studio/AssistantPanel";
import { ProjectCard } from "@/components/studio/ProjectCard";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import type { ProjectKind } from "@/lib/studio/types";
import { createProject, deleteProject, loadSettings, saveSettings, useProjects } from "@/lib/studio/store";

export default function StudioHome() {
  const router = useRouter();
  const projects = useProjects();
  const settings = loadSettings();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<ProjectKind>(settings.defaultKind);
  const [genre, setGenre] = useState(settings.defaultGenre);
  const [mood, setMood] = useState("Deep, energetic, hypnotic");

  const makeProject = (projectName: string, k: ProjectKind = kind, g = genre, m = mood) => {
    const p = createProject({ name: projectName, kind: k, genre: g, mood: m });
    saveSettings({ ...settings, defaultKind: k, defaultGenre: g });
    router.push(`/studio/p/${p.meta.id}?tab=assistant`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Your studio, one place
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Master the mix, design the cover, package the release, pass the platform checks — no engineer, no designer, no hours of grunt work. Offline or online.
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "+ New project"}</Button>
      </div>

      {showForm && (
        <Card className="p-4 sm:p-5">
          <SectionLabel>New project</SectionLabel>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return;
              makeProject(name.trim());
            }}
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name — e.g. Afro House Mix 2026"
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none sm:col-span-2"
            />
            <div className="flex gap-2">
              {(["mix", "track"] as ProjectKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold capitalize ${
                    kind === k ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300" : "border-zinc-700 bg-zinc-950 text-zinc-400"
                  }`}
                >
                  {k === "mix" ? "🎧 DJ Mix" : "🎵 Track"}
                </button>
              ))}
            </div>
            <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre — e.g. Afro House" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none" />
            <input value={mood} onChange={(e) => setMood(e.target.value)} placeholder="Mood for the cover — e.g. golden sunset, deep and hypnotic" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none sm:col-span-2" />
            <Button type="submit" disabled={!name.trim()} className="sm:col-span-2">
              Create project
            </Button>
          </form>
        </Card>
      )}

      <AssistantPanel
        onNavigate={router.push}
        onCreateProject={(n, k) => makeProject(n, k)}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel>Projects</SectionLabel>
          <span className="text-[11px] text-zinc-600">{projects.length} total</span>
        </div>
        {projects.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-8 text-center">
            <div className="text-3xl">💿</div>
            <div className="text-sm font-semibold text-zinc-300">No projects yet</div>
            <p className="max-w-sm text-xs text-zinc-500">
              Create a project, drop in your mix, and the studio takes it from raw file to upload-ready release.
            </p>
            <Button className="mt-2" onClick={() => setShowForm(true)}>
              + Start a project
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.meta.id} project={p} onDelete={(id) => { deleteProject(id); }} />
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: "🎚", title: "Master in-browser", text: "EQ, compression, limiting and loudness to -14 LUFS — on the device, no internet needed." },
          { icon: "🎨", title: "Cover art in seconds", text: "Gemini-designed covers or offline templates, exported at 3000×3000." },
          { icon: "📦", title: "Release-ready", text: "Title, description, tags, checks — formatted so YouTube and labels accept it first time." },
        ].map((f) => (
          <div key={f.title} className="rounded-2xl border border-zinc-800/70 bg-zinc-900/40 p-4">
            <div className="text-2xl">{f.icon}</div>
            <div className="mt-2 text-sm font-semibold text-zinc-200">{f.title}</div>
            <div className="mt-1 text-xs leading-relaxed text-zinc-500">{f.text}</div>
          </div>
        ))}
      </div>

      <div className="flex items-start justify-between rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <div className="text-xs text-zinc-500">
          <span className="font-semibold text-zinc-300">First time?</span> Add your free Gemini API key and handles in{" "}
          <button onClick={() => router.push("/studio/settings")} className="text-fuchsia-400 hover:underline">Settings</button> — everything works without it too.
        </div>
      </div>
    </div>
  );
}
