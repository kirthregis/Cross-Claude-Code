"use client";
import type { RefObject } from "react";

interface EQ { lo: number; mid: number; hi: number; }

interface DeckState {
  loaded: boolean;
  playing: boolean;
  bpm: number | null;
  duration: number;
  currentTime: number;
  fileName: string;
}

interface DeckUIProps {
  deck: "A" | "B";
  state: DeckState;
  eq: EQ;
  vol: number;
  waveRef: RefObject<HTMLDivElement | null>;
  onFile: (file: File) => void;
  onPlay: () => void;
  onStop: () => void;
  onEQ: (eq: EQ) => void;
  onVol: (v: number) => void;
}

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function EQSlider({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center">
        <span className="text-[9px] text-zinc-500 uppercase font-bold">{label}</span>
        <span className="text-[9px] text-zinc-400 font-mono">
          {value > 0 ? "+" : ""}{value.toFixed(0)}dB
        </span>
      </div>
      <input
        type="range"
        min={-12}
        max={12}
        step={0.5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-fuchsia-500"
      />
    </div>
  );
}

export function DeckUI({
  deck, state, eq, vol,
  waveRef, onFile, onPlay, onStop, onEQ, onVol
}: DeckUIProps) {
  const isA = deck === "A";
  const borderColor = isA ? "border-blue-800" : "border-purple-800";
  const labelColor = isA ? "text-blue-400" : "text-purple-400";
  const playBg = isA
    ? "bg-blue-600 hover:bg-blue-500"
    : "bg-purple-600 hover:bg-purple-500";

  return (
    <div className={`p-3 bg-black rounded-2xl border space-y-2 ${borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-black uppercase tracking-widest ${labelColor}`}>
          DECK {deck}
        </p>
        {state.bpm !== null && (
          <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-300 font-mono">
            {state.bpm} BPM
          </span>
        )}
      </div>

      {/* File input */}
      <input
        type="file"
        accept="audio/*"
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
        className="text-[9px] w-full text-zinc-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:bg-zinc-800 file:text-zinc-300 file:cursor-pointer"
      />

      {/* File name */}
      {state.fileName && (
        <p className="text-[9px] text-zinc-500 truncate">{state.fileName}</p>
      )}

      {/* Waveform */}
      <div
        ref={waveRef}
        className="rounded-lg overflow-hidden bg-zinc-950"
        style={{ minHeight: 60 }}
      />

      {/* Time */}
      {state.loaded && (
        <div className="flex justify-between text-[9px] text-zinc-600 font-mono">
          <span>{formatTime(state.currentTime)}</span>
          <span>{formatTime(state.duration)}</span>
        </div>
      )}

      {/* Play/Stop */}
      <div className="flex gap-1">
        <button
          onClick={state.playing ? onStop : onPlay}
          disabled={!state.loaded}
          className={`flex-1 disabled:opacity-20 py-2 rounded-xl text-[10px] font-black transition text-white ${
            state.playing ? "bg-zinc-700 hover:bg-zinc-600" : playBg
          }`}
        >
          {state.playing ? "⏸ PAUSE" : "▶ PLAY"}
        </button>
      </div>

      {/* EQ */}
      <div className="space-y-1.5 pt-1 border-t border-zinc-900">
        <p className="text-[8px] text-zinc-600 uppercase font-bold">EQ</p>
        <EQSlider label="HI" value={eq.hi} onChange={v => onEQ({ ...eq, hi: v })} />
        <EQSlider label="MID" value={eq.mid} onChange={v => onEQ({ ...eq, mid: v })} />
        <EQSlider label="LO" value={eq.lo} onChange={v => onEQ({ ...eq, lo: v })} />
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
        <span className="text-[9px] text-zinc-500 shrink-0 w-6">VOL</span>
        <input
          type="range"
          min={-20}
          max={6}
          step={0.5}
          value={vol}
          onChange={e => onVol(Number(e.target.value))}
          className="flex-1 accent-fuchsia-500"
        />
        <span className="text-[9px] text-zinc-400 shrink-0 font-mono w-10 text-right">
          {vol > 0 ? "+" : ""}{vol.toFixed(0)}dB
        </span>
      </div>
    </div>
  );
}