"use client";
import { useState } from "react";
import { engine } from "@/lib/studio/audio";

export function MasterPanel() {
  const [deckA, setDeckA] = useState(false);
  const [deckB, setDeckB] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [mastering, setMastering] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, deck: string) => {
    const file = e.target.files?.[0];
    if (!file || !engine) return;
    setLoading(deck);
    const ab = await file.arrayBuffer();
    await engine.loadTrack(deck, ab);
    if (deck === "A") setDeckA(true);
    if (deck === "B") setDeckB(true);
    setLoading(null);
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 text-white space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Pro Mixing & Mastering</h2>
        <button 
          onClick={() => setMastering(!mastering)}
          className={`px-3 py-1 rounded-full text-[10px] font-bold ${mastering ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400"}`}
        >
          AI MASTERING: {mastering ? "ON" : "OFF"}
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black rounded-2xl space-y-2 border border-zinc-800">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Deck A</p>
          <input type="file" accept="audio/*" onChange={(e) => handleUpload(e, "A")} className="text-[10px] w-full text-zinc-500" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => engine?.play("A")} disabled={!deckA} className="flex-1 bg-blue-600 disabled:opacity-20 py-2 rounded-xl text-xs font-bold shadow-lg">PLAY</button>
            <button onClick={() => engine?.stop("A")} disabled={!deckA} className="bg-zinc-800 disabled:opacity-20 px-3 py-2 rounded-xl text-xs">✕</button>
          </div>
        </div>
        
        <div className="p-4 bg-black rounded-2xl space-y-2 border border-zinc-800">
          <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Deck B</p>
          <input type="file" accept="audio/*" onChange={(e) => handleUpload(e, "B")} className="text-[10px] w-full text-zinc-500" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => engine?.play("B")} disabled={!deckB} className="flex-1 bg-purple-600 disabled:opacity-20 py-2 rounded-xl text-xs font-bold shadow-lg">PLAY</button>
            <button onClick={() => engine?.stop("B")} disabled={!deckB} className="bg-zinc-800 disabled:opacity-20 px-3 py-2 rounded-xl text-xs">✕</button>
          </div>
        </div>
      </div>

      {(deckA || deckB) && (
        <button className="w-full bg-white text-black py-3 rounded-2xl font-black text-sm tracking-tighter hover:bg-zinc-200 transition">
          EXPORT FINAL MASTER (.WAV)
        </button>
      )}
    </div>
  );
}