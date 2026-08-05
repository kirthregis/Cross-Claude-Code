"use client";
import {
  useEffect, useRef, useState,
  useCallback, type RefObject
} from "react";
import WaveSurfer from "wavesurfer.js";
import * as Tone from "tone";
import { DeckUI } from "./DeckUI";
import { wavBlob } from "@/lib/studio/wav";
import { measureLoudness, computeMakeupGain, dbToGain } from "@/lib/studio/dsp";
import type { Project } from "@/lib/studio/types";

interface Props { project: Project; onChanged: () => void; }
interface EQ { lo: number; mid: number; hi: number; }
interface DeckState {
  loaded: boolean;
  playing: boolean;
  bpm: number | null;
  duration: number;
  currentTime: number;
  fileName: string;
}
const EMPTY: DeckState = {
  loaded: false, playing: false,
  bpm: null, duration: 0,
  currentTime: 0, fileName: ""
};

/** Detect BPM from an already-decoded AudioBuffer. No extra file read. */
function detectBPMFromBuffer(buf: AudioBuffer): number | null {
  try {
    const data = buf.getChannelData(0);
    const sr = buf.sampleRate;
    const hop = Math.floor(sr * 0.01);
    const energies: number[] = [];
    for (let i = 0; i + hop < data.length; i += hop) {
      let e = 0;
      for (let j = 0; j < hop; j++) e += data[i + j] ** 2;
      energies.push(e / hop);
    }
    if (energies.length < 10) return null;
    const mean = energies.reduce((a, b) => a + b, 0) / energies.length;
    const onsets: number[] = [];
    for (let i = 1; i < energies.length - 1; i++) {
      if (
        energies[i] > mean * 1.5 &&
        energies[i] > energies[i - 1] &&
        energies[i] > energies[i + 1]
      ) {
        onsets.push((i * hop) / sr);
      }
    }
    if (onsets.length < 4) return null;
    const gaps: number[] = [];
    for (let i = 1; i < Math.min(onsets.length, 32); i++) {
      gaps.push(onsets[i] - onsets[i - 1]);
    }
    gaps.sort((a, b) => a - b);
    const median = gaps[Math.floor(gaps.length / 2)];
    if (median <= 0) return null;
    const bpm = Math.round(60 / median);
    return bpm > 60 && bpm < 200 ? bpm : null;
  } catch {
    return null;
  }
}

