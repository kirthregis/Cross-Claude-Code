/**
 * EMY Studio — release packaging brain.
 *
 * Turns a finished project (master + artwork + project metadata) into the
 * exact title / description / tags / file naming YouTube, Instagram and a
 * record label expect, then checks the whole package against each
 * platform's rules and returns a PASS/WARN/FAIL list.
 *
 * Pure + unit-tested. Numbers follow YouTube Help + Spotify/Apple
 * distribution guides as of 2026.
 */

import type { AudioInfo, MasterResult, Project, ReleaseCheck, ReleaseMeta, StudioSettings } from "./types";

export const YT_TITLE_MAX = 100;
export const YT_DESC_MAX = 5000;
export const YT_TAGS_MAX_CHARS = 500;
export const COVER_MIN_PX = 1280;
export const COVER_IDEAL_PX = 3000;
export const COVER_MAX_BYTES = 20 * 1024 * 1024;

function cleanName(s: string): string {
  return s.replace(/[^\p{L}\p{N} _\-–—.&()!'"]/gu, "").replace(/\s+/g, " ").trim();
}

export function buildTitle(project: Project, artistName: string): string {
  const artist = artistName || "DJ EMY";
  const suffix = project.meta.kind === "mix" ? ` | ${artist}` : ` (Original Mix) | ${artist}`;
  const maxBase = Math.max(8, YT_TITLE_MAX - suffix.length - 1);
  let base = cleanName(project.meta.name) || "New Project";
  if (base.length > maxBase) base = base.slice(0, maxBase).trim();
  return `${base}${suffix}`;
}

export function buildDescription(project: Project, s: StudioSettings): string {
  const tracklist = project.tracklist ?? [];
  const insta = s.instagram || "@dj_emy_";
  const tiktok = s.tiktok || "@djemymusic2";
  const genre = project.meta.genre || "Afro House";
  const kindLine =
    project.meta.kind === "mix"
      ? `This set features a journey through ${genre}, carefully selected to create a deep and energetic vibe from start to finish.`
      : `A brand new ${genre} production, written and produced by ${s.artistName}.`;

  return [
    `${s.artistName} — ${project.meta.name}`,
    ``,
    kindLine,
    ``,
    `If you enjoy the music, don't forget to:`,
    `* Like 👍`,
    `* Comment 💬`,
    `* Subscribe 🔔`,
    ``,
    `Thank you for your support!`,
    ``,
    `Follow me:`,
    `Instagram: ${insta}`,
    `TikTok: ${tiktok}`,
    ...(tracklist.length > 0 ? [
      ``,
      `Tracklist:`,
      ...tracklist.map((t) => {
        const label = t.label ? ` [${t.label}]` : "";
        return `${t.timestamp} - ${t.artist} - ${t.title}${label}`;
      }),
    ] : []),
  ].join("\n");
}

const DEFAULT_TAGS = [
  "#AfroHouse",
  "#AfroTech",
  "#DJEMY",
  "#HouseMusic",
  "#AfroHouseMix",
  "#DeepHouse",
  "#Amapiano",
  "#DJSet",
  "#ElectronicMusic",
  "#MusicMix",
];

export function buildTags(project: Project): string[] {
  const genreTag = "#" + (project.meta.genre || "AfroHouse").replace(/[^A-Za-z0-9]/g, "");
  return [...new Set([genreTag, ...DEFAULT_TAGS])].slice(0, 12);
}

export function buildFileName(project: Project, s: StudioSettings, bits: 16 | 24): string {
  const artist = cleanName(s.artistName || "DJ EMY").replace(/\s+/g, "_");
  const title = cleanName(project.meta.name).replace(/\s+/g, "_");
  const stem = `${artist}_${title}_48kHz_${bits}bit`;
  return `${stem}.wav`.replace(/[\\/:*?"<>|]/g, "");
}

export function buildRelease(project: Project, s: StudioSettings): ReleaseMeta {
  return {
    title: buildTitle(project, s.artistName),
    description: buildDescription(project, s),
    tags: buildTags(project),
    category: "Music",
    madeForKids: "no",
    visibility: "unlisted",
    fileName: buildFileName(project, s, 24),
    generatedAt: Date.now(),
    copyright: `\u00a9 ${new Date().getFullYear()} ${s.artistName || "DJ EMY"}`,
    pLine: `\u2117 ${new Date().getFullYear()} ${s.artistName || "DJ EMY"}`,
    releaseDate: new Date().toISOString().split("T")[0],
    label: "Independent",
  };
}

/** The recommended YouTube upload settings, ready to read aloud / show. */
export function youtubeHandoff(meta: ReleaseMeta): string {
  return [
    `Title:   ${meta.title}`,
    `Desc:    (paste — ${meta.description.length} chars)`,
    `Tags:    ${meta.tags.join(" ")}`,
    `Category: Music`,
    `Made for kids: No`,
    `Visibility: ${meta.visibility}`,
  ].join("\n");
}

export interface PackageSnapshot {
  audio?: AudioInfo;
  master?: MasterResult;
  artworkSize?: { width: number; height: number; bytes: number };
  release?: ReleaseMeta;
}

/** Build the compliance report. Order: audio → loudness → artwork → text. */
export function runComplianceChecks(pkg: PackageSnapshot, platform: "youtube" | "instagram" | "label"): ReleaseCheck[] {
  const checks: ReleaseCheck[] = [];

  // ---- Audio format ----
  if (!pkg.audio) {
    checks.push({ id: "audio", label: "Audio file loaded", status: "fail", detail: "No audio imported yet.", fix: "Import the mix in the Master tab." });
  } else {
    const a = pkg.audio;
    const sr = a.sampleRate;
    checks.push(
      sr === 48000
        ? { id: "samplerate", label: "Sample rate 48 kHz", status: "pass", detail: `${sr} Hz — YouTube's preferred rate.` }
        : sr === 44100
          ? { id: "samplerate", label: "Sample rate 48 kHz", status: "warn", detail: `Source is ${sr} Hz — the master will be rendered to 48 kHz automatically.` }
          : { id: "samplerate", label: "Sample rate 48 kHz", status: "fail", detail: `Source is ${sr} Hz — render will convert to 48 kHz.` },
    );
    if (a.durationSec < 15) {
      checks.push({ id: "duration", label: "Duration", status: "warn", detail: `Only ${Math.round(a.durationSec)}s — very short for a release.`, fix: "Check the audio is the full mix." });
    } else {
      checks.push({ id: "duration", label: "Duration", status: "pass", detail: `${Math.floor(a.durationSec / 60)}m ${Math.floor(a.durationSec % 60)}s.` });
    }
  }

  // ---- Loudness ----
  if (!pkg.master) {
    checks.push({ id: "loudness", label: "Loudness mastered", status: "fail", detail: "No master rendered yet.", fix: "Run Mastering in the Master tab." });
  } else {
    const m = pkg.master;
    const target = m.params.targetLufs;
    const ok = Math.abs(m.outputLufs - target) <= 0.6;
    checks.push(
      ok
        ? { id: "loudness", label: `Loudness ${target} LUFS`, status: "pass", detail: `Output measured ${m.outputLufs.toFixed(1)} LUFS (target ${target}).` }
        : { id: "loudness", label: `Loudness ${target} LUFS`, status: "warn", detail: `Output measured ${m.outputLufs.toFixed(1)} LUFS — close to target ${target}.` },
    );
    const tp = m.outputTruePeakDb;
    checks.push(
      tp <= -0.3
        ? { id: "truepeak", label: "True peak ≤ -1 dBTP", status: tp <= -0.8 ? "pass" : "warn", detail: `True peak ${tp.toFixed(1)} dBTP.` }
        : { id: "truepeak", label: "True peak ≤ -1 dBTP", status: "fail", detail: `True peak ${tp.toFixed(1)} dBTP — risk of clipping after platform transcode.`, fix: "Lower the limiter ceiling to -1 dB in the Master tab and re-render." },
    );
  }

  // ---- Artwork ----
  if (!pkg.artworkSize) {
    checks.push({ id: "artwork", label: "Cover artwork", status: "fail", detail: "No artwork yet.", fix: "Generate a cover in the Artwork tab." });
  } else {
    const w = pkg.artworkSize.width;
    const h = pkg.artworkSize.height;
    const b = pkg.artworkSize.bytes;
    if (w === COVER_IDEAL_PX && h === COVER_IDEAL_PX) {
      checks.push({ id: "artwork", label: "Cover 3000×3000", status: "pass", detail: `Cover is ${w}×${h} (${(b / 1024 / 1024).toFixed(1)} MB).` });
    } else if (w >= COVER_MIN_PX && h >= COVER_MIN_PX) {
      checks.push({ id: "artwork", label: "Cover 3000×3000", status: "warn", detail: `Cover is ${w}×${h} — works, but ${COVER_IDEAL_PX}×${COVER_IDEAL_PX} is ideal for stores.` });
    } else {
      checks.push({ id: "artwork", label: "Cover 3000×3000", status: "fail", detail: `Cover is ${w}×${h} — too small for platforms.`, fix: "Regenerate or re-export at 3000×3000." });
    }
    checks.push(
      b <= COVER_MAX_BYTES
        ? { id: "artwork-size", label: "Cover file size", status: "pass", detail: `${(b / 1024 / 1024).toFixed(1)} MB (limit 20 MB).` }
        : { id: "artwork-size", label: "Cover file size", status: "fail", detail: `${(b / 1024 / 1024).toFixed(1)} MB — over 20 MB.`, fix: "Re-export the JPEG at higher compression." },
    );
  }

  // ---- Tracklist ----
  const tracklist = (pkg as unknown as { tracklist?: { id: string }[] }).tracklist ?? [];
  if (tracklist.length === 0) {
    checks.push({ id: "tracklist", label: "Tracklist added", status: "warn", detail: "No tracklist yet — add track names and timestamps in the Tracklist tab.", fix: "Go to the Tracklist tab and add your tracks." });
  } else {
    checks.push({ id: "tracklist", label: "Tracklist added", status: "pass", detail: `${tracklist.length} track${tracklist.length !== 1 ? "s" : ""} in tracklist.` });
  }

  // ---- Distribution metadata ----
  if (pkg.release) {
    const r = pkg.release;
    checks.push(
      r.isrc
        ? { id: "isrc", label: "ISRC code", status: "pass", detail: `ISRC: ${r.isrc}` }
        : { id: "isrc", label: "ISRC code", status: platform === "label" ? "fail" : "warn", detail: "No ISRC code. Required for Spotify/Apple Music distribution.", fix: "Get an ISRC from your distributor (RouteNote, DistroKid) or enter one in the Release tab." }
    );
    checks.push(
      r.copyright
        ? { id: "copyright", label: "Copyright notice", status: "pass", detail: r.copyright }
        : { id: "copyright", label: "Copyright notice", status: "warn", detail: "No copyright notice.", fix: "Auto-generated when you generate the release pack." }
    );
  }

  // ---- Text ----
  if (!pkg.release) {
    checks.push({ id: "title", label: "Title ready", status: "fail", detail: "No release metadata yet.", fix: "Open the Release tab and generate it." });
  } else {
    const r = pkg.release;
    checks.push(
      r.title.length <= YT_TITLE_MAX
        ? { id: "title", label: "Title length", status: "pass", detail: `${r.title.length}/${YT_TITLE_MAX} chars.` }
        : { id: "title", label: "Title length", status: "fail", detail: `${r.title.length}/${YT_TITLE_MAX} chars — too long.`, fix: "Shorten the project name." },
    );
    checks.push(
      r.description.length <= YT_DESC_MAX
        ? { id: "desc", label: "Description length", status: "pass", detail: `${r.description.length}/${YT_DESC_MAX} chars.` }
        : { id: "desc", label: "Description length", status: "fail", detail: `${r.description.length}/${YT_DESC_MAX} chars.`, fix: "Trim the description." },
    );
    const tagsText = r.tags.join(" ");
    checks.push(
      tagsText.length <= YT_TAGS_MAX_CHARS
        ? { id: "tags", label: "Tags within limit", status: "pass", detail: `${r.tags.length} tags, ${tagsText.length}/${YT_TAGS_MAX_CHARS} chars.` }
        : { id: "tags", label: "Tags within limit", status: "warn", detail: `${tagsText.length}/${YT_TAGS_MAX_CHARS} chars — YouTube truncates over 500.` },
    );
  }

  if (platform === "instagram") {
    checks.push({
      id: "insta-note",
      label: "Instagram ready",
      status: pkg.master && pkg.artworkSize ? "pass" : "skip",
      detail:
        "Instagram Reels/Posts need video (MP4). Use the artwork as the visual with the mastered audio attached in the app — specs: 1080×1080 or 1080×1920, loudness -14 LUFS (your master is set to that).",
    });
  }
  if (platform === "label") {
    checks.push(
      pkg.master && pkg.audio
        ? { id: "label-wav", label: "Label master WAV", status: "pass", detail: "Export the 24-bit 48 kHz WAV from the Master tab — that is the label-ready deliverable." }
        : { id: "label-wav", label: "Label master WAV", status: "fail", detail: "Export the 24-bit 48 kHz WAV from the Master tab first." },
    );
  }

  return checks;
}

export function checksSummary(checks: ReleaseCheck[]): { pass: number; warn: number; fail: number } {
  const s = { pass: 0, warn: 0, fail: 0 };
  for (const c of checks) if (c.status !== "skip") s[c.status]++;
  return s;
}
