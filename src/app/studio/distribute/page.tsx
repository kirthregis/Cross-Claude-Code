"use client";
import { useState, useCallback } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { useProjects, upsertProject } from "@/lib/studio/store";
import { newId } from "@/lib/studio/id";
import type { SmartLinks } from "@/lib/studio/types";

interface Site { name: string; url: string; what: string; free: string; tag: "stores" | "mixes" | "labels" | "social"; }
const SITES: Site[] = [
  { name: "RouteNote", url: "https://routenote.com", what: "Free distribution to Spotify, Apple Music, TikTok, YouTube Music + 20 more. Keep 85% free, 100% paid.", free: "Free", tag: "stores" },
  { name: "FreshTunes", url: "https://freshtunes.com", what: "Near-100% royalties, releases live within ~48 hours.", free: "Free", tag: "stores" },
  { name: "ONErpm", url: "https://onerpm.com", what: "Free distribution with royalty commission + strong marketing support.", free: "Free", tag: "stores" },
  { name: "UnitedMasters", url: "https://unitedmasters.com", what: "Free DEBUT tier: 90% royalties to 50+ stores + brand-partnership deals.", free: "Free tier", tag: "stores" },
  { name: "SoundOn (TikTok)", url: "https://soundon.global", what: "ByteDance distributor — deep TikTok integration, 100% royalties year one.", free: "Free", tag: "stores" },
  { name: "SoundCloud", url: "https://soundcloud.com", what: "Biggest DJ community — upload mixes & tracks. Free tier 3h uploads.", free: "Free tier", tag: "mixes" },
  { name: "Mixcloud", url: "https://mixcloud.com", what: "Built for DJ sets — licensed for mixes, no copyright takedowns.", free: "Free tier", tag: "mixes" },
  { name: "HearThis.at", url: "https://hearthis.at", what: "100 free uploads, free live streaming, DJ-friendly community.", free: "Free", tag: "mixes" },
  { name: "1001Tracklists", url: "https://1001tracklists.com", what: "The DJ mix database — post your tracklist + mix.", free: "Free", tag: "mixes" },
  { name: "LabelRadar", url: "https://labelradar.com", what: "Submit tracks to real labels (Afro House, Tech, House) with feedback.", free: "Free", tag: "labels" },
  { name: "YouTube", url: "https://studio.youtube.com", what: "Main home — upload with the handoff pack from the Release tab.", free: "Free", tag: "social" },
  { name: "Instagram", url: "https://instagram.com", what: "Reels with artwork + mastered audio, link to the full mix.", free: "Free", tag: "social" },
];
const TAG_LABELS: Record<Site["tag"], string> = {
  stores: "Get on Spotify & Apple Music (free)",
  mixes: "Host your DJ mixes (free)",
  labels: "Submit to record labels (free)",
  social: "Post & promote (free)",
};
const TAG_ORDER: Site["tag"][] = ["stores", "mixes", "labels", "social"];

const PLATFORM_ICONS: Record<string, string> = {
  spotify: "🟢", appleMusic: "🍎", youtube: "🔴", soundcloud: "🟠", tidal: "⚫", bandcamp: "🔵",
};

type Tab = "distribution" | "splits" | "smartlinks";

