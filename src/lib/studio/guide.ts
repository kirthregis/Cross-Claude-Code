/**
 * EMY Studio — the "How to use the studio" content.
 * Pure data + helpers so the guide is easy to update and unit-test.
 */

export interface GuideStep {
  n: number;
  title: string;
  short: string;
  detail: string;
  icon: string;
  tab?: "master" | "artwork" | "release" | "check";
  command: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    n: 0,
    title: "Build your library",
    short: "Import her tracks, play through the controller",
    detail: "The Library tab imports her music (files or whole folders, stored on-device) and plays it through any output — pick her DDJ-800 as the audio device in Settings and it plays through the controller. Free legal sources for studio-quality music are built in (netlabels, CC collections, DJ promos).",
    icon: "🎵",
    command: "“Open the library”",
  },
  {
    n: 1,
    title: "Keep your EPK fresh",
    short: "Bio, highlights, press quotes, links — edit & export",
    detail: "The EPK tab holds her professional profile (Tunisian-born, Qatar-raised, EVG) — edit the bio, highlights, press quotes, socials and tech rider, upload the portrait, then Print → Save as PDF or copy the full text for any venue or label.",
    icon: "📇",
    command: "“Open my EPK”",
  },
  {
    n: 3,
    title: "Create a project",
    short: "Give the mix a name",
    detail: "Tap + New project, name it (e.g. “Afro House Mix 2026”), pick Mix or Track. Or just say “create a new mix project” to the assistant.",
    icon: "💿",
    command: "“Create a new mix project”",
  },
  {
    n: 4,
    title: "Import & master",
    short: "Drop in your mix, press Master",
    detail: "In the Master tab, drag your finished mix (MP3/WAV/M4A…). Pick a target — YouTube/Spotify is -14 LUFS — hit Master. It renders on this device and pings you when done. Export the 48 kHz WAV when it finishes.",
    icon: "🎚",
    tab: "master",
    command: "“Master my mix”",
  },
  {
    n: 5,
    title: "Make the cover",
    short: "AI design or a template",
    detail: "In the Artwork tab, press Generate for an AI cover from your track's vibe (Gemini or fal.ai), or pick an offline template. Either way it comes out exactly 3000×3000 — what YouTube and stores want.",
    icon: "🎨",
    tab: "artwork",
    command: "“Make the cover art”",
  },
  {
    n: 6,
    title: "Build the release pack",
    short: "Title, description, tags — written for you",
    detail: "One tap in the Release tab writes the YouTube title (e.g. “Afro House Mix 2026 | DJ EMY”), the description with your Instagram/TikTok, and the tags — all within platform limits. Copy it or download the notes file.",
    icon: "📦",
    tab: "release",
    command: "“Build the release pack”",
  },
  {
    n: 7,
    title: "Check it's ready",
    short: "The same review a label runs",
    detail: "The Check tab tests loudness, format, artwork and text against YouTube/Instagram/label rules and tells you exactly what to fix if anything's red.",
    icon: "✅",
    tab: "check",
    command: "“Is it ready?”",
  },
  {
    n: 8,
    title: "Get it out there",
    short: "Free distribution + where DJs post",
    detail: "Open the Distribute page for the free places to push it: Spotify/Apple via RouteNote or FreshTunes, mixes on SoundCloud/Mixcloud/1001Tracklists, labels via LabelRadar.",
    icon: "📤",
    command: "“Open distribute”",
  },
];

export const VOICE_EXAMPLES: string[] = [
  "Master my mix",
  "Make the cover art",
  "Build the release pack",
  "Is it ready?",
  "What's left to do?",
  "Create a project called Summer Mix",
];

export const GUIDE_QUICK_TIPS: { icon: string; text: string }[] = [
  { icon: "📱", text: "Works on your phone too — Add to Home Screen and it installs like an app." },
  { icon: "✈️", text: "Works offline — mastering, templates, release pack and checks all run with no internet." },
  { icon: "🔒", text: "Your music and keys stay on your device. Nothing is uploaded anywhere." },
  { icon: "💡", text: "Find the improvement box at the bottom of the home screen — tell the app what to add and watch it show up." },
  { icon: "🎚", text: "Playback can route through her DJ controller — Settings → Audio output → pick the DDJ (full deck mixing still needs Rekordbox)." },
  { icon: "💼", text: "GigRadar lives in the same app — Gigs tab finds, prices and contracts her bookings." },
];

export const GUIDE_DISMISSED_KEY = "emy-studio-guide-dismissed";
