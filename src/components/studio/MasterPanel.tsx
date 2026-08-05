"use client";
import { useState } from "react";
import { engine } from "@/lib/studio/audio";

export default function MasterPanel() {
  const [loading, setLoading] = useState(false);
  
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, deck: string) => {
    const file = e.target.files?.[0];
    if (!file || !engine) return;
    setLoading(true);
    const ab = await file.arrayBuffer();
    await engine.loadTrack(deck, ab);
    setLoading(false);
    alert(`Deck ${deck} Ready`);
  };

  return (
    <div className="p-6 bg-zinc-900 rounded-3xl border border-zinc-800 text-white">
      <h2 className="text-xl font-bold mb-4">Pro Mixing Deck</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black rounded-xl">
          <p className="text-xs mb-2">DECK A</p>
          <input type="file" onChange={(e) => handleUpload(e, "A")} className="text-xs w-full" />
          <button onClick={() => engine?.play("A")} className="mt-2 bg-blue-600 px-4 py-1 rounded">PLAY A</button>
        </div>
        <div className="p-4 bg-black rounded-xl">
          <p className="text-xs mb-2">DECK B</p>
          <input type="file" onChange={(e) => handleUpload(e, "B")} className="text-xs w-full" />
          <button onClick={() => engine?.play("B")} className="mt-2 bg-purple-600 px-4 py-1 rounded">PLAY B</button>
        </div>
      </div>
      {loading && <p className="text-yellow-400 mt-4 animate-pulse">Processing High-Quality Audio...</p>}
    </div>
  );
}