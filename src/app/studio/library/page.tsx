"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";
import {
  deleteLibraryTrack,
  getLibraryBlob,
  importDirectory,
  isDirectoryPickerAvailable,
  listLibraryTracks,
  saveLibraryTrack,
  type LibraryTrack,
} from "@/lib/studio/library-store";
import { formatBytes, formatDuration } from "@/lib/studio/dsp";
import { loadSettings } from "@/lib/studio/store";

interface FreeSource {
  name: string;
  url: string;
  what: string;
  tag: string;
}

const FREE_SOURCES: FreeSource[] = [
  { name: "Internet Archive — Netlabels", url: "https://archive.org/details/netlabels", what: "Thousands of free, studio-quality electronic/CC albums — FLAC/WAV downloads, no account.", tag: "Studio quality CC" },
  { name: "Free Music Archive", url: "https://freemusicarchive.org", what: "Curated Creative Commons music, download-enabled, browsable by genre.", tag: "Creative Commons" },
  { name: "Bandcamp (free / pay-what-you-want)", url: "https://bandcamp.com/tag/electronic?sort=date", what: "Many artists set $0 or free download — search 'free download' tags for promo tracks.", tag: "Free downloads" },
  { name: "SoundCloud (downloads on)", url: "https://soundcloud.com", what: "Filter playlists for tracks with the download button enabled — artists share free promos.", tag: "Free downloads" },
  { name: "Hypeddit", url: "https://hypeddit.com", what: "The DJ promo hub — producers give free downloads (often for a follow/like).", tag: "DJ promos" },
  { name: "LabelRadar", url: "https://labelradar.com", what: "Labels give free promo tracks to DJs who submit/join — the free route into label catalogues.", tag: "DJ promos" },
  { name: "Jamendo", url: "https://www.jamendo.com", what: "Free-licensed music, download in MP3/WAV.", tag: "Creative Commons" },
  { name: "ccMixter", url: "http://ccmixter.org", what: "CC remix/electronic community — every track downloadable.", tag: "Creative Commons" },
];

interface ArchiveDoc {
  identifier: string;
  title?: string;
  creator?: string[];
  downloads?: number;
}

