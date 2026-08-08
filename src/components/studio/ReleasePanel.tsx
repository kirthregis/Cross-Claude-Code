"use client";

import { useCallback, useState } from "react";
import type { Project, ReleaseMeta } from "@/lib/studio/types";
import { buildRelease, buildTitle, youtubeHandoff } from "@/lib/studio/release";
import { notify, speak } from "@/lib/studio/speech";
import { loadSettings, upsertProject } from "@/lib/studio/store";
import { Button, Card, SectionLabel } from "./ui";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "./ArabicToggle";

export function ReleasePanel({ project, onChanged }: { project: Project; onChanged: () => void }) {
  const { arabic } = useArabic();
  const settings = loadSettings();
  const [meta, setMeta] = useState<ReleaseMeta | null>(project.release ?? null);
  const [copied, setCopied] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const persist = useCallback(
    (m: ReleaseMeta) => {
      setMeta(m);
      setDirty(false);
      upsertProject({ ...project, release: m, meta: { ...project.meta, releaseDone: true, stage: project.meta.stage === "art" || project.meta.stage === "master" || project.meta.stage === "draft" ? "release" : project.meta.stage } });
      onChanged();
    },
    [project, onChanged],
  );

  const generate = useCallback(() => {
    const m = buildRelease(project, settings);
    persist(m);
    notify("Release pack ready", `Title, description and tags for "${project.meta.name}" are written.`);
    speak(`Your release pack is ready — title, description and tags are done.`, settings.soundOn, "en-US", settings.voiceGender);
  }, [project, settings, persist]);

  const copy = useCallback(
    async (label: string, text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(null), 1500);
      } catch {
        /* clipboard may be blocked */
      }
    },
    [],
  );

  const saveDraft = useCallback(() => {
    if (!meta) return;
    persist({ ...meta });
    speak(`Release pack saved.`, settings.soundOn, "en-US", settings.voiceGender);
  }, [meta, persist, settings.soundOn]);

  const downloadTxt = useCallback(() => {
    if (!meta) return;
    const txt = [
      `${meta.title}`,
      `=================`,
      `DESCRIPTION`,
      `=================`,
      meta.description,
      ``,
      `TAGS`,
      `=================`,
      meta.tags.join(" "),
      ``,
      `SETTINGS`,
      `=================`,
      `Category: ${meta.category}`,
      `Made for kids: ${meta.madeForKids}`,
      `Visibility: ${meta.visibility}`,
      ``,
      `FILE`,
      `=================`,
      `Master WAV (48 kHz): ${meta.fileName}`,
      `Cover: ${project.meta.name.replace(/\s+/g, "_")}_cover_3000x3000.jpg`,
    ].join("\n");
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.meta.name.replace(/\s+/g, "_")}_release_notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meta, project.meta.name]);

  if (!meta) {
    return (
      <Card className="flex min-h-[240px] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="text-4xl">📦</div>
        <div>
          <div className="text-sm font-semibold">Release pack not generated yet</div>
          <div className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-zinc-500">
            One tap writes the YouTube title, description, hashtags, tags and file names — matching how your channel already publishes, with the exact platform limits baked in.
          </div>
        </div>
        <Button onClick={generate}>✨ Generate release pack</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Title · YouTube max 100 chars</SectionLabel>
          <button onClick={() => setMeta({ ...meta, title: buildTitle(project, settings.artistName) })} className="text-[11px] text-zinc-500 hover:text-fuchsia-300">
            regenerate
          </button>
        </div>
        <input
          value={meta.title}
          onChange={(e) => {
            const updated = { ...meta, title: e.target.value };
            setMeta(updated);
            setDirty(false);
            persist(updated);
          }}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm font-semibold text-zinc-100 focus:border-fuchsia-500 focus:outline-none"
        />
        <div className={`mt-1 text-right font-mono text-[11px] ${meta.title.length > 100 ? "text-red-400" : "text-zinc-600"}`}>{meta.title.length}/100</div>

        <div className="mt-4 flex items-center justify-between">
          <SectionLabel>Description · YouTube max 5000 chars</SectionLabel>
          <span className={`font-mono text-[11px] ${meta.description.length > 5000 ? "text-red-400" : "text-zinc-600"}`}>{meta.description.length}/5000</span>
        </div>
        <textarea
          value={meta.description}
          onChange={(e) => {
            const updated = { ...meta, description: e.target.value };
            setMeta(updated);
            setDirty(false);
            persist(updated);
          }}
          rows={10}
          className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-[13px] leading-relaxed text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
        />

        <div className="mt-4">
          <SectionLabel>Tags</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.tags.map((t, i) => (
              <span key={t} className="flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[12px] text-zinc-300">
                {t}
                <button onClick={() => setMeta({ ...meta, tags: meta.tags.filter((_, j) => j !== i) })} className="text-zinc-600 hover:text-red-400">
                  ×
                </button>
              </span>
            ))}
            <input
              placeholder="+ add tag"
              className="w-24 rounded-full border border-dashed border-zinc-700 bg-transparent px-2.5 py-1 text-[12px] text-zinc-300 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const v = e.currentTarget.value.trim();
                  e.preventDefault();
                  setMeta({ ...meta, tags: [...meta.tags, v.startsWith("#") ? v : `#${v}`].slice(0, 20) });
                  e.currentTarget.value = "";
                }
              }}
            />
          </div>
          <div className="mt-1 font-mono text-[11px] text-zinc-600">{meta.tags.join(" ").length}/500 chars</div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Category</span>
            <select value={meta.category} onChange={(e) => { const u = { ...meta, category: e.target.value as ReleaseMeta["category"] }; setMeta(u); persist(u); }} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
              <option>Music</option>
              <option>Entertainment</option>
              <option>People & Blogs</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Made for kids</span>
            <select value={meta.madeForKids} onChange={(e) => { const u = { ...meta, madeForKids: e.target.value as ReleaseMeta["madeForKids"] }; setMeta(u); persist(u); }} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Visibility</span>
            <select value={meta.visibility} onChange={(e) => { const u = { ...meta, visibility: e.target.value as ReleaseMeta["visibility"] }; setMeta(u); persist(u); }} className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200">
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {dirty && (
            <Button onClick={saveDraft} variant="primary">
              💾 Save pack
            </Button>
          )}
          <Button variant="ghost" onClick={() => void copy("title", meta.title)}>
            {copied === "title" ? "✓ Copied" : "Copy title"}
          </Button>
          <Button variant="ghost" onClick={() => void copy("desc", meta.description)}>
            {copied === "desc" ? "✓ Copied" : "Copy description"}
          </Button>
          <Button variant="ghost" onClick={() => void copy("all", youtubeHandoff(meta))}>
            {copied === "all" ? "✓ Copied" : "Copy all for upload"}
          </Button>
          <Button variant="ghost" onClick={downloadTxt}>⬇ Release notes (.txt)</Button>
          <a
            href="https://studio.youtube.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            ▶ Open YouTube Studio
          </a>
        </div>
        <div className="mt-5 border-t border-zinc-800/70 pt-4">
          <SectionLabel>Share it — one tap opens the platform</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { name: "YouTube", url: "https://studio.youtube.com", icon: "▶️", note: "Upload with the pack above" },
              { name: "Instagram", url: "https://instagram.com", icon: "📸", note: "Reels: cover + mastered audio" },
              { name: "TikTok", url: "https://tiktok.com", icon: "🎵", note: "Promo clip + link to the mix" },
              { name: "Snapchat", url: "https://snapchat.com", icon: "👻", note: "Quick story tease" },
              { name: "Threads", url: "https://threads.net", icon: "🧵", note: "Announce + link" },
            ].map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                title={s.note}
                className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-fuchsia-500/60 hover:text-fuchsia-300"
              >
                <span>{s.icon}</span> {s.name}
              </a>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Handoff flow: export the master WAV (Master tab) → download the cover (Artwork tab) → open YouTube Studio → paste title + description + tags → upload the WAV and cover. Everything is already in the right format, so upload just works.
          </p>
        </div>
      </Card>
    </div>
  );
}
