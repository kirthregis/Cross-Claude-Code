"use client";
import { useEffect, useState } from "react";
export function PwaRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then((r) => {
      r.addEventListener("updatefound", () => {
        const next = r.installing;
        if (!next) return;
        next.addEventListener("statechange", () => {
          if (next.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
    try {
      const raw = localStorage.getItem("emy-studio-projects-v1");
      if (raw) JSON.parse(raw);
    } catch {
      localStorage.removeItem("emy-studio-projects-v1");
    }
    try {
      const raw = localStorage.getItem("emy-studio-settings-v1");
      if (raw) JSON.parse(raw);
    } catch {
      localStorage.removeItem("emy-studio-settings-v1");
    }
  }, []);
  if (!updateReady) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl shadow-black/60">
      <span className="text-sm text-zinc-200">Update ready</span>
      <button
        onClick={() => navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" })}
        className="rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500"
      >
        Reload
      </button>
    </div>
  );
}
