"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EngineSettings } from "@/lib/engine-settings";

interface MediaItem {
  id: string;
  name: string;
  kind: "image" | "video";
  mime: string;
  size: number;
  tags: string[];
  createdAt: string;
}

export default function CustomizePage() {
  const [s, setS] = useState<EngineSettings | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const [sr, mr] = await Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/media").then((r) => r.json()),
    ]);
    setS(sr.settings);
    setMedia(mr.media ?? []);
  };
  useEffect(() => { load(); }, []);

  if (!s) return <main className="p-6 text-sm text-zinc-500">Loading…</main>;

  const set = (patch: Partial<EngineSettings>) => setS({ ...s, ...patch });
  const setHunting = (patch: Partial<EngineSettings["hunting"]>) => set({ hunting: { ...s.hunting, ...patch } });
  const setAlerts = (patch: Partial<EngineSettings["alerts"]>) => set({ alerts: { ...s.alerts, ...patch } });
  const setBrand = (patch: Partial<EngineSettings["branding"]>) => set({ branding: { ...s.branding, ...patch } });

  async function save() {
    await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setUploadMsg("");
    const ok: string[] = []; const bad: string[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/media", { method: "POST", body: fd });
      if (r.ok) { ok.push(f.name); const j = await r.json(); setMedia((m) => [j.media, ...m]); }
      else bad.push(f.name);
    }
    setUploadMsg((ok.length ? `Uploaded: ${ok.join(", ")}` : "") + (bad.length ? ` · Skipped: ${bad.join(", ")}` : ""));
    setUploading(false);
  }

  const img = s.branding.backdropMediaId;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <Link href="/" className="text-xs text-red-500">← Dashboard</Link>
      <h1 className="mb-1 mt-3 text-xl font-bold">Studio — control everything</h1>
      <p className="mb-5 text-xs text-zinc-500">
        Change what it hunts, how loud it pings, and how it presents her. Everything saves to
        your own data and takes effect immediately — no code, no redeploy.
      </p>

      <Section title="Hunting — what it scans for">
        <Toggle
          label="Web scan" hint="Scours the open web for UAE entertainment & booking opportunities, 24/7 on the sweep."
          checked={s.hunting.webScanOn} onChange={(v) => setHunting({ webScanOn: v })} />
        <TextArea
          label="Search phrases (one per line)" hint="Leave blank to use the built-in UAE defaults."
          value={s.hunting.queries.join("\n")}
          onChange={(v) => setHunting({ queries: v.split("\n").map((x) => x.trim()).filter(Boolean) })} />
        <TextArea
          label="Extra feeds (RSS/JSON URLs, one per line)" hint="Venue blogs, gig boards, job sites you want scanned too."
          value={s.hunting.extraFeeds.join("\n")}
          onChange={(v) => setHunting({ extraFeeds: v.split("\n").map((x) => x.trim()).filter(Boolean) })} />
        <TextArea
          label="Never bother me with (blocklist)" hint="Words that auto-suppress a lead — e.g. 'karaoke', 'Doha', 'male-only'."
          value={s.hunting.blocklist.join("\n")}
          onChange={(v) => setHunting({ blocklist: v.split("\n").map((x) => x.trim()).filter(Boolean) })} />
      </Section>

      <Section title="Alerts — when & how loud">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Don't disturb from (Dubai hour)" value={s.alerts.quietStartHour}
            onChange={(v) => setAlerts({ quietStartHour: v })} min={0} max={23} />
          <NumberField label="…until (Dubai hour)" value={s.alerts.quietEndHour}
            onChange={(v) => setAlerts({ quietEndHour: v })} min={0} max={23} />
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-500">
          Between these hours only <b>urgent</b> gigs break through. Everything else queues into the morning briefing.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <NumberField label="Urgent if score ≥" value={s.alerts.urgentFrom} onChange={(v) => setAlerts({ urgentFrom: v })} min={0} max={100} />
          <NumberField label="High if score ≥" value={s.alerts.highFrom} onChange={(v) => setAlerts({ highFrom: v })} min={0} max={100} />
          <NumberField label="Normal if score ≥" value={s.alerts.normalFrom} onChange={(v) => setAlerts({ normalFrom: v })} min={0} max={100} />
          <NumberField label="Digest if score ≥" value={s.alerts.digestFrom} onChange={(v) => setAlerts({ digestFrom: v })} min={0} max={100} />
        </div>
      </Section>

      <Section title="Branding — how it looks & signs">
        <TextArea
          label="Pitch sign-off line" hint="What appears under every pitch. Blank = 'Name · Emy Vision Group'."
          value={s.branding.pitchSignoff}
          onChange={(v) => setBrand({ pitchSignoff: v })} />
        <label className="block">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Accent colour</span>
          <div className="mt-1 flex items-center gap-2">
            <input type="color" value={s.branding.accentColor}
              onChange={(e) => setBrand({ accentColor: e.target.value })} className="h-9 w-14 rounded bg-zinc-950" />
            <input value={s.branding.accentColor}
              onChange={(e) => setBrand({ accentColor: e.target.value })} className="w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600" />
          </div>
        </label>
        <div className="mt-3">
          <span className="text-[10px] uppercase tracking-wide text-zinc-500">Dashboard backdrop (pick an upload)</span>
          {media.length === 0 && <p className="mt-1 text-[11px] text-zinc-600">Upload a photo below to use as artwork.</p>}
          {media.length > 0 && (
            <div className="mt-2 grid grid-cols-4 gap-2">
              {media.map((m) => (
                <button key={m.id} onClick={() => setBrand({ backdropMediaId: m.id })}
                  className={`relative aspect-square overflow-hidden rounded-lg border-2 ${img === m.id ? "border-red-500" : "border-zinc-800"}`}>
                  {m.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/media/${m.id}/file`} alt={m.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-[10px] text-zinc-500">▶ video</div>
                  )}
                  {img === m.id && <span className="absolute bottom-0 inset-x-0 bg-red-600 text-center text-[9px] font-bold">BACKDROP</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Media library — her photos & videos">
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Upload pics and clips (up to 40 MB each). They&apos;re stored in your own data folder and
          can be used as backdrops or artwork anywhere in the app. Images: JPG/PNG/WebP. Videos: MP4/WebM.
        </p>
        <input type="file" multiple accept="image/*,video/mp4,video/webm,image/webp,image/png,image/jpeg"
          onChange={(e) => onUpload(e.target.files)}
          className="w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:text-zinc-200" />
        {uploading && <p className="mt-2 text-[11px] text-zinc-400">Uploading…</p>}
        {uploadMsg && <p className="mt-2 text-[11px] text-emerald-400">{uploadMsg}</p>}
        {media.length > 0 && (
          <ul className="mt-3 space-y-2">
            {media.map((m) => (
              <li key={m.id} className="flex items-center gap-3 rounded-lg bg-zinc-950 p-2">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/media/${m.id}/file`} alt={m.name} className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-900 text-lg">▶</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-zinc-200">{m.name}</p>
                  <p className="text-[10px] text-zinc-500">{(m.size / 1024 / 1024).toFixed(1)} MB · {m.tags.join(", ") || "no tags"}</p>
                </div>
                <button onClick={() => setBrand({ backdropMediaId: m.id })}
                  className={`rounded px-2 py-1 text-[10px] ${img === m.id ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"}`}>
                  {img === m.id ? "Backdrop ✓" : "Set as backdrop"}
                </button>
                <button onClick={async () => {
                  await fetch(`/api/media/${m.id}`, { method: "DELETE" });
                  setMedia((mm) => mm.filter((x) => x.id !== m.id));
                }} className="rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">Delete</button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-[#0a0a0f]/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={save} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold">Save settings</button>
          {saved && <span className="text-xs text-emerald-400">Saved ✓ — the radar uses this now</span>}
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-3">
      <span>
        <span className="block text-sm text-zinc-200">{label}</span>
        <span className="block text-[11px] text-zinc-500">{hint}</span>
      </span>
      <span onClick={() => onChange(!checked)}
        className={`mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-red-600" : "bg-zinc-700"}`}>
        <span className={`h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
      </span>
    </label>
  );
}

function TextArea({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
        className="mt-0.5 w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600" />
      <span className="text-[10px] text-zinc-600">{hint}</span>
    </label>
  );
}

function NumberField({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-0.5 w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600" />
    </label>
  );
}
