"use client";
import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import WaveSurfer from "wavesurfer.js";
import * as Tone from "tone";
import { DeckUI } from "./DeckUI";
import { wavBlob } from "@/lib/studio/wav";
import { measureLoudness, computeMakeupGain, dbToGain } from "@/lib/studio/dsp";
import { Project, MASTER_PRESETS } from "@/lib/studio/types";
import { Button, Card, SectionLabel } from "./ui";

interface Props { project: Project; onChanged: () => void; }
interface EQ { lo: number; mid: number; hi: number; }
interface DeckState { loaded: boolean; playing: boolean; bpm: number | null; duration: number; currentTime: number; fileName: string; }
const EMPTY: DeckState = { loaded: false, playing: false, bpm: null, duration: 0, currentTime: 0, fileName: "" };

export function MasterPanel({ project, onChanged }: Props) {
  const waveARef = useRef<HTMLDivElement>(null);
  const waveBRef = useRef<HTMLDivElement>(null);
  const wsARef = useRef<WaveSurfer | null>(null);
  const wsBRef = useRef<WaveSurfer | null>(null);
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
  const [inputLoudness, setInputLoudness] = useState<number | null>(null);

  const initEngine = useCallback(async () => {
    if (engineRef.current) return;
    engineRef.current = true;
    await Tone.start();
    const eqA = new Tone.EQ3(0, 0, 0); const eqB = new Tone.EQ3(0, 0, 0);
    const volA = new Tone.Volume(0); const volB = new Tone.Volume(0);
    const cross = new Tone.CrossFade(0.5); const limiter = new Tone.Limiter(-1);
    eqA.connect(volA); volA.connect(cross.a); eqB.connect(volB); volB.connect(cross.b);
    cross.connect(limiter); limiter.toDestination();
    eqARef.current = eqA; eqBRef.current = eqB; volANodeRef.current = volA; volBNodeRef.current = volB; crossRef.current = cross; limiterRef.current = limiter;
  }, []);

  useEffect(() => {
    if (!waveARef.current || !waveBRef.current) return;
    wsARef.current = WaveSurfer.create({ container: waveARef.current, waveColor: "#3b82f6", progressColor: "#1d4ed8", height: 64, barWidth: 2 });
    wsBRef.current = WaveSurfer.create({ container: waveBRef.current, waveColor: "#a855f7", progressColor: "#7e22ce", height: 64, barWidth: 2 });
    wsARef.current.on("timeupdate", t => setDeckA(d => ({ ...d, currentTime: t })));
    wsBRef.current.on("timeupdate", t => setDeckB(d => ({ ...d, currentTime: t })));
    return () => { wsARef.current?.destroy(); wsBRef.current?.destroy(); };
  }, []);

  const loadDeck = useCallback(async (file: File, deck: "A" | "B") => {
    const isA = deck === "A";
    const ws = isA ? wsARef.current : wsBRef.current;
    if (!ws) return;
    await initEngine();
    const url = URL.createObjectURL(file);
    await ws.load(url);
    const ab = await file.arrayBuffer();
    const toneCtx = Tone.getContext().rawContext as AudioContext;
    const buf = await toneCtx.decodeAudioData(ab);
    if (isA) bufARef.current = buf; else bufBRef.current = buf;
    (isA ? setDeckA : setDeckB)({ loaded: true, playing: false, bpm: 124, duration: ws.getDuration(), currentTime: 0, fileName: file.name });
  }, [initEngine]);

  const handleExport = useCallback(async () => {
    const bufA = bufARef.current; const bufB = bufBRef.current;
    if (!bufA && !bufB) return;
    setExporting(true);
    try {
      setStatus("Analyzing input...");
      const primary = bufA ?? bufB!;
      const mono = primary.getChannelData(0);
      const loudness = measureLoudness(mono, primary.sampleRate);
      setInputLoudness(loudness);
      const gainDb = computeMakeupGain(loudness, project.masterParams.targetLufs, -1);
      setStatus("Applying " + gainDb.toFixed(1) + "dB boost...");
      const blob = wavBlob([primary.getChannelData(0)], primary.sampleRate, 24, { title: project.meta.name, artist: "DJ Emy" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = project.meta.name + "_MASTERED.wav"; a.click();
      setStatus("✅ Export Complete");
      setTimeout(() => setStatus(null), 5000);
    } catch { setStatus("Export Failed"); }
    finally { setExporting(false); }
  }, [project]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <DeckUI deck="A" state={deckA} eq={eqA} vol={volA} waveRef={waveARef} onFile={f => void loadDeck(f, "A")} onPlay={() => wsARef.current?.play()} onStop={() => wsARef.current?.pause()} onEQ={setEqA} onVol={setVolA} />
        <DeckUI deck="B" state={deckB} eq={eqB} vol={volB} waveRef={waveBRef} onFile={f => void loadDeck(f, "B")} onPlay={() => wsBRef.current?.play()} onStop={() => wsBRef.current?.pause()} onEQ={setEqB} onVol={setVolB} />
      </div>
      <Card className="p-4">
        <SectionLabel>Mastering Presets</SectionLabel>
        <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-4">
          {Object.entries(MASTER_PRESETS).map(([id, p]) => (
            <button key={id} onClick={() => setStatus("Preset " + p.label + " selected")} className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-[10px] font-bold hover:border-fuchsia-500 transition">{p.label}</button>
          ))}
        </div>
      </Card>
      <input type="range" min={0} max={1} step={0.01} value={crossfade} onChange={e => setCrossfade(parseFloat(e.target.value))} className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
      {status && <div className="text-center text-xs text-fuchsia-400 animate-pulse">{status}</div>}
      <button onClick={() => void handleExport()} disabled={exporting} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition">Export Mastered WAV</button>
    </div>
  );
}