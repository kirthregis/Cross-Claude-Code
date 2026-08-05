"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "emy-studio-arabic";

export function useArabic() {
  const [arabic, setArabicState] = useState(false);

  useEffect(() => {
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
      className="fixed bottom-24 right-4 z-50 rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 shadow-lg hover:text-white sm:bottom-6"
      title="Toggle Arabic / English"
    >
      {arabic ? "🇬🇧 English" : "🇦🇪 عربي"}
    </button>
  );
}