export default function DistributePage() {
  const [tab, setTab] = useState<Tab>("distribution");
  const projects = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const selectedProject = projects.find(p => p.meta.id === selectedProjectId);

  const [newCollab, setNewCollab] = useState({ name: "", role: "", splitPct: 0, email: "", wallet: "" });
  const [smartLinksForm, setSmartLinksForm] = useState<SmartLinks>({ spotify: "", appleMusic: "", youtube: "", soundcloud: "", tidal: "", bandcamp: "" });
  const [savedFlash, setSavedFlash] = useState(false);

  const flash = () => { setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500); };

  const addCollaborator = useCallback(() => {
    if (!selectedProject || !newCollab.name.trim()) return;
    const collabs = selectedProject.collaborators ?? [];
    const totalExisting = collabs.reduce((s, c) => s + c.splitPct, 0);
    if (totalExisting + newCollab.splitPct > 100) { alert("Total splits cannot exceed 100%"); return; }
    const updated = { ...selectedProject, collaborators: [...collabs, { ...newCollab, id: newId() }] };
    upsertProject(updated);
    setNewCollab({ name: "", role: "", splitPct: 0, email: "", wallet: "" });
    flash();
  }, [selectedProject, newCollab]);

  const removeCollaborator = useCallback((id: string) => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, collaborators: (selectedProject.collaborators ?? []).filter(c => c.id !== id) };
    upsertProject(updated);
    flash();
  }, [selectedProject]);

  const saveSmartLinks = useCallback(() => {
    if (!selectedProject) return;
    const updated = { ...selectedProject, smartLinks: smartLinksForm };
    upsertProject(updated);
    flash();
  }, [selectedProject, smartLinksForm]);

  const exportSplitSheet = useCallback(() => {
    if (!selectedProject) return;
    const collabs = selectedProject.collaborators ?? [];
    const lines = [
      `ROYALTY SPLIT SHEET — ${selectedProject.meta.name}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `COLLABORATORS:`,
      ...collabs.map(c => `${c.name} (${c.role}) — ${c.splitPct}% — ${c.email}`),
      ``,
      `TOTAL: ${collabs.reduce((s, c) => s + c.splitPct, 0)}%`,
      ``,
      `Signatures:`,
      ...collabs.map(c => `${c.name}: ___________________  Date: ____________`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedProject.meta.name.replace(/\s+/g, "_")}_split_sheet.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [selectedProject]);

  const publicUrl = selectedProject
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/studio/p/${selectedProject.meta.id}`
    : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">Distribute</h1>
          <p className="mt-1 text-sm text-zinc-400">Get your music out, manage splits, and create smart links.</p>
        </div>
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">✓ Saved</span>}
      </div>

      <div className="flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {(["distribution", "splits", "smartlinks"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition capitalize ${tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}>
            {t === "distribution" ? "🌍 Distribution" : t === "splits" ? "✂ Royalty Splits" : "🔗 Smart Links"}
          </button>
        ))}
      </div>

      {tab === "distribution" && (
        <div className="space-y-4">
          {TAG_ORDER.map(tag => (
            <div key={tag}>
              <SectionLabel>{TAG_LABELS[tag]}</SectionLabel>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                {SITES.filter(s => s.tag === tag).map(s => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                    className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition brand-hover-border hover:bg-zinc-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-zinc-100 group-hover:text-fuchsia-300">{s.name}</span>
                      <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{s.free}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{s.what}</p>
                    <div className="brand-text mt-2 text-[11px] font-semibold opacity-0 transition group-hover:opacity-100">Open site →</div>
                  </a>
                ))}
              </div>
            </div>
          ))}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Release ritual that works</SectionLabel>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-zinc-400">
              <li>Finish in the studio → export 24-bit WAV + 3000×3000 cover from the Release tab.</li>
              <li>Push to <strong className="text-zinc-200">YouTube</strong> and <strong className="text-zinc-200">Mixcloud / SoundCloud</strong>, post tracklist on <strong className="text-zinc-200">1001Tracklists</strong>.</li>
              <li>Send to stores free via <strong className="text-zinc-200">RouteNote</strong> or <strong className="text-zinc-200">FreshTunes</strong>, submit to labels on <strong className="text-zinc-200">LabelRadar</strong>.</li>
              <li>Cut a Reel with cover + mastered audio for Instagram and TikTok.</li>
            </ol>
          </Card>
        </div>
      )}

      {tab === "splits" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionLabel>Select Release</SectionLabel>
            <select value={selectedProjectId} onChange={e => { setSelectedProjectId(e.target.value); }}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="">— Choose a project —</option>
              {projects.map(p => <option key={p.meta.id} value={p.meta.id}>{p.meta.name}</option>)}
            </select>
          </Card>

          {selectedProject && (
            <>
              <Card className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <SectionLabel>Collaborators & Splits</SectionLabel>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const total = (selectedProject.collaborators ?? []).reduce((s, c) => s + c.splitPct, 0);
                      return (
                        <span className={`text-xs font-bold ${total > 100 ? "text-red-400" : total === 100 ? "text-emerald-400" : "text-amber-400"}`}>
                          {total}% assigned
                        </span>
                      );
                    })()}
                    <Button variant="ghost" onClick={exportSplitSheet} disabled={!(selectedProject.collaborators?.length)}>
                      ↓ Export Split Sheet
                    </Button>
                  </div>
                </div>

                {(selectedProject.collaborators ?? []).length === 0 && (
                  <p className="mt-3 text-xs text-zinc-600">No collaborators yet. Add contributors below.</p>
                )}

                <div className="mt-3 space-y-2">
                  {(selectedProject.collaborators ?? []).map(c => (
                    <div key={c.id} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-200">{c.name}</p>
                        <p className="text-[11px] text-zinc-500">{c.role} {c.email && `· ${c.email}`}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-fuchsia-400">{c.splitPct}%</span>
                        <button onClick={() => removeCollaborator(c.id)} className="text-zinc-600 hover:text-red-400 text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">Add Collaborator</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input placeholder="Name" value={newCollab.name} onChange={e => setNewCollab(p => ({ ...p, name: e.target.value }))}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                    <input placeholder="Role (e.g. Producer, Vocalist)" value={newCollab.role} onChange={e => setNewCollab(p => ({ ...p, role: e.target.value }))}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                    <input placeholder="Email" value={newCollab.email} onChange={e => setNewCollab(p => ({ ...p, email: e.target.value }))}
                      className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                    <div className="flex items-center gap-2">
                      <input type="number" min={0} max={100} placeholder="Split %" value={newCollab.splitPct || ""}
                        onChange={e => setNewCollab(p => ({ ...p, splitPct: parseFloat(e.target.value) || 0 }))}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
                      <span className="text-zinc-500 text-sm shrink-0">%</span>
                    </div>
                  </div>
                  <Button className="mt-3" onClick={addCollaborator} disabled={!newCollab.name.trim() || newCollab.splitPct <= 0}>
                    + Add Collaborator
                  </Button>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {tab === "smartlinks" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionLabel>Select Release</SectionLabel>
            <select value={selectedProjectId} onChange={e => {
              setSelectedProjectId(e.target.value);
              const p = projects.find(x => x.meta.id === e.target.value);
              if (p?.smartLinks) setSmartLinksForm(p.smartLinks);
              else setSmartLinksForm({ spotify: "", appleMusic: "", youtube: "", soundcloud: "", tidal: "", bandcamp: "" });
            }}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              <option value="">— Choose a project —</option>
              {projects.map(p => <option key={p.meta.id} value={p.meta.id}>{p.meta.name}</option>)}
            </select>
          </Card>

          {selectedProject && (
            <>
              <Card className="p-4 sm:p-5">
                <SectionLabel>Platform Links</SectionLabel>
                <p className="mt-1 text-xs text-zinc-500">Paste your links after you distribute. These power your public artist page.</p>
                <div className="mt-3 space-y-2">
                  {(Object.keys(smartLinksForm) as (keyof SmartLinks)[]).map(key => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-6 text-center text-base">{PLATFORM_ICONS[key]}</span>
                      <input
                        placeholder={`${key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")} URL`}
                        value={smartLinksForm[key]}
                        onChange={e => setSmartLinksForm(p => ({ ...p, [key]: e.target.value }))}
                        className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <Button className="mt-4" onClick={saveSmartLinks}>Save Links</Button>
              </Card>

              {publicUrl && (
                <Card className="p-4 sm:p-5">
                  <SectionLabel>Your Public Artist Page</SectionLabel>
                  <p className="mt-1 text-xs text-zinc-500">Share this one link — fans see your artwork, bio, and all platform links in one place.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input readOnly value={publicUrl}
                      className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300" />
                    <Button variant="ghost" onClick={() => { void navigator.clipboard.writeText(publicUrl); }}>Copy</Button>
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost">Open →</Button>
                    </a>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
