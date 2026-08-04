"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ProjectKind } from "@/lib/studio/types";
import { GUIDE_DISMISSED_KEY, GUIDE_STEPS, GUIDE_QUICK_TIPS } from "@/lib/studio/guide";
import { Button } from "./ui";

export function StudioGuide({
  onCreateProject,
}: {
  onCreateProject: (name: string, kind: ProjectKind) => void;
}) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(GUIDE_DISMISSED_KEY) === "1");
    } catch {
      /* noop */
    }
  }, []);

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
        Show the “How to” guide again
      </button>
    );
  }

  const start = () => onCreateProject("Afro House Mix", "mix");

  return (
    <div className="overflow-hidden rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/80 to-fuchsia-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/70 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">👋</span>
          <div>
            <div className="text-sm font-extrabold tracking-tight text-white">How to use EMY Studio</div>
            <div className="text-[11px] text-zinc-500">Six steps from finished mix to published release — or just talk to the assistant and it sets each one up.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={start} className="!px-3 !py-2 text-xs">
            + Start a project
          </Button>
          <Link href="/studio/guide" className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-fuchsia-500/60 hover:text-fuchsia-300">
            Full guide
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

      <div className="grid gap-2 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        {GUIDE_STEPS.map((s) => (
          <Link
            key={s.n}
            href={`/studio/guide#step-${s.n}`}
            className="group flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-left transition hover:border-fuchsia-500/50 hover:bg-zinc-900"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600/30 to-amber-500/30 text-base">
              {s.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-zinc-100">
                {s.n}. {s.title}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-zinc-500">{s.short}</span>
              {s.command && (
                <span className="mt-1 inline-block rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-mono text-[10px] text-fuchsia-300/90">
                  {s.command}
                </span>
              )}
            </span>
          </Link>
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
