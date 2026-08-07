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
    short: "Import your tracks & audio files",
    detail: "Import audio files or whole folders. Stored offline on-device. Play through your DJ controller or studio monitors. Free legal music sources built in.",
    icon: "📂",
    href: "/studio/library",
    command: "“Open the library”",
  },
  {
    n: 1,
    title: "Create a Project",
    short: "Start a new mix or single release",
    detail: "Name your project, pick the genre and mood. This is where your mix becomes a release.",
    icon: "💿",
    command: "“Create a new mix project”",
  },
  {
    n: 2,
    title: "Master & Loudness",
    short: "5-band EQ, compressor, limiter, stereo",
    detail: "Upload your mix, master it with studio-grade processing: 5-band parametric EQ, compressor, soft clipper, limiter, stereo width. Renders 24-bit/48kHz WAV on-device.",
    icon: "🎚",
    tab: "master",
    command: "“Master my mix”",
  },
  {
    n: 3,
    title: "Tracklist",
    short: "Add timestamps, artists & track names",
    detail: "Build your tracklist with timestamps. One-click copy formatted for YouTube, SoundCloud, and 1001Tracklists.",
    icon: "📝",
    tab: "master",
    command: "“Open my tracklist”",
  },
  {
    n: 4,
    title: "Cover Artwork",
    short: "AI covers or templates at 3000×3000",
    detail: "Generate covers via Gemini AI or fal.ai, or use offline templates. Exported at 3000×3000 for all platforms.",
    icon: "🎨",
    tab: "artwork",
    command: "“Make the cover art”",
  },
  {
    n: 5,
    title: "Release Pack",
    short: "Title, description, tags for YouTube",
    detail: "Auto-generates YouTube title, description with tracklist, hashtags, and file names. Copy and paste directly.",
    icon: "📦",
    tab: "release",
    command: "“Build the release pack”",
  },
  {
    n: 6,
    title: "Check & Verify",
    short: "Loudness, artwork, tags compliance",
    detail: "Run platform compliance checks: LUFS, true peak, artwork size, title length, tracklist. Fix anything flagged.",
    icon: "✅",
    tab: "check",
    command: "“Is it ready?”",
  },
  {
    n: 7,
    title: "Distribute",
    short: "Upload, splits & smart links",
    detail: "Push to Spotify, Apple Music, SoundCloud via free distributors. Manage royalty splits and smart links.",
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
