"use client";

import { useCallback, useState } from "react";
import type { Project, TracklistEntry } from "@/lib/studio/types";
import { upsertProject } from "@/lib/studio/store";
import { newId } from "@/lib/studio/id";
import { Button, Card, SectionLabel } from "./ui";

interface Props {
  project: Project;
  onChanged: () => void;
}

export function TracklistPanel({ project, onChanged }: Props) {
  const [tracks, setTracks] = useState<TracklistEntry[]>(project.tracklist ?? []);
  const [copied, setCopied] = useState(false);

  const save = useCallback(
    (updated: TracklistEntry[]) => {
      setTracks(updated);
      upsertProject({
        ...project,
        tracklist: updated,
        meta: { ...project.meta, updatedAt: Date.now() },
      });
      onChanged();
    },
    [project, onChanged],
  );

  const addTrack = () => {
    // Auto-fill timestamp based on last entry
    let nextTime = "00:00";
    if (tracks.length > 0) {
      const last = tracks[tracks.length - 1];
      const parts = last.timestamp.split(":").map(Number);
      let totalSec = 0;
      if (parts.length === 3) totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) totalSec = parts[0] * 60 + parts[1];
      totalSec += 180; // default 3 min gap
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      nextTime = h > 0
        ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    save([...tracks, { id: newId(), timestamp: nextTime, artist: "", title: "", label: "" }]);
  };

  const updateTrack = (id: string, field: keyof TracklistEntry, value: string) => {
    save(tracks.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeTrack = (id: string) => {
    save(tracks.filter((t) => t.id !== id));
  };

  const moveTrack = (id: string, dir: -1 | 1) => {
    const idx = tracks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= tracks.length) return;
    const updated = [...tracks];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    save(updated);
  };

  const formatPlain = (): string => {
    if (tracks.length === 0) return "No tracklist yet.";
    return tracks
      .map((t) => {
        const label = t.label ? ` [${t.label}]` : "";
        const notes = t.notes ? ` (${t.notes})` : "";
        return `${t.timestamp} - ${t.artist} - ${t.title}${label}${notes}`;
      })
      .join("\n");
  };

  const format1001 = (): string => {
    if (tracks.length === 0) return "";
    return tracks
      .map((t, i) => {
        const label = t.label ? ` [${t.label}]` : "";
        return `${i + 1}. ${t.artist} - ${t.title}${label} [${t.timestamp}]`;
      })
      .join("\n");
  };

  const formatMarkdown = (): string => {
    if (tracks.length === 0) return "";
    return (
      "**Tracklist:**\n\n" +
      tracks
        .map((t) => {
          const label = t.label ? ` [${t.label}]` : "";
          return `\`${t.timestamp}\` ${t.artist} — ${t.title}${label}`;
        })
        .join("\n")
    );
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>Tracklist</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">
              {tracks.length} track{tracks.length !== 1 ? "s" : ""} — add every track in your mix with timestamps.
            </p>
          </div>
          <Button onClick={addTrack}>+ Add Track</Button>
        </div>

        {tracks.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-700 p-8 text-center">
            <div className="text-3xl">📝</div>
            <p className="text-sm text-zinc-400">No tracks added yet</p>
            <p className="text-xs text-zinc-500">
              Add every track in your set with the timestamp. This goes into your YouTube description, SoundCloud, 1001Tracklists.
            </p>
            <Button onClick={addTrack}>+ Add First Track</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {tracks.map((track, idx) => (
              <div
                key={track.id}
                className="flex items-start gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3"
              >
                <div className="mt-1 text-xs font-mono text-zinc-600 w-5 text-right shrink-0">
                  {idx + 1}.
                </div>
                <div className="flex-1 grid gap-2 sm:grid-cols-[80px_1fr_1fr_120px]">
                  <input
                    value={track.timestamp}
                    onChange={(e) => updateTrack(track.id, "timestamp", e.target.value)}
                    placeholder="00:00"
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs font-mono text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                  />
                  <input
                    value={track.artist}
                    onChange={(e) => updateTrack(track.id, "artist", e.target.value)}
                    placeholder="Artist"
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                  />
                  <input
                    value={track.title}
                    onChange={(e) => updateTrack(track.id, "title", e.target.value)}
                    placeholder="Track Title"
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                  />
                  <input
                    value={track.label || ""}
                    onChange={(e) => updateTrack(track.id, "label", e.target.value)}
                    placeholder="Label"
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveTrack(track.id, -1)}
                    disabled={idx === 0}
                    className="rounded p-1 text-xs text-zinc-600 hover:text-white disabled:opacity-30"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveTrack(track.id, 1)}
                    disabled={idx === tracks.length - 1}
                    className="rounded p-1 text-xs text-zinc-600 hover:text-white disabled:opacity-30"
                    title="Move down"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => removeTrack(track.id)}
                    className="rounded p-1 text-xs text-zinc-600 hover:text-red-400"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {tracks.length > 0 && (
        <Card className="p-4 sm:p-5">
          <SectionLabel>Export & Copy</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">
            Formatted for each platform. Copy and paste directly.
          </p>

          <div className="mt-3 space-y-3">
            {/* Plain text preview */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  YouTube / SoundCloud
                </span>
                <button
                  onClick={() => void copyText(formatPlain())}
                  className="text-[11px] font-semibold text-fuchsia-400 hover:text-fuchsia-300"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {formatPlain()}
              </pre>
            </div>

            {/* 1001tracklists format */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  1001Tracklists Format
                </span>
                <button
                  onClick={() => void copyText(format1001())}
                  className="text-[11px] font-semibold text-fuchsia-400 hover:text-fuchsia-300"
                >
                  Copy
                </button>
              </div>
              <pre className="mt-1 max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 font-mono whitespace-pre-wrap">
                {format1001()}
              </pre>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => void copyText(formatPlain())}>
                📋 Copy for YouTube
              </Button>
              <Button variant="ghost" onClick={() => void copyText(format1001())}>
                📋 Copy for 1001Tracklists
              </Button>
              <Button variant="ghost" onClick={() => void copyText(formatMarkdown())}>
                📋 Copy Markdown
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
