"use client";
import { useEffect } from "react";
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        for (let reg of regs) { reg.unregister(); }
      });
      navigator.serviceWorker.register("/sw.js?v=final");
    }
    // Self-healing: Clear any stuck re-render loops in storage
    const lastVersion = localStorage.getItem("emy-version");
    if (lastVersion !== "1.0.5") {
      localStorage.clear(); 
      localStorage.setItem("emy-version", "1.0.5");
      window.location.reload();
    }
  }, []);
  return null;
}
