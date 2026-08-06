"use client";
import { useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import BusinessSuite from "@/components/studio/BusinessSuite";

const DEFAULT_EQUIPMENT = [
  "2x Pioneer CDJ-3000 (CDJ-2000NXS2 acceptable)",
  "1x Pioneer DJM-900NXS2 mixer",
  "Booth monitor with independent level control",
  "1x spare line-in for backup",
  "USB power outlet in booth",
];

const DEFAULT_HOSPITALITY = [
  "1x +1 guest on the door",
  "Still and sparkling water in booth",
  "Secure area for laptop bag",
  "Parking space or return transport",
];

type Tab = "rider" | "stage" | "revenue";

const STAGE_ELEMENTS = [
  { id: "mixer", label: "🎛 Mixer", color: "#7c3aed" },
  { id: "cdj1", label: "💿 CDJ Left", color: "#2563eb" },
  { id: "cdj2", label: "💿 CDJ Right", color: "#2563eb" },
  { id: "monitor", label: "🔊 Monitor", color: "#059669" },
  { id: "laptop", label: "💻 Laptop", color: "#d97706" },
  { id: "mic", label: "🎤 Mic", color: "#dc2626" },
];

interface StageItem {
  id: string;
  label: string;
  color: string;
  x: number;
  y: number;
}

export default function PlannerPage() {
  const [tab, setTab] = useState<Tab>("rider");
  const [equipment, setEquipment] = useState<string[]>(DEFAULT_EQUIPMENT);
  const [hospitality, setHospitality] = useState<string[]>(DEFAULT_HOSPITALITY);
  const [monitoring, setMonitoring] = useState("Booth monitor plus house PA, independent booth level control");
  const [soundcheck, setSoundcheck] = useState("Minimum 45 minutes before doors");
  const [stageItems, setStageItems] = useState<StageItem[]>([
    { id: "mixer", label: "🎛 Mixer", color: "#7c3aed", x: 200, y: 140 },
    { id: "cdj1", label: "💿 CDJ L", color: "#2563eb", x: 100, y: 140 },
    { id: "cdj2", label: "💿 CDJ R", color: "#2563eb", x: 300, y: 140 },
    { id: "monitor", label: "🔊 Mon", color: "#059669", x: 180, y: 220 },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const downloadRider = () => {
    const lines = [
      "TECHNICAL RIDER — DJ EMY (Emy Vision Group FZC)",
      "================================================",
      "",
      "EQUIPMENT REQUIRED:",
      ...equipment.map(e => "  • " + e),
      "",
      "MONITORING:",
      "  " + monitoring,
      "",
      "SOUNDCHECK:",
      "  " + soundcheck,
      "",
      "HOSPITALITY:",
      ...hospitality.map(h => "  • " + h),
      "",
      "CONTACT: admin@emyvisiongroup.com | +971 50 344 3281",
      "Trade Licence: 4427087.01 — Emy Vision Group FZC",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Tech_Rider_DJEmy.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const addElement = (el: typeof STAGE_ELEMENTS[0]) => {
    const exists = stageItems.find(s => s.id === el.id);
    if (exists) return;
    setStageItems(p => [...p, { ...el, x: 60 + Math.random() * 200, y: 60 + Math.random() * 120 }]);
  };

  const removeElement = (id: string) => setStageItems(p => p.filter(s => s.id !== id));

  const onMouseDown = (e: React.MouseEvent, id: string) => {
    const item = stageItems.find(s => s.id === id);
    if (!item) return;
    setDragging(id);
    setDragOffset({ x: e.clientX - item.x, y: e.clientY - item.y });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setStageItems(p => p.map(s => s.id === dragging ? { ...s, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y } : s));
  };

  const onMouseUp = () => setDragging(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">🗓 Gig Planner</h1>
        <p className="mt-1 text-sm text-zinc-400">Tech rider, stage plot, and invoice generator — all in one place.</p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([
          { id: "rider", label: "📋 Tech Rider" },
          { id: "stage", label: "🎭 Stage Plot" },
          { id: "revenue", label: "💰 Revenue & Invoice" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-1 rounded-xl py-2 text-xs font-semibold transition " + (tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "rider" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Equipment Required</SectionLabel>
              <Button onClick={downloadRider}>↓ Download Rider TXT</Button>
            </div>
            <div className="space-y-2">
              {equipment.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input value={item} onChange={e => { const n = [...equipment]; n[i] = e.target.value; setEquipment(n); }}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <button onClick={() => setEquipment(p => p.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 px-2">✕</button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setEquipment(p => [...p, ""])}>+ Add item</Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionLabel>Monitoring & Soundcheck</SectionLabel>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Monitoring requirements</span>
                <input value={monitoring} onChange={e => setMonitoring(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Soundcheck access</span>
                <input value={soundcheck} onChange={e => setSoundcheck(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              </label>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionLabel>Hospitality Rider</SectionLabel>
            <div className="mt-3 space-y-2">
              {hospitality.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input value={item} onChange={e => { const n = [...hospitality]; n[i] = e.target.value; setHospitality(n); }}
                    className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <button onClick={() => setHospitality(p => p.filter((_, j) => j !== i))}
                    className="text-zinc-600 hover:text-red-400 px-2">✕</button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setHospitality(p => [...p, ""])}>+ Add item</Button>
            </div>
          </Card>
        </div>
      )}

      {tab === "stage" && (
        <div className="space-y-4">
          <Card className="p-4">
            <SectionLabel>Stage Elements — click to add, drag to position</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {STAGE_ELEMENTS.map(el => (
                <button key={el.id} onClick={() => addElement(el)}
                  disabled={!!stageItems.find(s => s.id === el.id)}
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-30 hover:border-fuchsia-500 transition">
                  {el.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-2">
            <div
              className="relative w-full rounded-xl bg-zinc-950 border-2 border-dashed border-zinc-800 overflow-hidden select-none"
              style={{ height: 320 }}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-zinc-900/60 flex items-center justify-center">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">FRONT OF STAGE — AUDIENCE</span>
              </div>
              <div className="absolute top-2 left-0 right-0 flex justify-center">
                <span className="text-[10px] text-zinc-700 uppercase tracking-widest">BACK OF STAGE</span>
              </div>
              {stageItems.map(item => (
                <div
                  key={item.id}
                  onMouseDown={e => onMouseDown(e, item.id)}
                  className="absolute cursor-grab active:cursor-grabbing select-none"
                  style={{ left: item.x - 36, top: item.y - 18, zIndex: dragging === item.id ? 50 : 10 }}
                >
                  <div className="rounded-lg px-2 py-1 text-[11px] font-bold text-white shadow-lg border border-white/10"
                    style={{ background: item.color }}>
                    {item.label}
                  </div>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={() => removeElement(item.id)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center hover:bg-red-500">
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-600 text-center">Drag elements to build your stage plot. Screenshot to save.</p>
          </Card>
        </div>
      )}

      {tab === "revenue" && <BusinessSuite />}
    </div>
  );
}
