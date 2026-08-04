"use client";

import Link from "next/link";
import { Card, SectionLabel } from "@/components/studio/ui";

interface Site {
  name: string;
  url: string;
  what: string;
  free: string;
  tag: "stores" | "mixes" | "labels" | "social";
}

const SITES: Site[] = [
  // Get on the stores for free
  { name: "RouteNote", url: "https://routenote.com", what: "Free distribution to Spotify, Apple Music, TikTok, YouTube Music + 20 more stores. You keep 85% of royalties (free tier), 100% on paid.", free: "Free", tag: "stores" },
  { name: "FreshTunes", url: "https://freshtunes.com", what: "Near-100% royalties, releases live within ~48 hours. Great for getting a track out fast.", free: "Free", tag: "stores" },
  { name: "ONErpm", url: "https://onerpm.com", what: "Free distribution with a royalty commission; strong on artist marketing support.", free: "Free", tag: "stores" },
  { name: "UnitedMasters", url: "https://unitedmasters.com", what: "Free DEBUT tier: 90% royalties to 50+ stores incl. Spotify & Apple, plus brand-partnership deals.", free: "Free tier", tag: "stores" },
  { name: "SoundOn (TikTok)", url: "https://soundon.global", what: "ByteDance's distributor — deep TikTok integration, 100% royalties in year one.", free: "Free", tag: "stores" },
  // Host the mixes
  { name: "SoundCloud", url: "https://soundcloud.com", what: "The biggest DJ community — upload mixes & tracks. Free tier (3h of uploads) or Next Pro for unlimited.", free: "Free tier", tag: "mixes" },
  { name: "Mixcloud", url: "https://mixcloud.com", what: "Built for DJ sets — licensed for mixes, so no copyright takedowns. Free = 10 uploads, rotate as needed.", free: "Free tier", tag: "mixes" },
  { name: "HearThis.at", url: "https://hearthis.at", what: "100 free uploads, free live streaming, DJ-friendly community.", free: "Free", tag: "mixes" },
  { name: "1001Tracklists", url: "https://1001tracklists.com", what: "The DJ mix database — post your tracklist + mix, it's how DJs and fans discover sets.", free: "Free", tag: "mixes" },
  // Get signed / submitted
  { name: "LabelRadar", url: "https://labelradar.com", what: "The free route into electronic labels — submit tracks to real labels (Afro House, Tech, House) with feedback.", free: "Free", tag: "labels" },
  // Socials
  { name: "YouTube", url: "https://studio.youtube.com", what: "Her main home — upload with the handoff pack from the Release tab.", free: "Free", tag: "social" },
  { name: "Instagram", url: "https://instagram.com", what: "Reels with the artwork + mastered audio, link to the full mix.", free: "Free", tag: "social" },
];

const TAG_LABELS: Record<Site["tag"], string> = {
  stores: "Get on Spotify & Apple Music (free)",
  mixes: "Host your DJ mixes (free)",
  labels: "Submit to record labels (free)",
  social: "Post & promote (free)",
};

const TAG_ORDER: Site["tag"][] = ["stores", "mixes", "labels", "social"];

export default function DistributePage() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="bg-gradient-to-r from-fuchsia-400 to-amber-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Get it out there — free
          </h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            The top free places DJs and producers push music, checked for 2026. Everything the studio exports (48 kHz WAV, -14 LUFS, 3000×3000 cover, title & tags) is exactly what these sites want — no reformatting.
          </p>
        </div>
        <Link href="/studio" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Back to studio
        </Link>
      </div>

      {TAG_ORDER.map((tag) => (
        <div key={tag}>
          <SectionLabel>{TAG_LABELS[tag]}</SectionLabel>
          <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
            {SITES.filter((s) => s.tag === tag).map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="group block rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-fuchsia-500/50 hover:bg-zinc-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-zinc-100 group-hover:text-fuchsia-300">{s.name}</span>
                  <span className="shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">{s.free}</span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{s.what}</p>
                <div className="mt-2 text-[11px] font-semibold text-fuchsia-400 opacity-0 transition group-hover:opacity-100">Open site →</div>
              </a>
            ))}
          </div>
        </div>
      ))}

      <Card className="p-4 sm:p-5">
        <SectionLabel>A release ritual that works</SectionLabel>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-zinc-400">
          <li>Finish in the studio → export the 24-bit WAV + 3000×3000 cover from the Release tab.</li>
          <li>Push the mix to <strong className="text-zinc-200">YouTube</strong> (handoff pack does the formatting) and <strong className="text-zinc-200">Mixcloud / SoundCloud</strong> for the DJ crowd — post the tracklist on <strong className="text-zinc-200">1001Tracklists</strong>.</li>
          <li>For the track version, send it to the stores free via <strong className="text-zinc-200">RouteNote</strong> or <strong className="text-zinc-200">FreshTunes</strong> (Spotify, Apple, TikTok, everywhere), and submit to Afro House / Tech labels on <strong className="text-zinc-200">LabelRadar</strong>.</li>
          <li>Cut a Reel with the cover + mastered audio for Instagram and TikTok, linking to the YouTube mix.</li>
        </ol>
      </Card>
    </div>
  );
}
