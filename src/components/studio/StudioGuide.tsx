"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProjectKind } from "@/lib/studio/types";
import { GUIDE_DISMISSED_KEY, GUIDE_STEPS, GUIDE_QUICK_TIPS, type GuideStep } from "@/lib/studio/guide";
import { useProjects } from "@/lib/studio/store";
import { Button } from "./ui";

export function StudioGuide({
  onCreateProject,
}: {
  onCreateProject: (name: string, kind: ProjectKind) => void;
}) {
  const router = useRouter();
  const projects = useProjects();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(GUIDE_DISMISSED_KEY) === "1");
    } catch {
      /* noop */
    }
  }, []);

  const handleStepClick = (step: GuideStep) => {
    if (step.href) {
      router.push(step.href);
      return;
    }
    if (step.tab) {
      if (projects.length > 0) {
        router.push(`/studio/p/${projects[0].meta.id}?tab=${step.tab}`);
      } else {
        onCreateProject("Afro House Mix", "mix");
      }
      return;
    }
    onCreateProject("Afro House Mix", "mix");
  };

  if (dismissed) {
    return (
      <button
        onClick={() => {
          try {
            localStorage.removeItem(GUIDE_DISMISSED_KEY);
          } catch {
            /* noop */
          }
          setDismissed(false);
        }}
        className="text-xs text-zinc-600 underline-offset-2 hover:text-zinc-400 hover:underline"
      >
        Show studio tools guide
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border brand-border bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🎛</span>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white">Studio Quick Actions</div>
            <div className="text-[11px] text-zinc-500">Tap any tool below to launch it directly, or use the voice assistant to navigate.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => onCreateProject("Afro House Mix", "mix")} className="!px-3 !py-2 text-xs">
            + New project
          </Button>
          <Link href="/studio/guide" className="brand-hover-border hover:brand-text rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition">
            Full documentation →
          </Link>
          <button
            onClick={() => {
              try {
                localStorage.setItem(GUIDE_DISMISSED_KEY, "1");
              } catch {
                /* noop */
              }
              setDismissed(true);
            }}
            className="rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:text-zinc-300"
            title="Hide this card"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        {GUIDE_STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => handleStepClick(s)}
            className="group flex flex-col items-start rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-left transition brand-hover-border hover:bg-zinc-900"
          >
            <div className="flex w-full items-center justify-between">
              <span className="brand-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base">
                {s.icon}
              </span>
              <span className="text-[10px] font-bold text-zinc-600 group-hover:text-fuchsia-400">Open ↗</span>
            </div>
            <span className="mt-2 block text-[13px] font-bold text-zinc-100 group-hover:text-white">
              {s.title}
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">{s.short}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-2 border-t border-zinc-800/70 px-4 py-3 sm:grid-cols-2 sm:px-5">
        {GUIDE_QUICK_TIPS.map((t) => (
          <div key={t.text} className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-500">
            <span className="shrink-0">{t.icon}</span>
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
