"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card } from "@/components/studio/ui";
import type { ProjectKind } from "@/lib/studio/types";
import { createProject, deleteProject, useSettings, saveSettings, useProjects } from "@/lib/studio/store";
import { getEpkPortraitDataUrl } from "@/lib/studio/epk-store";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "@/components/studio/ArabicToggle";
import { ProjectCard } from "@/components/studio/ProjectCard";
import { FeedbackBox } from "@/components/studio/FeedbackBox";

export default function StudioHome() {
  const router = useRouter();
  const projects = useProjects();
  const settings = useSettings();
  const { arabic } = useArabic();
  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectKind, setProjectKind] = useState<ProjectKind>("mix");
  const [epkPortrait, setEpkPortrait] = useState<string | null>(null);
  useEffect(() => { void getEpkPortraitDataUrl().then(u => setEpkPortrait(u)); }, []);

  const makeProject = (projectName: string, k: ProjectKind = "mix", g = settings.defaultGenre, m = "Deep, energetic, hypnotic") => {
    const p = createProject({ name: projectName, kind: k, genre: g, mood: m });
    saveSettings({ ...settings, defaultKind: k, defaultGenre: g });
    router.push("/studio/p/" + p.meta.id + "?tab=master");
  };

  const latestProject = projects[0];

  return (
    <div className="space-y-6">
      {/* Hero — who she is */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900">
          {epkPortrait
            ? <img src={epkPortrait} alt="Portrait" className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-2xl">🎧</div>}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{settings.artistName}</h1>
          <p className="text-sm text-zinc-500">{settings.defaultGenre} · {t("studio", arabic)}</p>
        </div>
      </div>

      {/* TWO BIG ACTIONS — this is all she needs to see */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Create / Continue Project */}
        {!showForm ? (
          <button
            onClick={() => {
              if (latestProject) {
                router.push("/studio/p/" + latestProject.meta.id);
              } else {
                setShowForm(true);
              }
            }}
            className="group relative overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/60 to-zinc-900 p-6 text-left transition hover:border-fuchsia-500/60 active:scale-[0.98]"
          >
            <div className="text-4xl">🎚</div>
            <h2 className="mt-3 text-xl font-bold text-white">
              {latestProject ? latestProject.meta.name : "Create a Project"}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              {latestProject
                ? `${latestProject.meta.mastered ? "✓ Mastered" : "Upload & master"} · ${latestProject.meta.artworkDone ? "✓ Cover" : "Make cover"} · ${latestProject.meta.releaseDone ? "✓ Release" : "Package"}`
                : "Name it → Upload → Master → Cover → Release → Publish"}
            </p>
            <div className="mt-3 text-xs font-semibold text-fuchsia-400 group-hover:text-fuchsia-300">
              {latestProject ? "Continue →" : "Get started →"}
            </div>
          </button>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); if (projectName.trim()) { makeProject(projectName.trim(), projectKind); setShowForm(false); setProjectName(""); } }}
            className="rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-950/60 to-zinc-900 p-6 space-y-3"
          >
            <div className="text-xl font-bold text-white">Create a Project</div>
            <input
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Project name — e.g. Afro House Summer Mix"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
            />
            <div className="flex gap-2">
              {(["mix", "track"] as ProjectKind[]).map(k => (
                <button key={k} type="button" onClick={() => setProjectKind(k)}
                  className={"flex-1 rounded-xl border px-3 py-2 text-sm font-semibold " + (projectKind === k ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300" : "border-zinc-700 bg-zinc-950 text-zinc-400")}>
                  {k === "mix" ? "🎧 DJ Mix" : "🎵 Track"}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={!projectName.trim()} className="flex-1">Create & Start →</Button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-zinc-700 px-4 py-2 text-xs text-zinc-400 hover:text-white">Cancel</button>
            </div>
          </form>
        )}

        {/* Find Gigs */}
        <Link
          href="/studio/community?tab=opportunities"
          className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-zinc-900 p-6 text-left transition hover:border-emerald-500/60 active:scale-[0.98]"
        >
          <div className="text-4xl">💰</div>
          <h2 className="mt-3 text-xl font-bold text-white">Find DJ Gigs</h2>
          <p className="mt-1 text-sm text-zinc-400">
            67 bookings · UAE venues · Pay AED 1,500–12,000
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
            Browse opportunities →
          </div>
        </Link>
      </div>

      {/* Quick tools — small, unobtrusive, but there when needed */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {[
          { href: "/studio/library", icon: "📂", label: "Library" },
          { href: "/studio/epk", icon: "📇", label: "EPK" },
          { href: "/studio/gigradar", icon: "🎯", label: "Gigs" },
          { href: "/studio/community", icon: "🌍", label: "Network" },
          { href: "/studio/distribute", icon: "📤", label: "Release" },
          { href: "/studio/settings", icon: "⚙", label: "Settings" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-3 text-center transition hover:border-zinc-700 hover:bg-zinc-900"
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] font-medium text-zinc-500">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Projects — only show if she has some */}
      {projects.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-300">Projects</h3>
            <button
              onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="text-xs text-fuchsia-400 hover:text-fuchsia-300"
            >
              + New
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(p => <ProjectCard key={p.meta.id} project={p} onDelete={id => { deleteProject(id); }} />)}
          </div>
        </div>
      )}

      {/* New user — no projects yet, show a gentle nudge */}
      {projects.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-3xl">💿</div>
          <p className="mt-2 text-sm text-zinc-300">Got a mix ready?</p>
          <p className="mt-1 text-xs text-zinc-500">Tap the big button above. The studio walks you through everything.</p>
        </Card>
      )}

      <FeedbackBox />
    </div>
  );
}
