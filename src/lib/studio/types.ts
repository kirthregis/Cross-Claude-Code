export type ProjectKind = "mix" | "track";
export type ProjectStage = "draft" | "master" | "art" | "release" | "done";

export interface Collaborator {
  id: string;
  name: string;
  role: string;
  splitPct: number;
  email: string;
  wallet: string;
}

export interface SmartLinks {
  spotify: string;
  appleMusic: string;
  youtube: string;
  soundcloud: string;
  tidal: string;
  bandcamp: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  kind: ProjectKind;
  genre: string;
  mood: string;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  mastered: boolean;
  artworkDone: boolean;
  releaseDone: boolean;
}

export interface MasterParams {
  // Target loudness
  targetLufs: number;
  // Input gain (pre-processing)
  inputGainDb: number;
  // 5-band parametric EQ
  lowGainDb: number;       // 80 Hz low shelf
  lowMidGainDb: number;    // 250 Hz peaking
  midGainDb: number;       // 1 kHz peaking
  highMidGainDb: number;   // 4 kHz peaking
  highGainDb: number;      // 12 kHz high shelf
  // Filters
  rumbleFilter: boolean;   // 30 Hz highpass
  mudCut: boolean;         // -3dB at 250 Hz (common DJ mix cleanup)
  airBoost: boolean;       // +2dB at 12 kHz shelf
  // Compression
  compThreshold: number;
  compRatio: number;
  compAttack: number;      // ms
  compRelease: number;     // ms
  compKnee: number;        // dB
  // Soft clipper (pre-limiter warmth/punch)
  softClipEnabled: boolean;
  softClipDrive: number;   // 0-1
  // Limiter
  limiterDrive: number;
  ceilingDb: number;
  // Stereo
  stereoWidth: number;     // 0 (mono) to 200 (extra wide), 100 = normal
  monoBass: boolean;       // narrow bass below 200 Hz to mono
  // Dither
  ditherEnabled: boolean;
}

export const DEFAULT_MASTER_PARAMS: MasterParams = {
  targetLufs: -14,
  inputGainDb: 0,
  lowGainDb: 0,
  lowMidGainDb: 0,
  midGainDb: 0,
  highMidGainDb: 0,
  highGainDb: 0,
  rumbleFilter: true,
  mudCut: false,
  airBoost: false,
  compThreshold: -16,
  compRatio: 2.2,
  compAttack: 20,
  compRelease: 250,
  compKnee: 12,
  softClipEnabled: false,
  softClipDrive: 0.3,
  limiterDrive: 0.65,
  ceilingDb: -1,
  stereoWidth: 100,
  monoBass: false,
  ditherEnabled: true,
};

export const MASTER_PRESETS: Record<string, { label: string; description: string; params: MasterParams }> = {
  streaming: {
    label: "Streaming (-14 LUFS)",
    description: "Spotify, YouTube, Apple Music — balanced and dynamic",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14 },
  },
  apple: {
    label: "Apple Music (-16 LUFS)",
    description: "Wider dynamic range for Apple's Sound Check",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -16, compRatio: 1.8, limiterDrive: 0.4 },
  },
  club: {
    label: "Club / PA (-9 LUFS)",
    description: "Loud, punchy, compressed for big speakers",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -9, inputGainDb: 2, compThreshold: -18, compRatio: 3.5, compAttack: 10, compRelease: 150, softClipEnabled: true, softClipDrive: 0.5, limiterDrive: 0.85, ceilingDb: -0.5, monoBass: true },
  },
  soundcloud: {
    label: "SoundCloud (-10 LUFS)",
    description: "Louder for SoundCloud's transcoding",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -10, compThreshold: -16, compRatio: 2.8, limiterDrive: 0.75, ceilingDb: -0.8 },
  },
  warm: {
    label: "Warm & Punchy",
    description: "Soft clipping + bass warmth for analog feel",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14, lowGainDb: 1.5, mudCut: true, softClipEnabled: true, softClipDrive: 0.4, compThreshold: -14, compRatio: 2.5 },
  },
  clean: {
    label: "Clean & Transparent",
    description: "Minimal processing, just loudness normalization",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14, compThreshold: -24, compRatio: 1.3, limiterDrive: 0.3, ceilingDb: -1.5 },
  },
  djmix: {
    label: "DJ Mix Master",
    description: "Optimized for long DJ sets — consistent energy, mud cut, air boost",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14, mudCut: true, airBoost: true, compThreshold: -18, compRatio: 2.0, compAttack: 30, compRelease: 300, monoBass: true },
  },
  broadcast: {
    label: "Radio / Podcast",
    description: "Heavy compression for broadcast consistency",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -16, compThreshold: -20, compRatio: 4.0, compAttack: 5, compRelease: 100, limiterDrive: 0.9, ceilingDb: -1.0 },
  },
};

