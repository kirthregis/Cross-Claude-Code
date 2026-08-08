"use client";

import { useCallback, useEffect, useState } from "react";
import type { Project, ReleaseCheck } from "@/lib/studio/types";
import { checksSummary, runComplianceChecks } from "@/lib/studio/release";
import { formatBytes } from "@/lib/studio/dsp";
import { speak } from "@/lib/studio/speech";
import { loadArtwork, loadSettings } from "@/lib/studio/store";
import { Button, Card, SectionLabel, StatusBadge, Stepper } from "./ui";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "./ArabicToggle";

type Platform = "youtube" | "instagram" | "label";

export function CheckPanel({ project }: { project: Project }) {
  const { arabic } = useArabic();
  const settings = loadSettings();
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [checks, setChecks] = useState<ReleaseCheck[] | null>(null);
  const [artworkDims, setArtworkDims] = useState<{ width: number; height: number; bytes: number } | null>(null);

  useEffect(() => {
    let alive = true;
    void loadArtwork(project.meta.id).then((dataUrl) => {
      if (!alive) return;
      if (dataUrl) {
        const img = new Image();
        img.onload = () => {
          if (alive) setArtworkDims({ width: img.naturalWidth, height: img.naturalHeight, bytes: Math.round((dataUrl.length * 3) / 4) });
        };
        img.src = dataUrl;
      }
    });
    return () => {
      alive = false;
    };
  }, [project.meta.id]);

  const run = useCallback(
    (pl: Platform = platform) => {
      const list = runComplianceChecks(
        {
          audio: project.audio,
          master: project.master,
          artworkSize: artworkDims ?? undefined,
          release: project.release,
        },
        pl,
      );
      setChecks(list);
      const s = checksSummary(list);
      const phrase = s.fail === 0 ? (s.warn > 0 ? "mostly ready — a couple of warnings" : "fully ready to upload") : `${s.fail} thing${s.fail === 1 ? "" : "s"} still need${s.fail === 1 ? "s" : ""} attention`;
      speak(`Release check complete: ${phrase}.`, settings.soundOn, "en-US", settings.voiceGender);
    },
    [project, artworkDims, platform, settings.soundOn],
  );

  useEffect(() => {
    if (project.audio || project.master || project.artwork || project.release) {
      const list = runComplianceChecks(
        {
          audio: project.audio,
          master: project.master,
          artworkSize: artworkDims ?? undefined,
          release: project.release,
        },
        platform,
      );
      setChecks(list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.audio, project.master, project.release, artworkDims, platform]);

  const stage = project.meta.mastered && project.meta.artworkDone && project.meta.releaseDone ? 3 : project.meta.releaseDone ? 2 : project.meta.artworkDone ? 1 : project.meta.mastered ? 0 : -1;

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel>Release readiness</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">The same checklist a record label or YouTube&apos;s review would run. Fix anything in red and re-check.</p>
          </div>
          <div className="flex gap-1.5">
            {(["youtube", "instagram", "label"] as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPlatform(p);
                  run(p);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  platform === p ? "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/50" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {p === "label" ? "Record label" : p}
              </button>
            ))}
          </div>
        </div>

        {stage >= 0 && (
          <div className="mt-4 overflow-x-auto pb-1">
            <Stepper steps={["Master", "Artwork", "Release", "Check"]} current={stage} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => run()}>🔍 Run check</Button>
          {checks && (
            <span className="text-xs text-zinc-500">
              <span className="font-semibold text-emerald-300">{checksSummary(checks).pass} pass</span> · <span className="font-semibold text-amber-300">{checksSummary(checks).warn} warn</span> ·{" "}
              <span className="font-semibold text-red-300">{checksSummary(checks).fail} fail</span>
            </span>
          )}
        </div>
      </Card>

      {checks && (
        <Card className="divide-y divide-zinc-800/70 p-0">
          {checks.map((c) => (
            <div key={c.id} className="flex items-start gap-3 px-4 py-3">
              <div className="pt-0.5">
                <StatusBadge status={c.status} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-200">{c.label}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-zinc-500">{c.detail}</div>
                {c.fix && <div className="mt-1 text-xs text-fuchsia-300/90">→ {c.fix}</div>}
              </div>
            </div>
          ))}
        </Card>
      )}

      {!checks && (
        <Card className="p-6 text-center text-xs text-zinc-500">
          {project.audio || project.master || project.artwork || project.release ? "Press “Run check” to see the report." : "Nothing to check yet — import audio, master it, make artwork and generate the release pack first."}
        </Card>
      )}

      {artworkDims && (
        <p className="text-[11px] text-zinc-600">
          Cover on file: {artworkDims.width}×{artworkDims.height} · {formatBytes(artworkDims.bytes)}
        </p>
      )}
      {!artworkDims && project.meta.artworkDone && <p className="text-[11px] text-zinc-600">Cover on file: 3000×3000 (from project)</p>}
    </div>
  );
}
