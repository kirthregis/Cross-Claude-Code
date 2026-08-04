"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioInfo, MasterParams, Project } from "@/lib/studio/types";
import { DEFAULT_MASTER_PARAMS, MASTER_PRESETS } from "@/lib/studio/types";
import {
  PreviewPlayer,
  computeWaveform,
  decodeAudioFile,
  downloadBlob,
  estimateMemoryMb,
  exportMasterBlob,
  measureInput,
  renderMaster,
  type RenderOutcome,
} from "@/lib/studio/audio";
import { formatBytes, formatDuration } from "@/lib/studio/dsp";
import { buildFileName } from "@/lib/studio/release";
import { notify, speak } from "@/lib/studio/speech";
import { loadSettings, upsertProject } from "@/lib/studio/store";
import { Button, Card, SectionLabel, Slider, Toggle } from "./ui";
import { Waveform } from "./Waveform";

type RenderState = { phase: "idle" } | { phase: "rendering"; doneSec: number; totalSec: number } | { phase: "done" } | { phase: "error"; message: string };

export function MasterPanel({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const settings = loadSettings();
  const [audio, setAudio] = useState<{ buffer: AudioBuffer; info: AudioInfo } | null>(null);
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  const [params, setParams] = useState<MasterParams>(project.masterParams ?? DEFAULT_MASTER_PARAMS);
  const [presetId, setPresetId] = useState<string | null>(null);
  const [inputLufs, setInputLufs] = useState<number | null>(null);
  const [inputPeak, setInputPeak] = useState<number | null>(null);
  const [render, setRender] = useState<RenderState>({ phase: "idle" });
  const [outcome, setOutcome] = useState<RenderOutcome | null>(null);
  const [exporting, setExporting] = useState<16 | 24 | null>(null);
  const [playMode, setPlayMode] = useState<"original" | "processed" | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const playerRef = useRef<PreviewPlayer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  if (!playerRef.current) playerRef.current = new PreviewPlayer();
  const player = playerRef.current;

  // restore in-session audio (never persisted) — audio must be re-imported per session by design
  useEffect(() => {
    return () => player.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      setError(null);
      setRender({ phase: "idle" });
      try {
        const decoded = await decodeAudioFile(file);
        setAudio(decoded);
        setPeaks(computeWaveform(decoded.buffer, 900));
        const m = measureInput(decoded.buffer);
        setInputLufs(Number.isFinite(m.integratedLufs) ? m.integratedLufs : null);
        setInputPeak(Number.isFinite(m.truePeakDb) ? m.truePeakDb : null);
        player.load(decoded.buffer, params);
        upsertProject({ ...project, audio: decoded.info, masterParams: params });
        onChanged();
      } catch (e) {
        const big = e instanceof DOMException && (e.name === "EncodingError" || e.name === "NotSupportedError");
        setError(
          big
            ? "This file is too large or in a format this device can't decode. Try it on your laptop, or re-export the mix as MP3/AAC/WAV first."
            : `Couldn't open that file — ${e instanceof Error ? e.message : "unknown error"}. Try MP3, M4A or WAV.`,
        );
      }
    },
    [project, params, player, onChanged],
  );

  const applyParams = useCallback(
    (next: MasterParams) => {
      setParams(next);
      setPresetId(null);
      if (audio) player.load(audio.buffer, next);
      upsertProject({ ...project, masterParams: next });
      onChanged();
    },
    [audio, player, project, onChanged],
  );

  const applyPreset = useCallback(
    (id: string) => {
      const p = MASTER_PRESETS[id];
      if (!p) return;
      setPresetId(id);
      applyParams(p.params);
    },
    [applyParams],
  );

  const handleRender = useCallback(async () => {
    if (!audio) return;
    setRender({ phase: "rendering", doneSec: 0, totalSec: audio.info.durationSec });
    setOutcome(null);
    try {
      const out = await renderMaster(audio.buffer, params, (doneSec, totalSec) => {
        setRender({ phase: "rendering", doneSec, totalSec });
      });
      setOutcome(out);
      setRender({ phase: "done" });
      const exportName = buildFileName(project, settings, 24);
      upsertProject({
        ...project,
        meta: { ...project.meta, mastered: true, stage: project.meta.stage === "draft" ? "master" : project.meta.stage },
        master: {
          params,
          inputLufs: inputLufs ?? NaN,
          outputLufs: out.outputLufs,
          inputTruePeakDb: inputPeak ?? NaN,
          outputTruePeakDb: out.outputTruePeakDb,
          gainAppliedDb: out.gainAppliedDb,
          renderedAt: Date.now(),
          exportName,
        },
        audio: audio.info,
        masterParams: params,
      });
      onChanged();
      notify("Mastering done", `${project.meta.name} is mastered to ${out.outputLufs.toFixed(1)} LUFS. Export it when ready.`);
      speak(`Mastering finished. ${project.meta.name} is now at ${out.outputLufs.toFixed(1)} LUFS.`, settings.soundOn);
    } catch (e) {
      setRender({ phase: "error", message: e instanceof Error ? e.message : "Rendering failed." });
    }
  }, [audio, params, project, settings, onChanged, inputLufs, inputPeak]);

  const handleExport = useCallback(
    async (bits: 16 | 24) => {
      if (!outcome) return;
      setExporting(bits);
      const fileName = buildFileName(project, settings, bits);
      const blob = exportMasterBlob(outcome.chunks, bits, outcome.gainAppliedDb, {
        title: project.meta.name,
        artist: settings.artistName || "DJ EMY",
        album: project.meta.name,
        genre: project.meta.genre,
        comment: "Mastered in EMY Studio",
      });
      downloadBlob(blob, fileName);
      setExporting(null);
      const existing = project.master;
      upsertProject({
        ...project,
        master: {
          ...(existing ?? {
            params,
            inputLufs: NaN,
            outputLufs: outcome.outputLufs,
            inputTruePeakDb: NaN,
            outputTruePeakDb: outcome.outputTruePeakDb,
            gainAppliedDb: outcome.gainAppliedDb,
            renderedAt: Date.now(),
            exportName: fileName,
          }),
          exportName: fileName,
          exportSizeBytes: blob.size,
          [bits === 16 ? "exportedWav16" : "exportedWav24"]: true,
        },
      });
      onChanged();
      notify("Master exported", `${fileName} (${formatBytes(blob.size)}) is saved. Ready for YouTube.`);
      if (settings.emailPing) {
        fetch("/api/studio/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `🎧 Master ready: ${project.meta.name}`,
            text: `Your master is ready and exported.\n\nFile: ${fileName}\nLoudness: ${outcome.outputLufs.toFixed(1)} LUFS\nTrue peak: ${outcome.outputTruePeakDb.toFixed(1)} dBTP\n\nOpen EMY Studio to make the artwork and release pack.`,
          }),
        }).catch(() => {});
      }
    },
    [outcome, project, settings, params, onChanged],
  );

  const preview = useCallback(
    async (mode: "original" | "processed") => {
      if (!audio) return;
      if (playMode === mode && player.isPlaying()) {
        player.stop();
        setPlayMode(null);
        setPlayProgress(0);
        return;
      }
      if (player.isPlaying()) player.stop();
      await player.play(playProgress > 0 && playMode === mode ? playProgress : 0, mode === "processed");
      setPlayMode(mode);
      player.onProgress = (t) => setPlayProgress(t);
      player.onEnd = () => {
        setPlayMode(null);
        setPlayProgress(0);
      };
    },
    [audio, playMode, player, playProgress],
  );

  const seek = useCallback(
    (frac: number) => {
      if (!audio) return;
      const t = frac * audio.info.durationSec;
      setPlayProgress(t);
      if (playMode && player.isPlaying()) {
        void player.play(t, playMode === "processed");
      }
    },
    [audio, playMode, player],
  );

  const memMb = audio ? estimateMemoryMb(audio.info) : 0;
  const warnMemory = audio && memMb > 1600;
  const wav16Size = audio ? audio.info.durationSec * 48000 * 2 * 2 : 0;
  const wav24Size = audio ? audio.info.durationSec * 48000 * 2 * 3 : 0;

  return (
    <div className="space-y-4">
      {/* import */}
      {!audio ? (
        <Card
          className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed p-6 text-center transition ${
            dragOver ? "border-fuchsia-500 bg-fuchsia-500/5" : "border-zinc-700"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void loadFile(f);
          }}
        >
          <div className="text-4xl">🎛️</div>
          <div>
            <div className="text-sm font-semibold">Drop your mix here — or tap to browse</div>
            <div className="mt-1 text-xs text-zinc-500">MP3 · WAV · M4A · FLAC · AAC. Stays on this device — nothing is uploaded.</div>
          </div>
          <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.flac,.aac,.aiff" className="hidden" onChange={(e) => e.target.files?.[0] && void loadFile(e.target.files[0])} />
        </Card>
      ) : (
        <Card className="p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{audio.info.fileName}</div>
              <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-zinc-500">
                <span>{formatDuration(audio.info.durationSec)}</span>
                <span>{audio.info.sampleRate} Hz</span>
                <span>{audio.info.channels}ch</span>
                <span>{formatBytes(audio.info.sizeBytes)}</span>
                {inputLufs != null && <span className="text-amber-300/80">in {inputLufs.toFixed(1)} LUFS</span>}
                {inputPeak != null && <span className="text-amber-300/80">peak {inputPeak.toFixed(1)} dB</span>}
              </div>
            </div>
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
              Replace file
            </Button>
            <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && void loadFile(e.target.files[0])} />
          </div>
          <Waveform peaks={peaks ?? new Float32Array(0)} progress={audio ? playProgress / audio.info.durationSec : 0} onSeek={seek} />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant={playMode === "original" ? "primary" : "ghost"} onClick={() => void preview("original")}>
              {playMode === "original" && player.isPlaying() ? "⏸ Pause" : "▶ Original"}
            </Button>
            <Button variant={playMode === "processed" ? "primary" : "ghost"} onClick={() => void preview("processed")}>
              {playMode === "processed" && player.isPlaying() ? "⏸ Pause" : "▶ Processed"}
            </Button>
            {playMode && <span className="text-[11px] text-zinc-500">A/B: processed plays through the full chain below</span>}
          </div>

          {warnMemory && (
            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              ⚠️ This mix is long ({formatDuration(audio.info.durationSec)}) — expect ~{Math.round(memMb / 1024)} GB of memory while mastering. Works best on a laptop; on a phone it may be tight.
            </div>
          )}
        </Card>
      )}

      {audio && (
        <>
          {/* presets + chain */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Master target</SectionLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(MASTER_PRESETS).map(([id, p]) => (
                <button
                  key={id}
                  onClick={() => applyPreset(id)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${
                    presetId === id ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="space-y-4">
                <Slider
                  label="Target loudness"
                  value={params.targetLufs}
                  min={-20}
                  max={-6}
                  step={0.5}
                  onChange={(v) => applyParams({ ...params, targetLufs: v })}
                  format={(v) => `${v} LUFS`}
                />
                <Slider
                  label="Low end (shelf @ 90 Hz)"
                  value={params.lowGainDb}
                  min={-6}
                  max={6}
                  onChange={(v) => applyParams({ ...params, lowGainDb: v })}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                />
                <Slider
                  label="Mids (peak @ 1 kHz)"
                  value={params.midGainDb}
                  min={-4}
                  max={4}
                  onChange={(v) => applyParams({ ...params, midGainDb: v })}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                />
                <Slider
                  label="Air (shelf @ 8 kHz)"
                  value={params.highGainDb}
                  min={-6}
                  max={6}
                  onChange={(v) => applyParams({ ...params, highGainDb: v })}
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)} dB`}
                />
              </div>
              <div className="space-y-4">
                <Slider
                  label="Compressor threshold"
                  value={params.compThreshold}
                  min={-40}
                  max={0}
                  onChange={(v) => applyParams({ ...params, compThreshold: v })}
                  format={(v) => `${v.toFixed(0)} dBFS`}
                />
                <Slider
                  label="Compressor ratio"
                  value={params.compRatio}
                  min={1}
                  max={8}
                  step={0.1}
                  onChange={(v) => applyParams({ ...params, compRatio: v })}
                  format={(v) => `${v.toFixed(1)}:1`}
                />
                <Slider
                  label="Limiter drive"
                  value={params.limiterDrive}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) => applyParams({ ...params, limiterDrive: v })}
                  format={(v) => (v === 0 ? "off" : `${Math.round(v * 100)}%`)}
                />
                <Slider
                  label="True-peak ceiling"
                  value={params.ceilingDb}
                  min={-3}
                  max={0}
                  step={0.1}
                  onChange={(v) => applyParams({ ...params, ceilingDb: v })}
                  format={(v) => `${v.toFixed(1)} dBTP`}
                />
                <Toggle label="Rumble filter (30 Hz high-pass)" checked={params.rumbleFilter} onChange={(v) => applyParams({ ...params, rumbleFilter: v })} />
              </div>
            </div>
          </Card>

          {/* render + export */}
          <Card className="p-4 sm:p-5">
            {render.phase === "rendering" ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-fuchsia-300">Mastering… {formatDuration(render.doneSec)} / {formatDuration(render.totalSec)}</span>
                  <span className="font-mono text-xs text-zinc-500">{Math.round((render.doneSec / Math.max(1, render.totalSec)) * 100)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-amber-500 transition-all" style={{ width: `${(render.doneSec / Math.max(1, render.totalSec)) * 100}%` }} />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Rendering on this device — you can switch apps, but keep this tab open. I&apos;ll ping you when it&apos;s done.</p>
              </div>
            ) : render.phase === "error" ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">Rendering failed: {render.message}</div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => void handleRender()} className="min-w-[160px]">
                  🎚 Master it
                </Button>
                <span className="text-xs text-zinc-500">
                  Renders to 48 kHz, normalizes to {params.targetLufs} LUFS, peak capped at {params.ceilingDb.toFixed(1)} dBTP.
                </span>
              </div>
            )}

            {render.phase === "done" && outcome && (
              <div className="mt-4">
                <div className="grid gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:grid-cols-4">
                  <ResultStat label="Input loudness" value={inputLufs != null ? `${inputLufs.toFixed(1)} LUFS` : "—"} />
                  <ResultStat label="Output loudness" value={`${outcome.outputLufs.toFixed(1)} LUFS`} accent />
                  <ResultStat label="True peak" value={`${outcome.outputTruePeakDb.toFixed(1)} dBTP`} />
                  <ResultStat label="Gain applied" value={`${outcome.gainAppliedDb > 0 ? "+" : ""}${outcome.gainAppliedDb.toFixed(1)} dB`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button onClick={() => void handleExport(16)} disabled={exporting !== null} variant="ghost">
                    {exporting === 16 ? "Exporting…" : `⬇ 16-bit WAV (~${formatBytes(wav16Size)})`}
                  </Button>
                  <Button onClick={() => void handleExport(24)} disabled={exporting !== null} variant="primary">
                    {exporting === 24 ? "Exporting…" : `⬇ 24-bit WAV (~${formatBytes(wav24Size)}) · label-ready`}
                  </Button>
                  <span className="text-[11px] text-zinc-500">YouTube, Instagram & labels all accept WAV — already loudness-normalized.</span>
                </div>
              </div>
            )}
          </Card>
        </>
      )}

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
    </div>
  );
}

function ResultStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`font-mono text-sm font-semibold ${accent ? "text-emerald-300" : "text-zinc-200"}`}>{value}</div>
    </div>
  );
}
