"use client";

import { useEffect } from "react";
import { useTheme, fontStack, googleFontHref, radiusValue } from "@/lib/studio/theme";

export function ThemeProvider() {
  const theme = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", theme.primary);
    root.style.setProperty("--brand-accent", theme.accent);
    root.style.setProperty("--brand-bg", theme.background);
    root.style.setProperty("--brand-font", fontStack(theme.font));
    root.style.setProperty("--brand-radius", radiusValue(theme.radius));
    document.body.style.background = theme.background;

    const existing = document.getElementById("google-font-link");
    const href = googleFontHref(theme.font);
    if (href) {
      if (existing) {
        existing.setAttribute("href", href);
      } else {
        const link = document.createElement("link");
        link.id = "google-font-link";
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    } else if (existing) {
      existing.remove();
    }
  }, [theme]);

  return null;
}