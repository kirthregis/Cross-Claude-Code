/**
 * Engine settings — the parts of GigRadar Emy controls herself, without code.
 *
 * Everything here is exposed on the /customize page and stored via
 * `settings-store.ts`. The loader is injected (mirroring `active-profile`) so
 * pure logic modules (scoring, notify, sources) stay free of any storage
 * dependency and remain trivially unit-testable.
 */

export interface EngineSettings {
  /** What the radar hunts. */
  hunting: {
    /** Web scan on/off. */
    webScanOn: boolean;
    /** Search phrases used by the web scan. Empty = built-in defaults. */
    queries: string[];
    /** Extra RSS/JSON feeds to scan. */
    extraFeeds: string[];
    /** Substrings that auto-suppress a lead (junk, wrong region, wrong sound). */
    blocklist: string[];
  };
  /** How loud alerts are and when she is (not) interrupted. */
  alerts: {
    quietStartHour: number; // Dubai 24h hour, e.g. 2
    quietEndHour: number;   // e.g. 9
    urgentFrom: number;     // score threshold
    highFrom: number;
    normalFrom: number;
    digestFrom: number;
    suppressBelow: number;
  };
  /** Branding shown in the app and on pitches. */
  branding: {
    /** Signature line at the foot of pitches. */
    pitchSignoff: string;
    /** Theme accent colour (hex). */
    accentColor: string;
    /** Media id used as the dashboard backdrop, if any. */
    backdropMediaId?: string;
  };
}

export const DEFAULT_SETTINGS: EngineSettings = {
  hunting: {
    webScanOn: true,
    queries: [],
    extraFeeds: [],
    blocklist: [],
  },
  alerts: {
    quietStartHour: 2,
    quietEndHour: 9,
    urgentFrom: 75,
    highFrom: 70,
    normalFrom: 50,
    digestFrom: 32,
    suppressBelow: 32,
  },
  branding: {
    pitchSignoff: "",
    accentColor: "#e11d48",
  },
};

type Loader = () => EngineSettings;

let loader: Loader | null = null;
let cached: { at: number; value: EngineSettings } | null = null;
const TTL_MS = 5_000;

export function setSettingsLoader(fn: Loader) {
  loader = fn;
  cached = null;
}

export function invalidateSettingsCache() {
  cached = null;
}

export function activeSettings(): EngineSettings {
  if (!loader) return DEFAULT_SETTINGS;
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  try {
    const value = loader();
    cached = { at: Date.now(), value };
    return value;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Tiers from a score, honouring any user thresholds. */
export function tierForScore(score: number): "urgent" | "high" | "normal" | "digest" | "suppress" {
  const a = activeSettings().alerts;
  if (score >= a.urgentFrom) return "urgent";
  if (score >= a.highFrom) return "high";
  if (score >= a.normalFrom) return "normal";
  if (score >= a.digestFrom) return "digest";
  return "suppress";
}
