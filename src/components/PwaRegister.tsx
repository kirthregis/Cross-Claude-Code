"use client";

import { useEffect } from "react";

/**
 * Registers the EMY Studio service worker (offline support + notifications)
 * and, on installable browsers, lets users add the app to their home screen.
 */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is best-effort */
      });
    }
    if ("Notification" in window && Notification.permission === "default") {
      // ask only after the user has interacted with the studio
      const onFirstClick = () => {
        window.removeEventListener("pointerdown", onFirstClick);
        Notification.requestPermission().catch(() => {});
      };
      window.addEventListener("pointerdown", onFirstClick, { once: true });
    }
  }, []);
  return null;
}
