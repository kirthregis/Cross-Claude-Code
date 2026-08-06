/**
 * EMY Studio — Style & Branding.
 *
 * The artist can re-skin the whole app: brand gradient colors, background,
 * font, corner radius and her own logo. Applied as CSS variables by
 * ThemeProvider (src/components/studio/ThemeProvider.tsx) so it works
 * instantly app-wide, offline, with no code.
 */

import { useSyncExternalStore } from "react";

export interface ThemeSettings {
  /** Start color of the brand gradient (buttons, logo, highlights). */
  primary: string;
  /** End color of the brand gradient. */
  accent: string;
  /** App background color. */
  background: string;
  /** Font family preset. */
  font: ThemeFont;
  /** Corner radius preset. */
  radius: ThemeRadius;
  /** Her uploaded logo (small data URL) — replaces the "E" mark. */
  logoDataUrl: string | null;
}

export type ThemeFont = "inter" | "poppins" | "montserrat" | "space" | "playfair" | "system" | "mono";
export type ThemeRadius = "sharp" | "soft" | "pill";

export const FONT_OPTIONS: { id: ThemeFont; label: string; stack: string; google?: string }[] = [
  { id: "inter", label: "Inter (modern)", stack: "'Inter', system-ui, -apple-system, sans-serif", google: "Inter:wght@400;500;600;700;800;900" },
  { id: "poppins", label: "Poppins (rounded)", stack: "'Poppins', system-ui, sans-serif", google: "Poppins:wght@400;500;600;700;800" },
  { id: "montserrat", label: "Montserrat (bold)", stack: "'Montserrat', system-ui, sans-serif", google: "Montserrat:wght@400;500;600;700;800;900" },
  { id: "space", label: "Space Grotesk (tech)", stack: "'Space Grotesk', system-ui, sans-serif", google: "Space+Grotesk:wght@400;500;600;700" },
  { id: "playfair", label: "Playfair (elegant)", stack: "'Playfair Display', Georgia, serif", google: "Playfair+Display:wght@500;600;700;800" },
  { id: "system", label: "System default", stack: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { id: "mono", label: "Monospace (techy)", stack: "ui-monospace, 'Cascadia Mono', 'SF Mono', monospace" },
];

export const RADIUS_OPTIONS: { id: ThemeRadius; label: string; value: string }[] = [
  { id: "sharp", label: "Sharp", value: "0.5rem" },
  { id: "soft", label: "Soft", value: "1rem" },
  { id: "pill", label: "Pill", value: "1.5rem" },
];

export interface ThemePreset {
  id: string;
  label: string;
  primary: string;
  accent: string;
  background: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: "midnight", label: "Midnight", primary: "#c026d3", accent: "#f59e0b", background: "#0a0a0f" },
  { id: "desert", label: "Desert Gold", primary: "#d97706", accent: "#fbbf24", background: "#0c0a07" },
  { id: "rose", label: "Rose", primary: "#e11d48", accent: "#fb7185", background: "#0f0508" },
  { id: "emerald", label: "Emerald", primary: "#10b981", accent: "#34d399", background: "#03120c" },
  { id: "ocean", label: "Ocean", primary: "#0284c7", accent: "#22d3ee", background: "#020e16" },
  { id: "violet", label: "Violet", primary: "#7c3aed", accent: "#a78bfa", background: "#0d0818" },
  { id: "sunset", label: "Sunset", primary: "#f97316", accent: "#facc15", background: "#120a04" },
  { id: "mono", label: "Mono", primary: "#52525b", accent: "#d4d4d8", background: "#0a0a0a" },
];

export const BACKGROUND_OPTIONS: { id: string; label: string; value: string }[] = [
  { id: "midnight", label: "Midnight", value: "#0a0a0f" },
  { id: "black", label: "Pure black", value: "#000000" },
  { id: "charcoal", label: "Charcoal", value: "#121214" },
  { id: "navy", label: "Deep navy", value: "#0b1020" },
  { id: "green", label: "Deep green", value: "#07130f" },
  { id: "purple", label: "Deep purple", value: "#140b1e" },
  { id: "warm", label: "Warm dark", value: "#14100a" },
  { id: "slate", label: "Slate", value: "#0f172a" },
];

export const DEFAULT_THEME: ThemeSettings = {
  primary: "#c026d3",
  accent: "#f59e0b",
  background: "#0a0a0f",
  font: "inter",
  radius: "soft",
  logoDataUrl: null,
};

const KEY = "emy-studio-theme-v1";

// Memoised cache - same raw string = same object reference = no infinite loop
let themeCache: { raw: string | null; t: ThemeSettings } | null = null;

function read(): ThemeSettings {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) { themeCache = null; return DEFAULT_THEME; }
    if (themeCache && themeCache.raw === raw) return themeCache.t;
    const p = JSON.parse(raw) as Partial<ThemeSettings>;
    const t = {
      primary: typeof p.primary === "string" && p.primary ? p.primary : DEFAULT_THEME.primary,
      accent: typeof p.accent === "string" && p.accent ? p.accent : DEFAULT_THEME.accent,
      background: typeof p.background === "string" && p.background ? p.background : DEFAULT_THEME.background,
      font: (FONT_OPTIONS.some((f) => f.id === p.font) ? p.font : DEFAULT_THEME.font) as ThemeFont,
      radius: (RADIUS_OPTIONS.some((r) => r.id === p.radius) ? p.radius : DEFAULT_THEME.radius) as ThemeRadius,
      logoDataUrl: typeof p.logoDataUrl === "string" ? p.logoDataUrl : null,
    };
    themeCache = { raw, t };
    return t;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(t: ThemeSettings): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(t));
    themeCache = null; // bust cache so next read picks up new value
  } catch {
    /* noop */
  }
  emit();
}

export function resetTheme(): void {
  try {
    window.localStorage.removeItem(KEY);
    themeCache = null; // bust cache
  } catch {
    /* noop */
  }
  emit();
}

const listeners = new Set<() => void>();
function emit(): void {
  listeners.forEach((l) => l());
}
function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useTheme(): ThemeSettings {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_THEME);
}

export function fontStack(font: ThemeFont): string {
  return FONT_OPTIONS.find((f) => f.id === font)?.stack ?? FONT_OPTIONS[0].stack;
}

export function googleFontHref(font: ThemeFont): string | null {
  return FONT_OPTIONS.find((f) => f.id === font)?.google ? `https://fonts.googleapis.com/css2?family=${FONT_OPTIONS.find((f) => f.id === font)!.google}&display=swap` : null;
}

export function radiusValue(radius: ThemeRadius): string {
  return RADIUS_OPTIONS.find((r) => r.id === radius)?.value ?? "1rem";
}

/** Downscale an uploaded logo image to a small data URL (160px). */
export function downscaleLogo(file: File, max = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(max, Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
