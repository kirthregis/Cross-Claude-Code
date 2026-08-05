"use client";
import { useState } from "react";
import { engine } from "@/lib/studio/audio";
import type { Project } from "@/lib/studio/types";

interface Props {
  project: Project;
  onChanged: () => void;
}

export function MasterPanel({ project, onChanged }: Props) {
  const [deckA, setDeckA] = useState(false);
  const [deckB, setDeckB] = useState(false);
  const [loadingDeck, setLoadingDeck] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, deck: string) => {
    const file = e.target.files?.[0];
    if (!file || !engine) return;
    setLoadingDeck(deck);
    const ab = await file.arrayBuffer();
    await engine.loadTrack(deck, ab);
    if (deck === "A") setDeckA(true);
    if (deck === "B") setDeckB(true);
    setLoadingDeck(null);
    onChanged();
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 text-white space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Pro Mixing & Mastering</h2>
        <span className="text-xs text-zinc-500">{project.meta.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black rounded-2xl space-y-2 border border-zinc-800">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Deck A</p>
          <input type="file" accept="audio/*" onChange={(e) => handleUpload(e, "A")} className="text-[10px] w-full text-zinc-500" />
          {loadingDeck === "A" && <p className="text-yellow-400 text-xs animate-pulse">Loading...</p>}
          {deckA && <p className="text-green-400 text-xs">✓ Ready</p>}
          <div className="flex gap-2 mt-2">
            <button onClick={() => engine?.play("A")} disabled={!deckA} className="flex-1 bg-blue-600 disabled:opacity-20 py-2 rounded-xl text-xs font-bold">PLAY</button>
            <button onClick={() => engine?.stop("A")} disabled={!deckA} className="bg-zinc-800 disabled:opacity-20 px-3 py-2 rounded-xl text-xs">STOP</button>
          </div>
        </div>
        <div className="p-4 bg-black rounded-2xl space-y-2 border border-zinc-800">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Deck B</p>
          <input type="file" accept="audio/*" onChange={(e) => handleUpload(e, "B")} className="text-[10px] w-full text-zinc-500" />
          {loadingDeck === "B" && <p className="text-yellow-400 text-xs animate-pulse">Loading...</p>}
          {deckB && <p className="text-green-400 text-xs">✓ Ready</p>}
          <div className="flex gap-2 mt-2">
            <button onClick={() => engine?.play("B")} disabled={!deckB} className="flex-1 bg-purple-600 disabled:opacity-20 py-2 rounded-xl text-xs font-bold">PLAY</button>
            <button onClick={() => engine?.stop("B")} disabled={!deckB} className="bg-zinc-800 disabled:opacity-20 px-3 py-2 rounded-xl text-xs">STOP</button>
          </div>
        </div>
      </div>
      {(deckA || deckB) && (
        <button className="w-full bg-white text-black py-3 rounded-2xl font-black text-sm hover:bg-zinc-200 transition">
          EXPORT FINAL MASTER (.WAV)
        </button>
      )}
    </div>
  );
}

export default MasterPanel;