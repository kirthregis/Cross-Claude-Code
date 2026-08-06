"use client";
import { useEffect, useState } from "react";

// Heal corrupt localStorage before React boots
function healStorage() {
  ["emy-studio-projects-v1","emy-studio-settings-v1"].forEach(k => {
    try { const v = localStorage.getItem(k); if (v) JSON.parse(v); }
    catch { localStorage.removeItem(k); }
  });
}

export function PwaRegister() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    healStorage();
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").then(r => {
      r.addEventListener("updatefound", () => {
        const w = r.installing;
        if (!w) return;
        w.addEventListener("statechange", () => {
          if (w.state === "installed" && navigator.serviceWorker.controller) setReady(true);
        });
      });
    }).catch(() => {});
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
  }, []);
  if (!ready) return null;
  return (
    <div className="fixed bottom-4 left-1/2 z-[9999] -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 shadow-2xl">
      <span className="text-sm text-zinc-200">Update ready</span>
      <button onClick={() => navigator.serviceWorker.controller?.postMessage({type:"SKIP_WAITING"})}
        className="rounded-xl bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500">
        Reload now
      </button>
    </div>
  );
}
