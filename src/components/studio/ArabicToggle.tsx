"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "emy-studio-arabic";

export function useArabic() {
  const [arabic, setArabicState] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "true") {
        setArabicState(true);
        document.documentElement.setAttribute("dir", "rtl");
        document.documentElement.setAttribute("lang", "ar");
      }
    } catch {}
  }, []);

  const setArabic = (val: boolean) => {
    setArabicState(val);
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, String(val));
      document.documentElement.setAttribute("dir", val ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", val ? "ar" : "en");
    } catch {}
  };

  return { arabic, setArabic };
}

export function ArabicToggle() {
  const { arabic, setArabic } = useArabic();

  return (
    <button
      onClick={() => setArabic(!arabic)}
      className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
      title="Toggle Arabic / English"
    >
      {arabic ? "🇬🇧 EN" : "🇦🇪 AR"}
    </button>
  );
}
