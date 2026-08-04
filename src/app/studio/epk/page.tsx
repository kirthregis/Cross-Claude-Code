"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import { EPK_DEFAULTS, epkFullText, loadEpk, saveEpk, type EpkData, type PressQuote } from "@/lib/studio/epk-store";

export default function EpkPage() {
  const [epk, setEpk] = useState<EpkData>(() => loadEpk());
  const [editing, setEditing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draft, setDraft] = useState<EpkData>(() => loadEpk());
  const photoRef = useRef<HTMLInputElement>(null);

  const startEdit = useCallback(() => {
    setDraft(loadEpk());
    setEditing(true);
  }, []);

  const save = useCallback(() => {
    const next = saveEpk(draft);
    setEpk(next);
    setEditing(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [draft]);

  const onPhoto = useCallback((file: File | undefined) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setDraft((d) => ({ ...d, photoDataUrl: String(fr.result) }));
    fr.readAsDataURL(file);
  }, []);

  const copyAll = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(epkFullText(epk));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }, [epk]);

  const d = editing ? draft : epk;

  return (
    <div id="epk-print" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            {d.stageName} — EPK
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Your electronic press kit, to the latest industry standard: bio, highlights, press quotes, socials, tech rider and management — editable here and exportable anywhere.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {savedFlash && <span className="self-center text-xs font-semibold text-emerald-300">✓ Saved</span>}
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={save}>💾 Save EPK</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => void copyAll()}>{copied ? "✓ Copied" : "Copy full EPK"}</Button>
              <Button onClick={() => window.print()}>🖨 Print / Save as PDF</Button>
              <Button onClick={startEdit}>✎ Edit</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* photo card */}
        <div className="space-y-3">
          <Card className="overflow-hidden p-0">
            {d.photoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.photoDataUrl} alt={d.stageName} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-zinc-950 text-center">
                <span className="text-4xl">🎤</span>
                <span className="px-6 text-xs text-zinc-500">Portrait photo — add hers here (re-upload the EPK portrait)</span>
              </div>
            )}
          </Card>
          {editing && (
            <Card className="p-3">
              <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
              <Button variant="ghost" className="w-full" onClick={() => photoRef.current?.click()}>📷 Upload portrait</Button>
            </Card>
          )}
          <Card className="p-4">
            <SectionLabel>At a glance</SectionLabel>
            <dl className="mt-2 space-y-1.5 text-xs">
              {[
                ["Stage name", d.stageName],
                ["Real name", d.artistName],
                ["Origin", d.origin],
                ["Based", d.base],
                ["Genres", d.genres],
                ["Languages", d.languages],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-zinc-500">{k}</dt>
                  <dd className="text-right font-medium text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        {/* content */}
        <div className="space-y-3">
          {/* bio */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Bio</SectionLabel>
            {editing ? (
              <textarea value={d.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={6} className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-[13px] leading-relaxed text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
            ) : (
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-300">{d.bio}</p>
            )}
          </Card>

          {/* highlights */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Highlights</SectionLabel>
            <ul className="mt-2 space-y-1.5">
              {(editing ? draft.achievements : d.achievements).map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-zinc-300">
                  <span className="mt-0.5 text-fuchsia-400">▸</span>
                  {editing ? (
                    <input value={a} onChange={(e) => setDraft({ ...draft, achievements: draft.achievements.map((x, j) => (j === i ? e.target.value : x)) })} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[13px] text-zinc-200" />
                  ) : (
                    <span>{a}</span>
                  )}
                </li>
              ))}
            </ul>
            {editing && (
              <Button variant="ghost" className="mt-2" onClick={() => setDraft({ ...draft, achievements: [...draft.achievements, ""] })}>+ Add highlight</Button>
            )}
          </Card>

          {/* press */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Press quotes</SectionLabel>
            <div className="mt-2 space-y-2">
              {(editing ? draft.pressQuotes : d.pressQuotes).map((q: PressQuote, i) => (
                <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                  {editing ? (
                    <>
                      <input value={q.quote} onChange={(e) => setDraft({ ...draft, pressQuotes: draft.pressQuotes.map((x, j) => (j === i ? { ...x, quote: e.target.value } : x)) })} className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-[13px] text-zinc-200" />
                      <input value={q.source} onChange={(e) => setDraft({ ...draft, pressQuotes: draft.pressQuotes.map((x, j) => (j === i ? { ...x, source: e.target.value } : x)) })} placeholder="Source" className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs text-zinc-300" />
                    </>
                  ) : (
                    <p className="text-[13px] italic leading-relaxed text-zinc-300">“{q.quote}” <span className="not-italic text-zinc-500">— {q.source}</span></p>
                  )}
                </div>
              ))}
            </div>
            {editing && (
              <Button variant="ghost" className="mt-2" onClick={() => setDraft({ ...draft, pressQuotes: [...draft.pressQuotes, { quote: "", source: "" }] })}>+ Add press quote</Button>
            )}
          </Card>

          {/* socials + rider + management */}
          <Card className="p-4 sm:p-5">
            <SectionLabel>Links, tech rider & management</SectionLabel>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["instagram", "tiktok", "youtube", "spotify", "soundcloud"] as const).map((k) => (
                <label key={k} className="block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 capitalize">{k}</span>
                  {editing ? (
                    <input value={d.socials[k]} onChange={(e) => setDraft({ ...draft, socials: { ...draft.socials, [k]: e.target.value } })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200" />
                  ) : (
                    <div className="mt-1 truncate text-xs text-zinc-300">{d.socials[k] || "—"}</div>
                  )}
                </label>
              ))}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Tech rider</span>
                {editing ? (
                  <textarea value={d.techRider} onChange={(e) => setDraft({ ...draft, techRider: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200" />
                ) : (
                  <div className="mt-1 text-xs leading-relaxed text-zinc-300">{d.techRider}</div>
                )}
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Management</span>
                {editing ? (
                  <textarea value={d.management} onChange={(e) => setDraft({ ...draft, management: e.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200" />
                ) : (
                  <div className="mt-1 text-xs leading-relaxed text-zinc-300">{d.management}</div>
                )}
              </label>
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Streaming / music links</span>
                {editing ? (
                  <input value={d.streamingLinks[0] ?? ""} onChange={(e) => setDraft({ ...draft, streamingLinks: [e.target.value] })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200" />
                ) : (
                  <div className="mt-1 truncate text-xs text-zinc-300">{d.streamingLinks[0] || "—"}</div>
                )}
              </label>
            </div>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-zinc-600">
        Pre-filled from her known profile (Tunisian-born, Qatar-raised · EVG). Edit anything, upload the portrait, then Print → Save as PDF or Copy the full EPK text for any venue/label — GigRadar&apos;s press pack in the Gigs app also uses this identity.
      </p>
      <div className="print:hidden">
        <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">← Back to studio</Link>
      </div>
    </div>
  );
}
