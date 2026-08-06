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
  targetLufs: number;
  lowGainDb: number;
  midGainDb: number;
  highGainDb: number;
  rumbleFilter: boolean;
  compThreshold: number;
  compRatio: number;
  limiterDrive: number;
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
  youtube: { label: "YouTube / Spotify (-14 LUFS)", params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14 } },
  apple: { label: "Apple Music (-16 LUFS)", params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -16 } },
  club: { label: "Club / Label (-9 LUFS, loud)", params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -9, compThreshold: -18, compRatio: 3, limiterDrive: 0.8, ceilingDb: -0.6 } },
  gentle: { label: "Gentle (normalize only)", params: { ...DEFAULT_MASTER_PARAMS, targetLufs: -14, compThreshold: -24, compRatio: 1.4, limiterDrive: 0.35, ceilingDb: -1.5 } },
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
  | "settings" | "help" | "thanks" | "fallback";

export interface AssistantDecision {
  intent: AssistantIntent;
  reply: string;
  action?: { type: "navigate"; to: string } | { type: "createProject"; name: string; kind: ProjectKind };
}