export interface AudioInfo {
  fileName: string;
  sizeBytes: number;
  durationSec: number;
  sampleRate: number;
  channels: number;
}

export interface MasterResult {
  params: MasterParams;
  inputLufs: number;
  outputLufs: number;
  inputTruePeakDb: number;
  outputTruePeakDb: number;
  gainAppliedDb: number;
  renderedAt: number;
  exportName: string;
  exportedWav16?: boolean;
  exportedWav24?: boolean;
  exportSizeBytes?: number;
  blobUrl?: string;
}

export interface ArtworkResult {
  source: "ai" | "template";
  prompt?: string;
  templateId?: string;
  width: number;
  height: number;
  sizeBytes: number;
  generatedAt: number;
  dataUrl?: string;
}

export interface ReleaseMeta {
  title: string;
  description: string;
  tags: string[];
  category: "Music" | "Entertainment" | "People & Blogs";
  madeForKids: "no" | "yes";
  visibility: "public" | "unlisted" | "private";
  fileName: string;
  generatedAt: number;
  // Label/distribution metadata
  isrc?: string;          // International Standard Recording Code
  upc?: string;           // Universal Product Code / barcode
  copyright?: string;     // e.g. "© 2026 Emy Vision Group FZC"
  pLine?: string;         // e.g. "℗ 2026 DJ Emy"
  releaseDate?: string;   // ISO date string
  label?: string;         // Record label name
  catalogNumber?: string; // Label catalog number
}

export interface ReleaseCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail" | "skip";
  detail: string;
  fix?: string;
}


export interface TracklistEntry {
  id: string;
  timestamp: string;      // "00:00" or "01:23:45"
  artist: string;
  title: string;
  label?: string;
  notes?: string;         // "bootleg", "unreleased", "ID", etc.
}

export interface Project {
  meta: ProjectMeta;
  audio?: AudioInfo;
  master?: MasterResult;
  artwork?: ArtworkResult;
  release?: ReleaseMeta;
  masterParams: MasterParams;
  tracklist?: TracklistEntry[];
  chatHistory: ChatTurn[];
  collaborators?: Collaborator[];
  smartLinks?: SmartLinks;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  at: number;
  intent?: string;
}

export interface StudioSettings {
  artistName: string;
  artistHandle: string;
  instagram: string;
  tiktok: string;
  youtubeChannel: string;
  defaultGenre: string;
  defaultKind: ProjectKind;
  geminiKey: string;
  geminiTextModel: string;
  geminiImageModel: string;
  imageProvider: "gemini" | "fal";
  falKey: string;
  falModel: string;
  defaultTargetLufs: number;
  emailPing: boolean;
  soundOn: boolean;
  voiceGender: "male" | "female" | "auto";
  audioOutputDevice: string;
  youtubeApiKey: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  spotifyArtistId: string;
}

export const DEFAULT_SETTINGS: StudioSettings = {
  artistName: "DJ EMY",
  artistHandle: "@DJEMY",
  instagram: "@dj_emy_",
  tiktok: "@djemymusic2",
  youtubeChannel: "https://www.youtube.com/@DJEMY-o6d",
  defaultGenre: "Afro House",
  defaultKind: "mix",
  geminiKey: "",
  geminiTextModel: "gemini-3.5-flash",
  geminiImageModel: "gemini-3.1-flash-image-preview",
  imageProvider: "gemini",
  falKey: "",
  falModel: "fal-ai/flux/dev",
  defaultTargetLufs: -14,
  emailPing: false,
  soundOn: true,
  voiceGender: "male",
  audioOutputDevice: "",
  youtubeApiKey: "",
  spotifyClientId: "",
  spotifyArtistId: "",
  spotifyClientSecret: "",
};

export type AssistantIntent =
  | "greet" | "create_project" | "open_project" | "list_projects"
  | "master" | "artwork" | "release" | "check" | "status"
  | "settings" | "help" | "thanks" | "fallback"
  | "gigradar" | "analytics" | "distribute" | "community" | "epk";

export interface AssistantDecision {
  intent: AssistantIntent;
  reply: string;
  action?: { type: "navigate"; to: string } | { type: "createProject"; name: string; kind: ProjectKind };
}

