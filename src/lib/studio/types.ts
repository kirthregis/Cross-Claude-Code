/**
 * EMY Studio — shared types.
 * All data here is plain JSON so projects survive localStorage/IndexedDB and
 * could later be synced to a server. Nothing depends on the DOM.
 */

export type ProjectKind = "mix" | "track";
export type ProjectStage = "draft" | "master" | "art" | "release" | "done";

export interface ProjectMeta {
  id: string;
  name: string;
  kind: ProjectKind;
  genre: string;
  mood: string;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  /** True once a master has been rendered and exported. */
  mastered: boolean;
  /** True once artwork has been generated/exported. */
  artworkDone: boolean;
  /** True once the release pack was generated. */
  releaseDone: boolean;
}

export interface MasterParams {
  /** Integrated loudness target in LUFS (YouTube/Spotify -14, Apple -16). */
  targetLufs: number;
  /** Low shelf gain @ 90 Hz, dB, -6..+6 */
  lowGainDb: number;
  /** Peaking gain @ 1 kHz, dB, -4..+4 */
  midGainDb: number;
  /** High shelf gain @ 8 kHz, dB, -6..+6 */
  highGainDb: number;
  /** 30 Hz rumble high-pass on/off. */
  rumbleFilter: boolean;
  /** Compressor threshold dBFS, -40..0 */
  compThreshold: number;
  /** Compressor ratio, 1..8 */
  compRatio: number;
  /** Soft-knee limiter drive 0..1 (0 = off). */
  limiterDrive: number;
  /** True-peak ceiling dBFS, -3..0, default -1. */
  ceilingDb: number;
}

export const DEFAULT_MASTER_PARAMS: MasterParams = {
  targetLufs: -14,
  lowGainDb: 0,
  midGainDb: 0,
  highGainDb: 0,
  rumbleFilter: true,
  compThreshold: -16,
  compRatio: 2.2,
  limiterDrive: 0.65,
  ceilingDb: -1,
};

export const MASTER_PRESETS: Record<string, { label: string; params: MasterParams }> = {
  youtube: {
    label: "YouTube / Spotify (-14 LUFS)",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14 },
  },
  apple: {
    label: "Apple Music (-16 LUFS)",
    params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -16 },
  },
  club: {
    label: "Club / Label (-9 LUFS, loud)",
    params: {
      ...DEFAULT_MASTER_PARAMS,
      targetLufs: -9,
      compThreshold: -18,
      compRatio: 3,
      limiterDrive: 0.8,
      ceilingDb: -0.6,
    },
  },
  gentle: {
    label: "Gentle (normalize only)",
    params: {
      ...DEFAULT_MASTER_PARAMS,
      targetLufs: -14,
      lowGainDb: 0,
      midGainDb: 0,
      highGainDb: 0,
      rumbleFilter: true,
      compThreshold: -24,
      compRatio: 1.4,
      limiterDrive: 0.35,
      ceilingDb: -1.5,
    },
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
  /** blob:url kept only in memory during the session */
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
}

export interface ReleaseCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail" | "skip";
  detail: string;
  fix?: string;
}

export interface Project {
  meta: ProjectMeta;
  audio?: AudioInfo;
  master?: MasterResult;
  artwork?: ArtworkResult;
  release?: ReleaseMeta;
  masterParams: MasterParams;
  chatHistory: ChatTurn[];
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
  defaultTargetLufs: number;
  emailPing: boolean;
  soundOn: boolean;
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
  geminiTextModel: "gemini-2.5-flash",
  geminiImageModel: "gemini-2.5-flash-image",
  defaultTargetLufs: -14,
  emailPing: false,
  soundOn: true,
};

export type AssistantIntent =
  | "greet"
  | "create_project"
  | "open_project"
  | "list_projects"
  | "master"
  | "artwork"
  | "release"
  | "check"
  | "status"
  | "settings"
  | "help"
  | "thanks"
  | "fallback";

export interface AssistantDecision {
  intent: AssistantIntent;
  reply: string;
  /** optional client action to perform after replying */
  action?: { type: "navigate"; to: string } | { type: "createProject"; name: string; kind: ProjectKind };
}
