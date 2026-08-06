"use client";
import { useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import BusinessSuite from "@/components/studio/BusinessSuite";
import {
  getSetlists, upsertSetlist, deleteSetlist,
  type Setlist, type SetlistTrack,
} from "@/lib/db";
import { getGigs } from "@/lib/db";
import { generateDealPack, type DealTerms } from "@/lib/contract";
import type { Gig } from "@/lib/types";

// ── Constants ──────────────────────────────────────────────────────────────

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

const STAGE_ELEMENTS = [
  { id: "mixer", label: "🎛 Mixer", color: "#7c3aed" },
  { id: "cdj1", label: "💿 CDJ Left", color: "#2563eb" },
  { id: "cdj2", label: "💿 CDJ Right", color: "#2563eb" },
  { id: "monitor", label: "🔊 Monitor", color: "#059669" },
  { id: "laptop", label: "💻 Laptop", color: "#d97706" },
  { id: "mic", label: "🎤 Mic", color: "#dc2626" },
  { id: "sub", label: "🔉 Sub", color: "#374151" },
  { id: "light", label: "💡 Light Rig", color: "#92400e" },
];

type Tab = "rider" | "stage" | "setlist" | "contract" | "revenue";

interface StageItem { id: string; label: string; color: string; x: number; y: number; }

// ── Main Component ─────────────────────────────────────────────────────────

export default function PlannerPage() {
  const [tab, setTab] = useState<Tab>("rider");

  // Rider state
  const [equipment, setEquipment] = useState<string[]>(DEFAULT_EQUIPMENT);
  const [hospitality, setHospitality] = useState<string[]>(DEFAULT_HOSPITALITY);
  const [monitoring, setMonitoring] = useState("Booth monitor plus house PA, independent booth level control");
  const [soundcheck, setSoundcheck] = useState("Minimum 45 minutes before doors");

  // Stage state
  const [stageItems, setStageItems] = useState<StageItem[]>([
    { id: "mixer", label: "🎛 Mixer", color: "#7c3aed", x: 200, y: 140 },
    { id: "cdj1", label: "💿 CDJ L", color: "#2563eb", x: 100, y: 140 },
    { id: "cdj2", label: "💿 CDJ R", color: "#2563eb", x: 300, y: 140 },
    { id: "monitor", label: "🔊 Mon", color: "#059669", x: 180, y: 220 },
  ]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Setlist state
  const [setlists, setSetlists] = useState<Setlist[]>(() => getSetlists());
  const [activeSetlistId, setActiveSetlistId] = useState<string | null>(null);
  const [newSetlistName, setNewSetlistName] = useState("");
  const [newSetlistVenue, setNewSetlistVenue] = useState("");
  const [newSetlistDate, setNewSetlistDate] = useState("");
  const [newTrack, setNewTrack] = useState<Partial<SetlistTrack>>({ name: "", artist: "" });

  // Contract state
  const [gigs] = useState<Gig[]>(() => getGigs());
  const [selectedGigId, setSelectedGigId] = useState<string>("");
  const [terms, setTerms] = useState<Partial<DealTerms>>({});
  const [dealPack, setDealPack] = useState<ReturnType<typeof generateDealPack> | null>(null);
  const [contractCopied, setContractCopied] = useState<string | null>(null);

  const activeSetlist = setlists.find(s => s.id === activeSetlistId) ?? null;

  // ── Rider helpers ──
  const downloadRider = () => {
    const lines = [
      "TECHNICAL RIDER — DJ EMY (Emy Vision Group FZC)",
      "================================================",
      "", "EQUIPMENT REQUIRED:",
      ...equipment.map(e => "  • " + e),
      "", "MONITORING:", "  " + monitoring,
      "", "SOUNDCHECK:", "  " + soundcheck,
      "", "HOSPITALITY:",
      ...hospitality.map(h => "  • " + h),
      "", "CONTACT: admin@emyvisiongroup.com | +971 50 344 3281",
      "Trade Licence: 4427087.01 — Emy Vision Group FZC",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Tech_Rider_DJEmy.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ── Stage helpers ──
  const addElement = (el: typeof STAGE_ELEMENTS[0]) => {
    if (stageItems.find(s => s.id === el.id)) return;
    setStageItems(p => [...p, { ...el, x: 60 + Math.random() * 280, y: 40 + Math.random() * 180 }]);
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

  // ── Setlist helpers ──
  const createSetlist = () => {
    if (!newSetlistName.trim()) return;
    const s: Setlist = {
      id: "sl-" + Date.now(),
      gigName: newSetlistName.trim(),
      venueName: newSetlistVenue.trim(),
      date: newSetlistDate,
      tracks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertSetlist(s);
    setSetlists(getSetlists());
    setActiveSetlistId(s.id);
    setNewSetlistName(""); setNewSetlistVenue(""); setNewSetlistDate("");
  };

  const addTrackToSetlist = () => {
    if (!activeSetlist || !newTrack.name?.trim()) return;
    const track: SetlistTrack = {
      id: "tr-" + Date.now(),
      name: newTrack.name.trim(),
      artist: newTrack.artist?.trim() ?? "",
      bpm: newTrack.bpm,
      key: newTrack.key,
      durationSec: newTrack.durationSec,
      notes: newTrack.notes,
    };
    const updated = { ...activeSetlist, tracks: [...activeSetlist.tracks, track] };
    upsertSetlist(updated);
    setSetlists(getSetlists());
    setNewTrack({ name: "", artist: "" });
  };

  const removeTrack = (trackId: string) => {
    if (!activeSetlist) return;
    const updated = { ...activeSetlist, tracks: activeSetlist.tracks.filter(t => t.id !== trackId) };
    upsertSetlist(updated);
    setSetlists(getSetlists());
  };

  const moveTrack = (trackId: string, dir: -1 | 1) => {
    if (!activeSetlist) return;
    const idx = activeSetlist.tracks.findIndex(t => t.id === trackId);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= activeSetlist.tracks.length) return;
    const tracks = [...activeSetlist.tracks];
    [tracks[idx], tracks[newIdx]] = [tracks[newIdx], tracks[idx]];
    const updated = { ...activeSetlist, tracks };
    upsertSetlist(updated);
    setSetlists(getSetlists());
  };

  const downloadSetlist = () => {
    if (!activeSetlist) return;
    const totalSec = activeSetlist.tracks.reduce((s, t) => s + (t.durationSec ?? 0), 0);
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const lines = [
      "SETLIST — " + activeSetlist.gigName,
      "Venue: " + (activeSetlist.venueName || "TBC"),
      "Date: " + (activeSetlist.date || "TBC"),
      "Total: " + fmt(totalSec),
      "=========================================",
      ...activeSetlist.tracks.map((t, i) =>
        `${i + 1}. ${t.name}${t.artist ? " — " + t.artist : ""}${t.bpm ? " | " + t.bpm + " BPM" : ""}${t.key ? " | " + t.key : ""}${t.durationSec ? " | " + fmt(t.durationSec) : ""}${t.notes ? "\n   Notes: " + t.notes : ""}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Setlist_" + activeSetlist.gigName.replace(/\s+/g, "_") + ".txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ── Contract helpers ──
  const selectedGig = gigs.find(g => g.id === selectedGigId);

  const generatePack = () => {
    if (!selectedGig) return;
    const pack = generateDealPack(selectedGig, terms);
    setDealPack(pack);
  };

  const printContract = (content: string, title: string) => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#111;white-space:pre-wrap;line-height:1.6;}
    h1{margin-bottom:16px;}@media print{body{padding:20px;}}</style>
    </head><body>${content.replace(/\n/g, "<br/>")}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  const copyText = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setContractCopied(key);
    setTimeout(() => setContractCopied(null), 1500);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">🗓 Gig Planner</h1>
        <p className="mt-1 text-sm text-zinc-400">Tech rider · Stage plot · Setlist builder · Contract generator · Revenue & invoice.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([
          { id: "rider", label: "📋 Rider" },
          { id: "stage", label: "🎭 Stage" },
          { id: "setlist", label: "🎵 Setlist" },
          { id: "contract", label: "📄 Contract" },
          { id: "revenue", label: "💰 Invoice" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-1 whitespace-nowrap rounded-xl py-2 text-xs font-semibold transition " + (tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── RIDER TAB ── */}
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
                  <button onClick={() => setEquipment(p => p.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 px-2">✕</button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setEquipment(p => [...p, ""])}>+ Add item</Button>
            </div>
          </Card>
          <Card className="p-4 sm:p-5">
            <SectionLabel>Monitoring & Soundcheck</SectionLabel>
            <div className="mt-3 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Monitoring</span>
                <input value={monitoring} onChange={e => setMonitoring(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Soundcheck</span>
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
                  <button onClick={() => setHospitality(p => p.filter((_, j) => j !== i))} className="text-zinc-600 hover:text-red-400 px-2">✕</button>
                </div>
              ))}
              <Button variant="ghost" onClick={() => setHospitality(p => [...p, ""])}>+ Add item</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── STAGE TAB ── */}
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
            <div className="relative w-full rounded-xl bg-zinc-950 border-2 border-dashed border-zinc-800 overflow-hidden select-none"
              style={{ height: 340 }}
              onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-zinc-900/60 flex items-center justify-center">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">FRONT OF STAGE — AUDIENCE</span>
              </div>
              <div className="absolute top-2 left-0 right-0 flex justify-center">
                <span className="text-[10px] text-zinc-700 uppercase tracking-widest">BACK OF STAGE</span>
              </div>
              {stageItems.map(item => (
                <div key={item.id} onMouseDown={e => onMouseDown(e, item.id)}
                  className="absolute cursor-grab active:cursor-grabbing select-none"
                  style={{ left: item.x - 36, top: item.y - 18, zIndex: dragging === item.id ? 50 : 10 }}>
                  <div className="rounded-lg px-2 py-1 text-[11px] font-bold text-white shadow-lg border border-white/10"
                    style={{ background: item.color }}>{item.label}</div>
                  <button onMouseDown={e => e.stopPropagation()} onClick={() => removeElement(item.id)}
                    className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-600 text-white text-[8px] flex items-center justify-center hover:bg-red-500">✕</button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-zinc-600 text-center">Drag elements into position. Screenshot to save.</p>
          </Card>
        </div>
      )}

      {/* ── SETLIST TAB ── */}
      {tab === "setlist" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionLabel>Setlists</SectionLabel>
            <div className="mt-3 flex flex-wrap gap-2">
              {setlists.map(s => (
                <button key={s.id} onClick={() => setActiveSetlistId(s.id)}
                  className={"rounded-xl border px-3 py-1.5 text-xs font-semibold transition " + (activeSetlistId === s.id ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-300" : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white")}>
                  {s.gigName}
                  <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); deleteSetlist(s.id); setSetlists(getSetlists()); if (activeSetlistId === s.id) setActiveSetlistId(null); }}
                    className="ml-2 text-zinc-600 hover:text-red-400">✕</button>
                </button>
              ))}
            </div>
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">New Setlist</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <input value={newSetlistName} onChange={e => setNewSetlistName(e.target.value)}
                  placeholder="Gig name — e.g. White Dubai Saturday"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                <input value={newSetlistVenue} onChange={e => setNewSetlistVenue(e.target.value)}
                  placeholder="Venue"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                <input type="date" value={newSetlistDate} onChange={e => setNewSetlistDate(e.target.value)}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              </div>
              <Button className="mt-3" onClick={createSetlist} disabled={!newSetlistName.trim()}>+ Create Setlist</Button>
            </div>
          </Card>

          {activeSetlist && (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <SectionLabel>{activeSetlist.gigName}</SectionLabel>
                  <p className="text-xs text-zinc-500 mt-0.5">{activeSetlist.venueName} · {activeSetlist.date} · {activeSetlist.tracks.length} tracks</p>
                </div>
                <Button variant="ghost" onClick={downloadSetlist}>↓ Download TXT</Button>
              </div>

              <div className="space-y-1 mb-4">
                {activeSetlist.tracks.length === 0 && (
                  <p className="text-xs text-zinc-600 py-4 text-center">No tracks yet — add below.</p>
                )}
                {activeSetlist.tracks.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2">
                    <span className="text-xs font-black text-zinc-600 w-5 shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-200 truncate">{t.name}</p>
                      <p className="text-[10px] text-zinc-500">
                        {t.artist && t.artist}
                        {t.bpm && " · " + t.bpm + " BPM"}
                        {t.key && " · " + t.key}
                        {t.durationSec && " · " + Math.floor(t.durationSec / 60) + ":" + String(Math.floor(t.durationSec % 60)).padStart(2, "0")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => moveTrack(t.id, -1)} disabled={i === 0} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 px-1">↑</button>
                      <button onClick={() => moveTrack(t.id, 1)} disabled={i === activeSetlist.tracks.length - 1} className="text-zinc-600 hover:text-zinc-300 disabled:opacity-20 px-1">↓</button>
                      <button onClick={() => removeTrack(t.id)} className="text-zinc-600 hover:text-red-400 px-1">✕</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Add Track</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input value={newTrack.name ?? ""} onChange={e => setNewTrack(p => ({ ...p, name: e.target.value }))}
                    placeholder="Track name *"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <input value={newTrack.artist ?? ""} onChange={e => setNewTrack(p => ({ ...p, artist: e.target.value }))}
                    placeholder="Artist"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <input type="number" value={newTrack.bpm ?? ""} onChange={e => setNewTrack(p => ({ ...p, bpm: parseInt(e.target.value) || undefined }))}
                    placeholder="BPM"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <input value={newTrack.key ?? ""} onChange={e => setNewTrack(p => ({ ...p, key: e.target.value }))}
                    placeholder="Key (e.g. Am, F#m)"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                  <input value={newTrack.notes ?? ""} onChange={e => setNewTrack(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Notes (optional)"
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none sm:col-span-2" />
                </div>
                <Button className="mt-3" onClick={addTrackToSetlist} disabled={!newTrack.name?.trim()}>+ Add Track</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── CONTRACT TAB ── */}
      {tab === "contract" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionLabel>Select Gig</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">Pick a gig from GigRadar to generate the contract, runsheet and invoice.</p>
            <select value={selectedGigId} onChange={e => { setSelectedGigId(e.target.value); setDealPack(null); }}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="">— Select a gig from GigRadar —</option>
              {gigs.map(g => <option key={g.id} value={g.id}>{g.title} · {new Date(g.postedAt).toLocaleDateString("en-GB")}</option>)}
            </select>
            {gigs.length === 0 && (
              <p className="mt-2 text-xs text-zinc-600">No gigs yet. Add leads in GigRadar first.</p>
            )}
          </Card>

          {selectedGig && (
            <Card className="p-4 sm:p-5">
              <SectionLabel>Deal Terms</SectionLabel>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Agreed Fee (AED)</span>
                  <input type="number" value={terms.agreedFeeAed ?? ""} onChange={e => setTerms(p => ({ ...p, agreedFeeAed: parseFloat(e.target.value) || undefined }))}
                    placeholder="e.g. 8000"
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Event Date</span>
                  <input type="date" value={terms.eventDate ?? ""} onChange={e => setTerms(p => ({ ...p, eventDate: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Set Start</span>
                  <input type="time" value={terms.setStart ?? "23:00"} onChange={e => setTerms(p => ({ ...p, setStart: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Set End</span>
                  <input type="time" value={terms.setEnd ?? "01:00"} onChange={e => setTerms(p => ({ ...p, setEnd: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Client Legal Name</span>
                  <input value={terms.clientLegalName ?? ""} onChange={e => setTerms(p => ({ ...p, clientLegalName: e.target.value }))}
                    placeholder="e.g. White Dubai LLC"
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Venue Address</span>
                  <input value={terms.venueAddress ?? ""} onChange={e => setTerms(p => ({ ...p, venueAddress: e.target.value }))}
                    placeholder="e.g. Club Vista Mare, Palm Jumeirah, Dubai"
                    className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                </label>
              </div>
              <Button className="mt-4" onClick={generatePack}>Generate Contract Pack</Button>
            </Card>
          )}

          {dealPack && (
            <div className="space-y-3">
              {([
                { key: "contract", label: "📄 Performance Agreement", content: dealPack.contract },
                { key: "runsheet", label: "📋 Run Sheet", content: dealPack.runsheet },
                { key: "invoice", label: "🧾 Invoice", content: dealPack.invoice },
                { key: "pressPack", label: "📢 Press Pack", content: dealPack.pressPack },
              ] as { key: string; label: string; content: string }[]).map(doc => (
                <Card key={doc.key} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>{doc.label}</SectionLabel>
                    <div className="flex gap-2">
                      <Button variant="ghost" onClick={() => copyText(doc.content, doc.key)}>
                        {contractCopied === doc.key ? "✓ Copied" : "Copy"}
                      </Button>
                      <Button variant="ghost" onClick={() => printContract(doc.content, doc.label)}>
                        Print / PDF
                      </Button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed bg-zinc-950 rounded-xl p-3 border border-zinc-800 max-h-48 overflow-y-auto">{doc.content}</pre>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── REVENUE TAB ── */}
      {tab === "revenue" && <BusinessSuite />}
    </div>
  );
}
