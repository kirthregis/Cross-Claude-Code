"use client";

import { useEffect } from "react";
import { fontStack, googleFontHref, radiusValue, useTheme } from "@/lib/studio/theme";

/**
 * Applies the user's Style & Branding choices as CSS variables on <html>,
 * plus the chosen Google Font (loaded once, cached) and the background.
 * Mounted once in the root layout; re-runs when the theme changes.
 */
export function ThemeProvider() {
  const theme = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--brand-1", theme.primary);
    root.style.setProperty("--brand-2", theme.accent);
    root.style.setProperty("--app-bg", theme.background);
    root.style.setProperty("--radius", radiusValue(theme.radius));
    root.style.setProperty("--font-brand", fontStack(theme.font));
    document.body.style.backgroundColor = theme.background;

    // theme-color for mobile browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.background);
  }, [theme]);

  useEffect(() => {
    const href = googleFontHref(theme.font);
    if (!href) return;
    if (document.querySelector(`link[data-brand-font="${theme.font}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.brandFont = theme.font;
    document.head.appendChild(link);
  }, [theme.font]);

  return null;
}
