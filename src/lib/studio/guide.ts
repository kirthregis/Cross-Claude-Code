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
  href?: string;
  command: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    n: 0,
    title: "Music Library",
    short: "Import tracks, play through DDJ controller",
    detail: "The Library imports audio files or whole folders (stored offline on-device) and plays them through your sound card or Pioneer DDJ-800 controller. Free legal sources for studio-quality music are built in.",
    icon: "🎵",
    href: "/studio/library",
    command: "“Open the library”",
  },
  {
    n: 1,
    title: "Press Kit & EPK",
    short: "Upload portrait, rider & bio",
    detail: "The EPK module stores your official press kit PDF, high-res portrait photos, and bio notes locally on this device. Ready to download and send to promoters.",
    icon: "📇",
    href: "/studio/epk",
    command: "“Open my EPK”",
  },
  {
    n: 3,
    title: "Create a Project",
    short: "Start a new mix or single release",
    detail: "Start a fresh project, name it, set the target genre and cover art mood.",
    icon: "💿",
    command: "“Create a new mix project”",
  },
  {
    n: 4,
    title: "Master & Loudness",
    short: "EQ, compression & BS.1770-4 loudness",
    detail: "Load your mix, choose a target (-14 LUFS for YouTube/Spotify, -9 LUFS for club), and render clean 24-bit/48kHz WAV audio with true-peak protection.",
    icon: "🎚",
    tab: "master",
    command: "“Master my mix”",
  },
  {
    n: 5,
    title: "Cover Artwork",
    short: "AI generation or 3000×3000 templates",
    detail: "Generate 3000×3000 album covers via Gemini AI or fal.ai Flux, or render offline graphic templates instantly.",
    icon: "🎨",
    tab: "artwork",
    command: "“Make the cover art”",
  },
  {
    n: 6,
    title: "Release Packager",
    short: "YouTube metadata, descriptions & tags",
    detail: "Auto-formats YouTube titles, hashtags, rich descriptions with social links, and label-safe file names.",
    icon: "📦",
    tab: "release",
    command: "“Build the release pack”",
  },
  {
    n: 7,
    title: "Compliance Check",
    short: "Verify loudness, artwork & tags",
    detail: "Validates all platform compliance rules (true peak, integrated LUFS, artwork dimensions, tag uniqueness) before publishing.",
    icon: "✅",
    tab: "check",
    command: "“Is it ready?”",
  },
  {
    n: 8,
    title: "Distribute & Royalties",
    short: "Smart links & free distribution channels",
    detail: "Manage smart release links, calculate collaborator royalty splits, and publish to Spotify, Apple Music, SoundCloud, and Beatport.",
    icon: "📤",
    href: "/studio/distribute",
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
