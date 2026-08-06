"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import {
  getEpkBlob,
  getEpkPortraitDataUrl,
  getEpkState,
  removeEpkFile,
  saveEpkFile,
  saveEpkNotes,
  type EpkFileInfo,
} from "@/lib/studio/epk-store";
import { formatBytes } from "@/lib/studio/dsp";

export default function EpkPage() {
  const [pdf, setPdf] = useState<EpkFileInfo | null>(null);
  const [portrait, setPortrait] = useState<EpkFileInfo | null>(null);
  const [portraitUrl, setPortraitUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const state = await getEpkState();
    setPdf(state.pdf);
    setPortrait(state.portrait);
    setNotes(state.notes);
    const url = await getEpkPortraitDataUrl();
    setPortraitUrl(url);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onUploadPdf = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const state = await saveEpkFile(file, "pdf");
      setPdf(state.pdf);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setBusy(false);
    }
  }, []);

  const onUploadPortrait = useCallback(async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const state = await saveEpkFile(file, "portrait");
      setPortrait(state.portrait);
      const url = await getEpkPortraitDataUrl();
      setPortraitUrl(url);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    } finally {
      setBusy(false);
    }
  }, []);

  const removePdf = useCallback(async () => {
    await removeEpkFile("pdf");
    setPdf(null);
  }, []);

  const removePortrait = useCallback(async () => {
    await removeEpkFile("portrait");
    setPortrait(null);
    setPortraitUrl(null);
  }, []);

  const openPdf = useCallback(async () => {
    const blob = await getEpkBlob("pdf");
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, []);

  const downloadPdf = useCallback(async () => {
    const blob = await getEpkBlob("pdf");
    if (!blob || !pdf) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdf.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }, [pdf]);

  const saveNotes = useCallback(() => {
    saveEpkNotes(notes);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }, [notes]);

  const copyNotes = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }, [notes]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">
            EPK — press kit
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Upload her own press kit here — the PDF, the portrait, and any quick notes. It&apos;s stored on this device, ready to view or download any time.
          </p>
        </div>
        {savedFlash && <span className="text-xs font-semibold text-emerald-300">✓ Saved</span>}
        <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">← Back to studio</Link>
      </div>

      {/* EPK file */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>Her EPK file</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">PDF, text or image — the latest press kit she sends to venues and labels.</p>
          </div>
          <input ref={pdfInputRef} type="file" accept=".pdf,.txt,.md,.doc,.docx,image/*" className="hidden" onChange={(e) => void onUploadPdf(e.target.files?.[0])} />
          <Button onClick={() => pdfInputRef.current?.click()} disabled={busy}>{pdf ? "Replace EPK" : "⬆ Upload EPK"}</Button>
        </div>

        {pdf ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-zinc-200">📄 {pdf.name}</div>
              <div className="font-mono text-[10px] text-zinc-600">{formatBytes(pdf.sizeBytes)} · {new Date(pdf.addedAt).toLocaleDateString()}</div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => void openPdf()}>View</Button>
              <Button variant="ghost" className="!px-3 !py-1.5 text-xs" onClick={() => void downloadPdf()}>⬇ Download</Button>
              <Button variant="danger" className="!px-3 !py-1.5 text-xs" onClick={() => void removePdf()}>Remove</Button>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-700 p-6 text-center text-xs text-zinc-500">
            No EPK uploaded yet — tap “Upload EPK” and pick her press kit file.
          </div>
        )}
      </Card>

      {/* portrait */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionLabel>Portrait photo</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">The photo that goes with the press kit (e.g. portrait_black.png).</p>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onUploadPortrait(e.target.files?.[0])} />
          <Button variant="ghost" onClick={() => photoInputRef.current?.click()} disabled={busy}>{portrait ? "Replace photo" : "⬆ Upload portrait"}</Button>
        </div>
        <div className="mt-3 flex items-center gap-4">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
            {portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={portraitUrl} alt="Portrait" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🎤</div>
            )}
          </div>
          <div className="min-w-0 flex-1 text-xs text-zinc-500">
            {portrait ? (
              <div>
                <div className="truncate font-semibold text-zinc-300">{portrait.name}</div>
                <div className="font-mono text-[10px] text-zinc-600">{formatBytes(portrait.sizeBytes)}</div>
                <button onClick={() => void removePortrait()} className="mt-1 text-xs text-zinc-600 hover:text-red-400">Remove photo</button>
              </div>
            ) : (
              "No portrait uploaded yet."
            )}
          </div>
        </div>
      </Card>

      {/* notes */}
      <Card className="p-4 sm:p-5">
        <SectionLabel>Quick notes (optional)</SectionLabel>
        <p className="mt-1 text-xs text-zinc-500">Anything handy to have next to the EPK — a bio snippet, links, or the text from a PDF you&apos;d rather paste than upload.</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          placeholder="Paste or type notes here…"
          className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-[13px] leading-relaxed text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={saveNotes}>💾 Save notes</Button>
          <Button variant="ghost" onClick={() => void copyNotes()}>{copied ? "✓ Copied" : "Copy notes"}</Button>
        </div>
      </Card>
    </div>
  );
}