export function MasterPanel({ project, onChanged }: Props) {
  const waveARef = useRef<HTMLDivElement>(null);
  const waveBRef = useRef<HTMLDivElement>(null);
  const wsARef = useRef<WaveSurfer | null>(null);
  const wsBRef = useRef<WaveSurfer | null>(null);
  const sourceARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceBRef = useRef<MediaElementAudioSourceNode | null>(null);
  const eqARef = useRef<Tone.EQ3 | null>(null);
  const eqBRef = useRef<Tone.EQ3 | null>(null);
  const volANodeRef = useRef<Tone.Volume | null>(null);
  const volBNodeRef = useRef<Tone.Volume | null>(null);
  const crossRef = useRef<Tone.CrossFade | null>(null);
  const limiterRef = useRef<Tone.Limiter | null>(null);
  const bufARef = useRef<AudioBuffer | null>(null);
  const bufBRef = useRef<AudioBuffer | null>(null);
  const engineRef = useRef(false);

  const [deckA, setDeckA] = useState<DeckState>(EMPTY);
  const [deckB, setDeckB] = useState<DeckState>(EMPTY);
  const [crossfade, setCrossfade] = useState(0.5);
  const [volA, setVolA] = useState(0);
  const [volB, setVolB] = useState(0);
  const [eqA, setEqA] = useState<EQ>({ lo: 0, mid: 0, hi: 0 });
  const [eqB, setEqB] = useState<EQ>({ lo: 0, mid: 0, hi: 0 });
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Build Tone.js signal chain once per mount */
  const initEngine = useCallback(async () => {
    if (engineRef.current) return;
    engineRef.current = true;
    await Tone.start();
    const eqA = new Tone.EQ3(0, 0, 0);
    const eqB = new Tone.EQ3(0, 0, 0);
    const volA = new Tone.Volume(0);
    const volB = new Tone.Volume(0);
    const cross = new Tone.CrossFade(0.5);
    const limiter = new Tone.Limiter(-1);
    eqA.connect(volA);
    volA.connect(cross.a);
    eqB.connect(volB);
    volB.connect(cross.b);
    cross.connect(limiter);
    limiter.toDestination();
    eqARef.current = eqA;
    eqBRef.current = eqB;
    volANodeRef.current = volA;
    volBNodeRef.current = volB;
    crossRef.current = cross;
    limiterRef.current = limiter;
  }, []);

  /** Create WaveSurfer instances after DOM is ready */
  useEffect(() => {
    if (!waveARef.current || !waveBRef.current) return;

    wsARef.current = WaveSurfer.create({
      container: waveARef.current,
      waveColor: "#3b82f6",
      progressColor: "#1d4ed8",
      height: 64,
      barWidth: 2,
      barGap: 1,
    });
    wsBRef.current = WaveSurfer.create({
      container: waveBRef.current,
      waveColor: "#a855f7",
      progressColor: "#7e22ce",
      height: 64,
      barWidth: 2,
      barGap: 1,
    });

    wsARef.current.on("timeupdate", t =>
      setDeckA(d => ({ ...d, currentTime: t }))
    );
    wsBRef.current.on("timeupdate", t =>
      setDeckB(d => ({ ...d, currentTime: t }))
    );
    wsARef.current.on("finish", () =>
      setDeckA(d => ({ ...d, playing: false }))
    );
    wsBRef.current.on("finish", () =>
      setDeckB(d => ({ ...d, playing: false }))
    );

    return () => {
      wsARef.current?.destroy();
      wsBRef.current?.destroy();
      eqARef.current?.dispose();
      eqBRef.current?.dispose();
      volANodeRef.current?.dispose();
      volBNodeRef.current?.dispose();
      crossRef.current?.dispose();
      limiterRef.current?.dispose();
    };
  }, []);

  const connectDeckToChain = useCallback((
    ws: WaveSurfer,
    eqNode: Tone.EQ3,
    sourceRef: RefObject<MediaElementAudioSourceNode | null>
  ) => {
    const media = ws.getMediaElement();
    if (!media) return;
    const toneCtx = Tone.getContext().rawContext as AudioContext;
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch {}
    }
    const src = toneCtx.createMediaElementSource(media);
    src.connect(eqNode.input as unknown as AudioNode);
    sourceRef.current = src;
  }, []);

  const loadDeck = useCallback(async (file: File, deck: "A" | "B") => {
    setError(null);
    const isA = deck === "A";
    const setDeck = isA ? setDeckA : setDeckB;
    const ws = isA ? wsARef.current : wsBRef.current;
    const eqNode = isA ? eqARef.current : eqBRef.current;
    const srcRef = isA ? sourceARef : sourceBRef;

    if (!ws || !eqNode) return;
    setDeck(d => ({ ...d, fileName: file.name, loaded: false }));

    try {
      await initEngine();
      const url = URL.createObjectURL(file);
      await ws.load(url);
      const duration = ws.getDuration();

      // Connect WaveSurfer media element to Tone.js chain
      connectDeckToChain(ws, eqNode, srcRef);

      // Decode for export (separate copy — does not interfere with playback)
      const ab = await file.arrayBuffer();
      const toneCtx = Tone.getContext().rawContext as AudioContext;
      const buf = await toneCtx.decodeAudioData(ab);
      if (isA) bufARef.current = buf;
      else bufBRef.current = buf;

      // BPM from already-decoded buffer — no extra file read
      const bpm = detectBPMFromBuffer(buf);
      setDeck({ loaded: true, playing: false, bpm, duration, currentTime: 0, fileName: file.name });
      onChanged();
    } catch (e) {
      setError(`Deck ${deck}: ${e instanceof Error ? e.message : "load failed"}`);
    }
  }, [initEngine, connectDeckToChain, onChanged]);

  const playDeck = useCallback(async (deck: "A" | "B") => {
    await initEngine();
    const ws = deck === "A" ? wsARef.current : wsBRef.current;
    const setDeck = deck === "A" ? setDeckA : setDeckB;
    if (!ws) return;
    await ws.play();
    setDeck(d => ({ ...d, playing: true }));
  }, [initEngine]);

  const stopDeck = useCallback((deck: "A" | "B") => {
    const ws = deck === "A" ? wsARef.current : wsBRef.current;
    const setDeck = deck === "A" ? setDeckA : setDeckB;
    ws?.pause();
    setDeck(d => ({ ...d, playing: false }));
  }, []);

  // Live crossfader
  useEffect(() => {
    if (crossRef.current) crossRef.current.fade.value = crossfade;
  }, [crossfade]);

  // Live volume A
  useEffect(() => {
    if (volANodeRef.current) volANodeRef.current.volume.value = volA;
  }, [volA]);

  // Live volume B
  useEffect(() => {
    if (volBNodeRef.current) volBNodeRef.current.volume.value = volB;
  }, [volB]);

  // Live EQ A
  useEffect(() => {
    const eq = eqARef.current;
    if (!eq) return;
    eq.low.value = eqA.lo;
    eq.mid.value = eqA.mid;
    eq.high.value = eqA.hi;
  }, [eqA]);

  // Live EQ B
  useEffect(() => {
    const eq = eqBRef.current;
    if (!eq) return;
    eq.low.value = eqB.lo;
    eq.mid.value = eqB.mid;
    eq.high.value = eqB.hi;
  }, [eqB]);

  const handleExport = useCallback(async () => {
    const bufA = bufARef.current;
    const bufB = bufBRef.current;
    if (!bufA && !bufB) return;
    setExporting(true);
    setError(null);
    try {
      setStatus("Mixing at current crossfader position...");
      const primary = bufA ?? bufB!;
      const sampleRate = primary.sampleRate;
      const numChannels = primary.numberOfChannels;
      const lenA = bufA?.length ?? 0;
      const lenB = bufB?.length ?? 0;
      const total = Math.max(lenA, lenB);
      const gainA = Math.min(1, (1 - crossfade) * 2) * dbToGain(volA);
      const gainB = Math.min(1, crossfade * 2) * dbToGain(volB);
      const mixed: Float32Array[] = [];
      for (let c = 0; c < numChannels; c++) {
        const out = new Float32Array(total);
        const chA = bufA?.getChannelData(c);
        const chB = bufB?.getChannelData(c);
        for (let i = 0; i < total; i++) {
          const sA = chA && i < lenA ? chA[i] * gainA : 0;
          const sB = chB && i < lenB ? chB[i] * gainB : 0;
          out[i] = Math.max(-1, Math.min(1, sA + sB));
        }
        mixed.push(out);
      }
      setStatus("Measuring loudness (BS.1770-4)...");
      const mono = new Float32Array(total);
      for (let i = 0; i < total; i++) {
        let sum = 0;
        for (const ch of mixed) sum += ch[i];
        mono[i] = sum / mixed.length;
      }
      const loudness = measureLoudness(mono, sampleRate);
      const gainDb = computeMakeupGain(loudness, -14, -1);
      const gainLin = dbToGain(gainDb);
      setStatus(`Applying ${gainDb.toFixed(1)}dB → -14 LUFS...`);
      const mastered = mixed.map(ch => {
        const out = new Float32Array(ch.length);
        for (let i = 0; i < ch.length; i++) {
          out[i] = Math.max(-1, Math.min(1, ch[i] * gainLin));
        }
        return out;
      });
      setStatus("Encoding 24-bit WAV...");
      const blob = wavBlob(mastered, sampleRate, 24, {
        title: project.meta.name,
        artist: "DJ Emy",
        genre: project.meta.genre,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.meta.name.replace(/\s+/g, "_")}_MASTERED_-14LUFS.wav`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
      setStatus("✅ Mastered WAV exported!");
      setTimeout(() => setStatus(null), 5000);
      onChanged();
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setExporting(false);
    }
  }, [crossfade, volA, volB, project, onChanged]);

  return (
    <div className="space-y-4 p-4 bg-zinc-900 rounded-3xl border border-zinc-800 text-white">
      <div className="flex justify-between items-center">
        <h2 className="text-base font-black tracking-tight">🎛 PRO MIXING DECK</h2>
        <span className="text-[10px] text-zinc-500 truncate max-w-[160px]">
          {project.meta.name}
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-300">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <DeckUI
          deck="A"
          state={deckA}
          eq={eqA}
          vol={volA}
          waveRef={waveARef}
          onFile={f => void loadDeck(f, "A")}
          onPlay={() => void playDeck("A")}
          onStop={() => stopDeck("A")}
          onEQ={setEqA}
          onVol={setVolA}
        />
        <DeckUI
          deck="B"
          state={deckB}
          eq={eqB}
          vol={volB}
          waveRef={waveBRef}
          onFile={f => void loadDeck(f, "B")}
          onPlay={() => void playDeck("B")}
          onStop={() => stopDeck("B")}
          onEQ={setEqB}
          onVol={setVolB}
        />
      </div>

      {/* Crossfader */}
      <div className="bg-black rounded-2xl p-3 border border-zinc-800 space-y-2">
        <div className="flex justify-between text-[10px] font-black">
          <span className="text-blue-400">
            ◀ A: {Math.round((1 - crossfade) * 100)}%
          </span>
          <span className="text-zinc-500">CROSSFADER</span>
          <span className="text-purple-400">
            B: {Math.round(crossfade * 100)}% ▶
          </span>
        </div>
        <input
          type="range" min={0} max={1} step={0.002}
          value={crossfade}
          onChange={e => setCrossfade(Number(e.target.value))}
          className="w-full h-5 accent-fuchsia-500 cursor-pointer"
        />
        <p className="text-[9px] text-zinc-600 text-center">
          Set crossfader position before exporting
        </p>
      </div>

      {/* Status */}
      {status && (
        <div className="rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 px-3 py-2 text-xs text-fuchsia-300 text-center">
          {status}
        </div>
      )}

      {/* Export */}
      {(deckA.loaded || deckB.loaded) && (
        <button
          onClick={() => void handleExport()}
          disabled={exporting}
          className="w-full bg-white text-black py-3 rounded-2xl font-black text-sm hover:bg-zinc-100 transition disabled:opacity-40"
        >
          {exporting
            ? "⏳ Mastering in progress..."
            : "⬇ EXPORT MASTERED MIX · -14 LUFS · 24-bit WAV"}
        </button>
      )}
    </div>
  );
}

export default MasterPanel;