export default function LibraryPage() {
  const settings = loadSettings();
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<LibraryTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // Archive.org search
  const [query, setQuery] = useState("afro house");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<ArchiveDoc[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const load = useCallback(() => {
    void listLibraryTracks().then((t) => {
      setTracks(t);
      setLoading(false);
    });
  }, []);

  useEffect(load, [load]);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const playTrack = useCallback(
    async (t: LibraryTrack) => {
      const blob = await getLibraryBlob(t.id);
      if (!blob) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const audio = audioRef.current;
      if (!audio) return;
      audio.src = url;
      // Route to chosen output (e.g. DJ controller sound card).
      if (settings.audioOutputDevice && "setSinkId" in audio) {
        try {
          await (audio as HTMLAudioElement & { setSinkId: (id: string) => Promise<void> }).setSinkId(settings.audioOutputDevice);
        } catch {
          /* fall back to default */
        }
      }
      setNowPlaying(t);
      setProgress(0);
      await audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    },
    [settings.audioOutputDevice],
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().catch(() => setPlaying(false));
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  }, []);

  const onFiles = useCallback(async (files: FileList | File[]) => {
    setImporting(true);
    setImportMsg(null);
    let count = 0;
    for (const f of Array.from(files)) {
      if (/audio\//i.test(f.type) || /\.(mp3|wav|m4a|flac|aac|aiff?|ogg|opus)$/i.test(f.name)) {
        await saveLibraryTrack(f);
        count++;
      }
    }
    setImportMsg(count ? `Added ${count} track${count === 1 ? "" : "s"} to your library.` : "No audio files found.");
    setImporting(false);
    load();
  }, [load]);

  const addFolder = useCallback(async () => {
    if (!isDirectoryPickerAvailable()) {
      setImportMsg("Folder import needs Chrome or Edge on a desktop. Use “Add files” instead.");
      return;
    }
    setImporting(true);
    setImportMsg(null);
    try {
      const n = await importDirectory();
      setImportMsg(n ? `Added ${n} track${n === 1 ? "" : "s"} from the folder.` : "No audio files in that folder.");
    } catch {
      setImportMsg("Folder import cancelled.");
    }
    setImporting(false);
    load();
  }, [load]);

  const removeTrack = useCallback(
    (id: string) => {
      void deleteLibraryTrack(id).then(() => {
        if (nowPlaying?.id === id) {
          audioRef.current?.pause();
          setNowPlaying(null);
        }
        load();
      });
    },
    [load, nowPlaying],
  );

  const searchArchive = useCallback(async () => {
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const q = `collection:netlabels AND ${query.trim() || "*:*"}`;
      const url =
        "https://archive.org/advancedsearch.php?q=" +
        encodeURIComponent(q) +
        "&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=downloads&rows=12&output=json&sort[]=downloads+desc";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Archive.org returned ${res.status}`);
      const j = await res.json();
      const docs = (j?.response?.docs ?? []) as ArchiveDoc[];
      setResults(docs);
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : "Search failed — check your internet.");
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    if (results === null) void searchArchive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Music library
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Your tracks, on this device, playing through whatever audio output you choose — including her DJ controller&apos;s sound card. Plus the free, legal places to pull studio-quality music into it.
          </p>
        </div>
        <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">← Back to studio</Link>
      </div>

      {/* import */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <SectionLabel>Your library</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">{tracks.length} track{tracks.length === 1 ? "" : "s"} · stored on this device only</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input type="file" accept="audio/*" multiple className="hidden" id="lib-files" onChange={(e) => e.target.files && void onFiles(e.target.files)} />
            <Button variant="ghost" onClick={() => document.getElementById("lib-files")?.click()} disabled={importing}>
              + Add files
            </Button>
            {isDirectoryPickerAvailable() && (
              <Button onClick={() => void addFolder()} disabled={importing}>
                📁 Add a folder
              </Button>
            )}
          </div>
        </div>
        {importMsg && <div className="mt-2 text-xs text-emerald-300">{importMsg}</div>}

        {tracks.length === 0 && !loading ? (
          <div className="mt-4 rounded-xl border border-dashed border-zinc-700 p-6 text-center text-xs text-zinc-500">
            Nothing here yet — add the tracks and folders she already owns, then play them right here (pick her controller as the output in Settings for that route).
          </div>
        ) : (
          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
            {tracks.map((t) => (
              <div key={t.id} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${nowPlaying?.id === t.id ? "border-fuchsia-500/60 bg-fuchsia-500/10" : "border-zinc-800 bg-zinc-950/50"}`}>
                <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => void playTrack(t)}>
                  <span className="text-lg">{nowPlaying?.id === t.id && playing ? "⏸" : "▶"}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-zinc-200">{t.name}</span>
                    <span className="block font-mono text-[10px] text-zinc-600">
                      {t.durationSec ? formatDuration(t.durationSec) : "—"} · {formatBytes(t.sizeBytes)}
                    </span>
                  </span>
                </button>
                <button onClick={() => void removeTrack(t.id)} className="shrink-0 text-xs text-zinc-600 hover:text-red-400" title="Remove">✕</button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* player */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} disabled={!nowPlaying} className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-amber-500 text-lg text-white disabled:opacity-30">
            {playing ? "⏸" : "▶"}
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-zinc-200">{nowPlaying ? nowPlaying.name : "Nothing playing"}</div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-amber-400" style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
          <span className="font-mono text-[11px] text-zinc-500">
            {nowPlaying && nowPlaying.durationSec ? formatDuration(progress * nowPlaying.durationSec) : ""}
          </span>
        </div>
        <audio
          ref={audioRef}
          className="hidden"
          onTimeUpdate={(e) => {
            const el = e.currentTarget;
            setProgress(el.duration ? el.currentTime / el.duration : 0);
          }}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
          }}
        />
        <p className="mt-3 text-[11px] text-zinc-600">
          Output: {settings.audioOutputDevice ? "your chosen device (see Settings → Audio output — pick the DDJ to hear it through the controller)" : "default speakers (Settings → Audio output to route to the controller)"}
        </p>
      </Card>

      {/* free sources */}
      <Card className="p-4 sm:p-5">
        <SectionLabel>Free studio-quality music — legal sources</SectionLabel>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          These give her thousands of downloadable, studio-quality tracks for free — Creative Commons collections, pay-what-you-want releases, and DJ promos from labels and producers (the industry&apos;s free route for DJs).
        </p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {FREE_SOURCES.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="group block rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 transition hover:border-fuchsia-500/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-bold text-zinc-100 group-hover:text-fuchsia-300">{s.name}</span>
                <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{s.tag}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">{s.what}</p>
            </a>
          ))}
        </div>

        {/* archive.org netlabel search */}
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Search free netlabel releases (Archive.org, no account)</div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void searchArchive();
            }}
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. afro house, deep house, techno…"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
            />
            <Button type="submit" disabled={searching}>{searching ? "Searching…" : "Search free music"}</Button>
          </form>
          {searchError && <div className="mt-2 text-xs text-red-300">{searchError}</div>}
          {results && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {results.map((r) => (
                <a key={r.identifier} href={`https://archive.org/details/${r.identifier}`} target="_blank" rel="noreferrer" className="block rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 transition hover:border-fuchsia-500/50">
                  <div className="truncate text-[13px] font-semibold text-zinc-200">{r.title || r.identifier}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-zinc-600">
                    <span className="truncate">{r.creator?.[0] ?? "Various"}</span>
                    <span>{(r.downloads ?? 0).toLocaleString()} dl · open →</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
          One honest note: free downloads of the latest commercial tracks don&apos;t legally exist — that&apos;s what record pools and stores charge for, and no ripping tools are built into this app. The sources above are the real free world: CC collections, free promos, and label giveaways, which add up to thousands of legitimate tracks.
        </p>
      </Card>
    </div>
  );
}
