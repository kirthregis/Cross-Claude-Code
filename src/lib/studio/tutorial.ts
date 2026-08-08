/**
 * EMY Studio — Interactive Tutorial System
 *
 * Per-tab step-by-step guides that hold the DJ's hand.
 * On by default for new users. Toggle off in Settings or per-tab dismiss.
 * Each tab has its own tutorial sequence.
 *
 * Storage: localStorage "emy-studio-tutorials-v1"
 */

export interface TutorialStep {
  title: string;
  body: string;
  tip?: string;
}

export interface TabTutorial {
  tabId: string;
  tabName: string;
  intro: string;
  steps: TutorialStep[];
}

const STORAGE_KEY = "emy-studio-tutorials-v1";

interface TutorialState {
  enabled: boolean;
  completed: Record<string, boolean>;
}

export function loadTutorialState(): TutorialState {
  if (typeof window === "undefined") return { enabled: true, completed: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: true, completed: {} };
    return JSON.parse(raw) as TutorialState;
  } catch {
    return { enabled: true, completed: {} };
  }
}

export function saveTutorialState(state: TutorialState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function isTutorialEnabled(): boolean {
  return loadTutorialState().enabled;
}

export function isTabCompleted(tabId: string): boolean {
  return loadTutorialState().completed[tabId] === true;
}

export function completeTab(tabId: string): void {
  const state = loadTutorialState();
  state.completed[tabId] = true;
  saveTutorialState(state);
}

export function resetTutorials(): void {
  saveTutorialState({ enabled: true, completed: {} });
}

export function setTutorialsEnabled(enabled: boolean): void {
  const state = loadTutorialState();
  state.enabled = enabled;
  saveTutorialState(state);
}

export const TUTORIALS: Record<string, TabTutorial> = {
  master: {
    tabId: "master", tabName: "Master",
    intro: "Let's master your mix step by step. No experience needed — the studio handles the technical stuff.",
    steps: [
      { title: "Step 1: Upload your mix", body: "Click \"Choose Audio File\" or drag your mix file onto the upload area. The studio accepts MP3, WAV, M4A, FLAC, and AIFF. Use the highest quality file you have — WAV is best.", tip: "Export from Rekordbox or Serato as WAV (not MP3) for the best master quality." },
      { title: "Step 2: Pick a preset", body: "Choose where this mix will be published:\n\n• Streaming (-14 LUFS) — Spotify, YouTube, Apple Music\n• Club/PA (-9 LUFS) — Big speakers, loud\n• DJ Mix Master — Optimized for long sets\n• SoundCloud (-10 LUFS) — Louder for SoundCloud's player", tip: "Not sure? Start with \"Streaming\" — it works everywhere." },
      { title: "Step 3: Quick fixes (optional)", body: "Toggle these one-click fixes:\n\n• Rumble Cut — Removes sub-bass noise below 30Hz\n• Cut Mud — Cleans muddy 250Hz area\n• Add Air — Brightens the top end\n• Mono Bass — Makes bass mono for club speakers", tip: "For DJ mixes, \"Cut Mud\" + \"Mono Bass\" almost always improve the sound." },
      { title: "Step 4: Master it", body: "Click \"⚡ Master Mix Now\". The studio processes your mix through:\n\nEQ → Compressor → Soft Clipper → Limiter → Stereo → Loudness\n\nTakes 10–60 seconds. Progress bar shows each stage.", tip: "The mastered file auto-saves to your device and Library. Close the browser, come back — it's still there." },
      { title: "Step 5: Listen & compare", body: "Use the A/B player:\n• Press ▶ to play\n• Toggle \"Original\" vs \"Mastered\"\n• Seek to any part\n• Adjust volume", tip: "Listen to the loudest, quietest, and a vocal section. If all three sound balanced, the master is good." },
      { title: "Step 6: Export", body: "Click \"Export 24-Bit WAV\" for highest quality (labels need this) or \"Export 16-Bit WAV\" for smaller files.\n\nA \"Save As\" dialog lets you pick where to save. Also auto-saves to your Library.", tip: "Always export 24-bit for your archive. You can make 16-bit copies later." },
    ],
  },
  tracklist: {
    tabId: "tracklist", tabName: "Tracklist",
    intro: "Every DJ mix needs a tracklist. Add the tracks you played with timestamps.",
    steps: [
      { title: "Step 1: Add your first track", body: "Click \"+ Add Track\". Fill in:\n• Timestamp — When it starts (00:00, 05:32)\n• Artist — Who made it\n• Title — Track name\n• Label — Record label (optional)", tip: "Check your DJ software history to see what you played and when." },
      { title: "Step 2: Add all tracks", body: "Add every track in your set. Use ▲▼ to reorder and ✕ to remove. The more complete, the better.", tip: "Can't identify a track? Write \"ID\" as the title — listeners will help identify it." },
      { title: "Step 3: Copy for platforms", body: "Click copy buttons for:\n• YouTube/SoundCloud format\n• 1001Tracklists format\n• Markdown for blogs\n\nPaste directly into your upload description.", tip: "Also post on 1001Tracklists.com — it's the DJ community's official tracklist database." },
    ],
  },
  artwork: {
    tabId: "artwork", tabName: "Artwork",
    intro: "Every release needs cover art. Create professional 3000×3000 covers with AI or templates.",
    steps: [
      { title: "Step 1: Choose method", body: "Two options:\n• AI Generation — Unique artwork from a text description (needs API key in Settings)\n• Templates — Pre-designed covers, work offline instantly\n\nBoth output 3000×3000 pixels — every platform accepts this.", tip: "Templates work with no setup. For AI, get a free Gemini key from Google AI Studio." },
      { title: "Step 2: Generate & preview", body: "For AI: Write what you want (\"golden desert sunset with geometric patterns\") and click Generate.\nFor templates: Click any thumbnail.\n\nPreview shows on the left. Try multiple options.", tip: "Be specific: \"Deep blue ocean waves with gold headphones, abstract, cinematic\" beats \"cool cover\"." },
      { title: "Step 3: Save & download", body: "Click \"Save & use this cover\" to lock it as your artwork.\nDownload as JPEG (most platforms) or PNG (lossless, for labels).", tip: "YouTube, Spotify, Apple Music, SoundCloud all want 3000×3000. The studio exports at exactly this." },
    ],
  },
  release: {
    tabId: "release", tabName: "Release",
    intro: "The Release tab writes everything for upload: title, description with tracklist, tags — formatted for YouTube and labels.",
    steps: [
      { title: "Step 1: Generate the pack", body: "Click \"Generate release pack\". Auto-writes:\n• Title (max 100 chars for YouTube)\n• Description with social links and tracklist\n• Tags/Hashtags within platform limits\n• Category and visibility settings", tip: "The description auto-includes your tracklist from the Tracklist tab." },
      { title: "Step 2: Edit if needed", body: "Every field is editable. Character counts show so you don't exceed limits. Everything auto-saves as you type." },
      { title: "Step 3: Copy & upload", body: "Use copy buttons for title, description, or everything at once.\nClick \"Open YouTube Studio\" to go directly to upload.\nPaste everything in.", tip: "Set to \"Unlisted\" first, verify it looks right, then switch to \"Public\"." },
    ],
  },
  check: {
    tabId: "check", tabName: "Check",
    intro: "Pre-flight checklist. Verifies your release meets platform requirements before you upload.",
    steps: [
      { title: "Step 1: Choose platform", body: "Select:\n• YouTube — Title, description, tags, loudness, artwork\n• Instagram — Artwork dimensions, audio format for Reels\n• Record Label — Stricter: WAV quality, metadata" },
      { title: "Step 2: Read results", body: "✅ Pass — Good to go\n⚠️ Warn — Works but could be better\n❌ Fail — Must fix before uploading\n\nEach item tells you what to fix and which tab to go to.", tip: "Fix all red items. Yellow items are optional but fixing them looks more professional." },
    ],
  },
  library: {
    tabId: "library", tabName: "Library",
    intro: "Your music library. Import tracks, play through your DJ controller, find free legal music.",
    steps: [
      { title: "Step 1: Import music", body: "\"Add files\" for individual tracks, or \"Add folder\" (Chrome/Edge) for an entire folder.\n\nSupports: MP3, WAV, M4A, FLAC, AAC, AIFF, OGG.\nStored on your device — nothing uploaded.", tip: "Mastered mixes and exports appear here automatically." },
      { title: "Step 2: Play & preview", body: "Click ▶ on any track. Player at bottom shows progress.\nPlayback goes through your selected audio device (Settings → Audio Output).", tip: "Connect DJ controller via USB → Settings → Audio Output → select it." },
      { title: "Step 3: Free music sources", body: "Scroll down for curated free sources:\n• Internet Archive — CC electronic music\n• Free Music Archive — CC downloads\n• Bandcamp — Free/pay-what-you-want\n• Hypeddit — DJ promos\n• LabelRadar — Label promos" },
    ],
  },
  community: {
    tabId: "community", tabName: "Community",
    intro: "Connect with MENA DJs, producers, and engineers. Find DJ gig opportunities with full contact info.",
    steps: [
      { title: "Discover Artists", body: "52+ artists across 14 countries. Filter by role, genre, city. Each card shows bio, genres, what they're looking for, and Instagram." },
      { title: "Opportunities", body: "40+ DJ bookings with:\n• Pay in AED + venue details\n• Equipment and capacity\n• Direct contact: email, WhatsApp, phone, Instagram\n\nClick \"Apply Now\" for pre-filled email or \"WhatsApp\" for instant message.", tip: "UAE venues pay AED 1,500–12,000. Top gigs go to DJs with a strong EPK and recent mix." },
    ],
  },
};
