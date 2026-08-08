"use client";

import { useEffect } from "react";

/**
 * Registers the EMY Studio service worker (offline support + notifications)
 * and ensures any stale service worker caches are purged immediately.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update().catch(() => {});
        })
        .catch(() => {
          /* offline support is best-effort */
        });

      // When a new service worker activates, reload to get fresh content
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SW_UPDATED") {
          window.location.reload();
        }
      });
    }

    if ("Notification" in window && Notification.permission === "default") {
      // ask only after user has interacted with the studio
      const onFirstClick = () => {
        window.removeEventListener("pointerdown", onFirstClick);
        Notification.requestPermission().catch(() => {});
      };
      window.addEventListener("pointerdown", onFirstClick, { once: true });
    }
  }, []);

  return null;
}
