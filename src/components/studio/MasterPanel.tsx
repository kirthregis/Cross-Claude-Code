"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioInfo, MasterParams, MasterResult, Project } from "@/lib/studio/types";
import { DEFAULT_MASTER_PARAMS, MASTER_PRESETS } from "@/lib/studio/types";
import { decodeAudioFile, renderMaster, MasteringPlayer } from "@/lib/studio/audio";
import { formatBytes, formatDuration } from "@/lib/studio/dsp";
import { wavBlob, type WavTags } from "@/lib/studio/wav";
import { notify, speak } from "@/lib/studio/speech";
import { loadSettings, upsertProject, putBlob, getBlob } from "@/lib/studio/store";
import { saveLibraryTrack } from "@/lib/studio/library-store";
import { Button, Card, SectionLabel } from "./ui";

interface Props {
  project: Project;
  onChanged: () => void;
}

export function MasterPanel({ project, onChanged }: Props) {
  const settings = loadSettings();
  const [params, setParams] = useState<MasterParams>({ ...DEFAULT_MASTER_PARAMS, ...project.masterParams });
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [masteredBuffer, setMasteredBuffer] = useState<AudioBuffer | null>(null);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState<{ pct: number; stage: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Playback state
  const playerRef = useRef<MasteringPlayer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackMode, setPlaybackMode] = useState<"original" | "mastered">("mastered");
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On mount, try to reload the persisted mastered audio from IndexedDB
  useEffect(() => {
    if (project.meta.mastered && !masteredBuffer) {
      const blobKey = `emy-master:${project.meta.id}`;
      void getBlob(blobKey).then(async (blob) => {
        if (blob && blob instanceof Blob) {
          try {
            const buf = await decodeAudioFile(blob);
            setMasteredBuffer(buf);
            // Also set as audioBuffer so the player can init and play
            if (!audioBuffer) setAudioBuffer(buf);
            if (playerRef.current) {
              await playerRef.current.init(buf, buf);
              playerRef.current.setMode("mastered");
            }
          } catch {
            /* master blob corrupt, DJ needs to re-master */
          }
        }
      });
    }
  }, [project.meta.id, project.meta.mastered]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize player and route to user-selected audio output device
  useEffect(() => {
    const p = new MasteringPlayer();
    if (settings.audioOutputDevice) {
      void p.setOutputDevice(settings.audioOutputDevice);
    }
    playerRef.current = p;
    return () => {
      playerRef.current?.stop();
    };
  }, [settings.audioOutputDevice]);

  // Update time tracker loop
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime());
        setIsPlaying(playerRef.current.getIsPlaying());
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    try {
      const buf = await decodeAudioFile(file);
      setAudioBuffer(buf);
      setMasteredBuffer(null);

      const audioInfo: AudioInfo = {
        fileName: file.name,
        sizeBytes: file.size,
        durationSec: buf.duration,
        sampleRate: buf.sampleRate,
        channels: buf.numberOfChannels,
      };

      upsertProject({
        ...project,
        audio: audioInfo,
        meta: { ...project.meta, updatedAt: Date.now() },
      });
      onChanged();

      if (playerRef.current) {
        await playerRef.current.init(buf);
      }
      speak(`Audio loaded: ${file.name}. Pick a target preset or hit Master.`, settings.soundOn, "en-US", settings.voiceGender);
    } catch (e) {
      setError(`Failed to read audio file: ${e instanceof Error ? e.message : "Invalid format"}`);
    }
  }, [project, settings.soundOn, settings.voiceGender, onChanged]);

  const applyPreset = (presetKey: string) => {
    const p = MASTER_PRESETS[presetKey];
    if (!p) return;
    const updated = { ...p.params };
    setParams(updated);
    upsertProject({
      ...project,
      masterParams: updated,
      meta: { ...project.meta, updatedAt: Date.now() },
    });
    onChanged();
  };

  const updateParam = <K extends keyof MasterParams>(key: K, val: MasterParams[K]) => {
    const updated = { ...params, [key]: val };
    setParams(updated);
    upsertProject({
      ...project,
      masterParams: updated,
      meta: { ...project.meta, updatedAt: Date.now() },
    });
    onChanged();
  };

  const runMastering = async () => {
    if (!audioBuffer) {
      fileInputRef.current?.click();
      return;
    }
    setRendering(true);
    setError(null);
    try {
      const result = await renderMaster(audioBuffer, params, (p) => setProgress(p));
      setMasteredBuffer(result.renderedBuffer);

      if (playerRef.current) {
        playerRef.current.setMasteredBuffer(result.renderedBuffer);
        playerRef.current.setMode("mastered");
        setPlaybackMode("mastered");
      }

      const masterResult: MasterResult = {
        params,
        inputLufs: result.inputLufs,
        outputLufs: result.outputLufs,
        inputTruePeakDb: result.inputTruePeakDb,
        outputTruePeakDb: result.outputTruePeakDb,
        gainAppliedDb: result.gainAppliedDb,
        renderedAt: Date.now(),
        exportName: `${project.meta.name.replace(/[^a-zA-Z0-9_-]/g, "_")}_48kHz_24bit.wav`,
        exportedWav24: true,
      };

      upsertProject({
        ...project,
        master: masterResult,
        meta: {
          ...project.meta,
          mastered: true,
          stage: project.meta.stage === "draft" ? "master" : project.meta.stage,
          updatedAt: Date.now(),
        },
      });
      onChanged();

      // Auto-save mastered WAV to device (IndexedDB) so it persists across sessions
      try {
        const ch0Out = result.renderedBuffer.getChannelData(0);
        const ch1Out = result.renderedBuffer.numberOfChannels > 1 ? result.renderedBuffer.getChannelData(1) : ch0Out;
        const autoTags: WavTags = {
          title: project.meta.name,
          artist: settings.artistName || "DJ EMY",
          genre: project.meta.genre || "Afro House",
          album: "EMY Studio Master",
          comment: `Mastered via EMY Studio to ${result.outputLufs.toFixed(1)} LUFS`,
        };
        const autoBlob = wavBlob([ch0Out, ch1Out], result.renderedBuffer.sampleRate, 24, autoTags);
        const blobKey = `emy-master:${project.meta.id}`;
        void putBlob(blobKey, autoBlob);
        // Also save to Music Library so DJ can find it there
        const cleanN = project.meta.name.replace(/[^a-zA-Z0-9_ -]/g, "_");
        const masterFile = new File([autoBlob], `${cleanN}_MASTER_24bit.wav`, { type: "audio/wav" });
        void saveLibraryTrack(masterFile);
        masterResult.exportSizeBytes = autoBlob.size;
      } catch {
        /* auto-save best effort */
      }

      notify("Mastering complete — saved to device", `"${project.meta.name}" is mastered to ${result.outputLufs.toFixed(1)} LUFS. Auto-saved to your Library.`);
      speak(
        `Mastering finished at ${result.outputLufs.toFixed(1)} LUFS with ${result.gainAppliedDb > 0 ? "+" : ""}${result.gainAppliedDb.toFixed(1)} dB boost. Check the A/B comparison.`,
        settings.soundOn,
        "en-US",
        settings.voiceGender,
      );
    } catch (e) {
      setError(`Mastering failed: ${e instanceof Error ? e.message : "DSP error"}`);
    } finally {
      setRendering(false);
      setProgress(null);
    }
  };

  const handlePlayToggle = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleModeChange = (mode: "original" | "mastered") => {
    setPlaybackMode(mode);
    playerRef.current?.setMode(mode);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sec = parseFloat(e.target.value);
    setCurrentTime(sec);
    playerRef.current?.seek(sec);
  };

  const exportWavFile = async (bits: 16 | 24) => {
    const buf = masteredBuffer ?? audioBuffer;
    if (!buf) {
      setError("Load an audio file first.");
      return;
    }

    const ch0 = buf.getChannelData(0);
    const ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : ch0;

    const tags: WavTags = {
      title: project.meta.name,
      artist: settings.artistName || "DJ EMY",
      genre: project.meta.genre || "Afro House",
      album: "EMY Studio Master",
      comment: `Mastered via EMY Studio to ${project.master?.outputLufs.toFixed(1) ?? params.targetLufs} LUFS`,
    };

    const blob = wavBlob([ch0, ch1], buf.sampleRate, bits, tags);
    const cleanName = project.meta.name.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `${cleanName}_48kHz_${bits}bit.wav`;

    // 1. Try File System Access API (Chrome/Edge) — lets user pick save location
    const win = window as unknown as { showSaveFilePicker?: (opts: unknown) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }> };
    if (typeof win.showSaveFilePicker === "function") {
      try {
        const handle = await win.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: "WAV Audio", accept: { "audio/wav": [".wav"] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        speak("Exported and saved to your device.", settings.soundOn, "en-US", settings.voiceGender);
      } catch {
        // User cancelled — fall through to classic download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } else {
      // 2. Fallback: classic browser download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // 3. Always save to IndexedDB for persistence
    const blobKey = `emy-export:${project.meta.id}:${bits}bit`;
    void putBlob(blobKey, blob);

    // 4. Always save to Library so DJ can find and play it
    const exportFile = new File([blob], fileName, { type: "audio/wav" });
    void saveLibraryTrack(exportFile);

    // 5. Update project metadata
    upsertProject({
      ...project,
      master: {
        ...project.master!,
        exportSizeBytes: blob.size,
        [`exportedWav${bits}` as const]: true,
      },
      meta: { ...project.meta, updatedAt: Date.now() },
    });
    onChanged();
  };

  const duration = audioBuffer?.duration || project.audio?.durationSec || 0;

  return (
    <div className="space-y-4">
      {/* File Import Header */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel><span id="tutorial-upload">Audio Source</span></SectionLabel>
            {project.audio ? (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                <span className="font-bold text-white">{project.audio.fileName}</span>
                <span className="text-zinc-500">·</span>
                <span>{formatDuration(project.audio.durationSec)}</span>
                <span className="text-zinc-500">·</span>
                <span>{project.audio.sampleRate} Hz</span>
                <span className="text-zinc-500">·</span>
                <span>{project.audio.channels === 2 ? "Stereo" : "Mono"}</span>
                <span className="text-zinc-500">·</span>
                <span>{formatBytes(project.audio.sizeBytes)}</span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-zinc-500">
                Drag and drop your raw mix (MP3, WAV, M4A, FLAC, AIFF) or browse.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
              }}
            />
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
              {project.audio ? "↻ Replace Audio" : "⬆ Choose Audio File"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Target Presets */}
      <Card className="p-4 sm:p-5">
        <SectionLabel><span id="tutorial-presets">Mastering Targets & Presets</span></SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">
          Industry-standard integrated loudness curves tailored for streaming, club PA systems, and label distribution.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(MASTER_PRESETS).map(([id, p]) => {
            const isSelected = params.targetLufs === p.params.targetLufs;
            return (
              <button
                key={id}
                onClick={() => applyPreset(id)}
                className={`rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? "border-fuchsia-500 bg-fuchsia-500/10 text-white"
                    : "border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="text-xs font-bold">{p.label.split(" (")[0]}</div>
                <div className="mt-1 text-[11px] font-mono text-fuchsia-300">
                  {p.params.targetLufs} LUFS
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Real-time A/B Player */}
      {(audioBuffer || project.master) && (
        <Card className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionLabel><span id="tutorial-player">A/B Master Audition & Preview</span></SectionLabel>
            <div className="flex rounded-xl border border-zinc-800 bg-zinc-950 p-0.5">
              <button
                onClick={() => handleModeChange("original")}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  playbackMode === "original"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Original Audio
              </button>
              <button
                onClick={() => handleModeChange("mastered")}
                disabled={!masteredBuffer && !project.master}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition disabled:opacity-30 ${
                  playbackMode === "mastered"
                    ? "bg-fuchsia-600 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Mastered DSP
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayToggle}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:bg-zinc-200 active:scale-95 font-bold"
              >
                {isPlaying ? "⏸" : "▶"}
              </button>
              <div className="min-w-0 flex-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full accent-fuchsia-500 cursor-pointer"
                />
                <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-zinc-500">🔊</span>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    playerRef.current?.setVolume(v);
                  }}
                  className="w-16 accent-fuchsia-500"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* DSP Mastering Chain — Studio Grade */}
      <div className="grid gap-4 sm:grid-cols-2">

        {/* Input & Quick Fixes */}
        <Card className="p-4">
          <SectionLabel><span id="tutorial-quickfix">Input & Quick Fix</span></SectionLabel>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Input Gain</span>
                <span className="font-mono text-zinc-200">{params.inputGainDb > 0 ? "+" : ""}{params.inputGainDb} dB</span>
              </div>
              <input type="range" min={-12} max={12} step={0.5} value={params.inputGainDb} onChange={(e) => updateParam("inputGainDb", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-1.5 text-xs text-zinc-300"><input type="checkbox" checked={params.rumbleFilter} onChange={(e) => updateParam("rumbleFilter", e.target.checked)} className="accent-fuchsia-500" /><span>Rumble Cut</span></label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-300"><input type="checkbox" checked={params.mudCut} onChange={(e) => updateParam("mudCut", e.target.checked)} className="accent-fuchsia-500" /><span>Cut Mud</span></label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-300"><input type="checkbox" checked={params.airBoost} onChange={(e) => updateParam("airBoost", e.target.checked)} className="accent-fuchsia-500" /><span>Add Air</span></label>
              <label className="flex items-center gap-1.5 text-xs text-zinc-300"><input type="checkbox" checked={params.monoBass} onChange={(e) => updateParam("monoBass", e.target.checked)} className="accent-fuchsia-500" /><span>Mono Bass</span></label>
            </div>
          </div>
        </Card>

        {/* 5-Band Parametric EQ */}
        <Card className="p-4">
          <SectionLabel><span id="tutorial-eq">5-Band Parametric EQ</span></SectionLabel>
          <div className="mt-3 space-y-2">
            {([
              { key: "lowGainDb" as const, label: "80 Hz", desc: "Low Shelf" },
              { key: "lowMidGainDb" as const, label: "250 Hz", desc: "Low-Mid" },
              { key: "midGainDb" as const, label: "1 kHz", desc: "Mid" },
              { key: "highMidGainDb" as const, label: "4 kHz", desc: "Presence" },
              { key: "highGainDb" as const, label: "12 kHz", desc: "Air Shelf" },
            ] as const).map(band => (
              <div key={band.key}>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">{band.label} <span className="text-zinc-600">{band.desc}</span></span>
                  <span className="font-mono text-zinc-200">{(params[band.key] ?? 0) > 0 ? "+" : ""}{params[band.key] ?? 0} dB</span>
                </div>
                <input type="range" min={-8} max={8} step={0.5} value={params[band.key] ?? 0} onChange={(e) => updateParam(band.key, parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
              </div>
            ))}
          </div>
        </Card>

        {/* Compressor */}
        <Card className="p-4">
          <SectionLabel><span id="tutorial-compressor">Compressor</span></SectionLabel>
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Threshold</span><span className="font-mono text-zinc-200">{params.compThreshold} dB</span></div>
              <input type="range" min={-30} max={-6} step={1} value={params.compThreshold} onChange={(e) => updateParam("compThreshold", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Ratio</span><span className="font-mono text-zinc-200">{params.compRatio.toFixed(1)}:1</span></div>
              <input type="range" min={1.2} max={8.0} step={0.1} value={params.compRatio} onChange={(e) => updateParam("compRatio", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Attack</span><span className="font-mono text-zinc-200">{params.compAttack} ms</span></div>
              <input type="range" min={1} max={100} step={1} value={params.compAttack} onChange={(e) => updateParam("compAttack", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Release</span><span className="font-mono text-zinc-200">{params.compRelease} ms</span></div>
              <input type="range" min={50} max={500} step={10} value={params.compRelease} onChange={(e) => updateParam("compRelease", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Knee</span><span className="font-mono text-zinc-200">{params.compKnee} dB</span></div>
              <input type="range" min={0} max={30} step={1} value={params.compKnee} onChange={(e) => updateParam("compKnee", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
          </div>
        </Card>

        {/* Limiter, Clipper & Stereo */}
        <Card className="p-4">
          <SectionLabel><span id="tutorial-limiter">Limiter, Clipper & Stereo</span></SectionLabel>
          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Limiter Drive</span><span className="font-mono text-zinc-200">{params.limiterDrive.toFixed(2)}</span></div>
              <input type="range" min={0} max={1.5} step={0.05} value={params.limiterDrive} onChange={(e) => updateParam("limiterDrive", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400">True Peak Ceiling</span><span className="font-mono text-zinc-200">{params.ceilingDb} dBTP</span></div>
              <input type="range" min={-3.0} max={-0.1} step={0.1} value={params.ceilingDb} onChange={(e) => updateParam("ceilingDb", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <label className="flex items-center gap-2 pt-2 border-t border-zinc-800 text-xs text-zinc-300">
              <input type="checkbox" checked={params.softClipEnabled} onChange={(e) => updateParam("softClipEnabled", e.target.checked)} className="accent-fuchsia-500" />
              <span>Soft Clipper (analog warmth)</span>
            </label>
            {params.softClipEnabled && (
              <div>
                <div className="flex justify-between text-xs"><span className="text-zinc-400">Clip Drive</span><span className="font-mono text-zinc-200">{params.softClipDrive.toFixed(2)}</span></div>
                <input type="range" min={0.05} max={0.8} step={0.05} value={params.softClipDrive} onChange={(e) => updateParam("softClipDrive", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
              </div>
            )}
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex justify-between text-xs"><span className="text-zinc-400">Stereo Width</span><span className="font-mono text-zinc-200">{params.stereoWidth}%</span></div>
              <input type="range" min={0} max={200} step={5} value={params.stereoWidth} onChange={(e) => updateParam("stereoWidth", parseFloat(e.target.value))} className="w-full accent-fuchsia-500" />
            </div>
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={params.ditherEnabled} onChange={(e) => updateParam("ditherEnabled", e.target.checked)} className="accent-fuchsia-500" />
              <span>Dither (16-bit export)</span>
            </label>
          </div>
        </Card>
      </div>

      {/* Render & Status */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Mastering Execution</h3>
            <p className="text-xs text-zinc-500">
              Renders the entire mix through the 48 kHz DSP chain on this device with BS.1770-4 loudness compliance.
            </p>
          </div>
          <Button
            id="tutorial-master-btn"
            onClick={() => void runMastering()}
            disabled={rendering}
            className="shrink-0 !py-3 !px-6 text-sm font-bold"
          >
            {rendering ? "Mastering In Progress…" : project.meta.mastered ? "⚡ Re-Master Mix" : "⚡ Master Mix Now"}
          </Button>
        </div>

        {progress && (
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-zinc-300">
              <span>{progress.stage}</span>
              <span className="font-mono">{progress.pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="brand-grad h-full transition-all duration-300"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>
        )}

        {project.master && (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-zinc-800/80 pt-4 sm:grid-cols-4">
            <div className="rounded-xl bg-zinc-950 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Input Loudness</div>
              <div className="mt-1 font-mono text-sm font-bold text-zinc-300">
                {project.master.inputLufs.toFixed(1)} LUFS
              </div>
            </div>
            <div className="rounded-xl bg-zinc-950 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Mastered Loudness</div>
              <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
                {project.master.outputLufs.toFixed(1)} LUFS
              </div>
            </div>
            <div className="rounded-xl bg-zinc-950 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">True Peak</div>
              <div className="mt-1 font-mono text-sm font-bold text-zinc-300">
                {project.master.outputTruePeakDb.toFixed(1)} dBTP
              </div>
            </div>
            <div className="rounded-xl bg-zinc-950 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Makeup Boost</div>
              <div className="mt-1 font-mono text-sm font-bold text-fuchsia-400">
                {project.master.gainAppliedDb > 0 ? "+" : ""}
                {project.master.gainAppliedDb.toFixed(1)} dB
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Export Section */}
      <Card className="p-4 sm:p-5">
        <SectionLabel><span id="tutorial-export">Label Deliverables & WAV Export</span></SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">
          Exports tagged WAV files directly to your device. Metadata is embedded into RIFF INFO chunks.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            onClick={() => void exportWavFile(24)}
            disabled={!audioBuffer && !project.master}
            className="flex-1 !py-3 font-bold"
          >
            ⬇ Export 24-Bit / 48kHz WAV (Label Master)
          </Button>
          <Button
            variant="ghost"
            onClick={() => void exportWavFile(16)}
            disabled={!audioBuffer && !project.master}
            className="flex-1 !py-3 font-bold"
          >
            ⬇ Export 16-Bit / 48kHz WAV (Dithered)
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
