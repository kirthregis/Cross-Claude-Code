"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startListening, speechSupported, speak } from "@/lib/studio/speech";
import { useSettings } from "@/lib/studio/store";
import { routeCommand } from "@/lib/studio/assistant";

export function GlobalVoiceButton() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const router = useRouter();
  const settings = useSettings();
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(speechSupported());
  }, []);

  const handleCommand = useCallback((text: string) => {
    routeCommand(text);
    const t = text.toLowerCase();
    if (t.includes("radar") || t.includes("gig")) {
      router.push("/studio/gigradar");
      speak("Opening Gig Radar.", settings.soundOn, "en-US", settings.voiceGender);
    } else if (t.includes("library") || t.includes("music")) {
      router.push("/studio/library");
      speak("Opening your music library.", settings.soundOn, "en-US", settings.voiceGender);
    } else if (t.includes("settings") || t.includes("theme")) {
      router.push("/studio/settings");
      speak("Opening settings.", settings.soundOn, "en-US", settings.voiceGender);
    } else if (t.includes("admin") || t.includes("money")) {
      router.push("/studio/admin");
      speak("Opening admin dashboard.", settings.soundOn, "en-US", settings.voiceGender);
    } else if (t.includes("epk") || t.includes("press")) {
      router.push("/studio/epk");
      speak("Opening your press kit.", settings.soundOn, "en-US", settings.voiceGender);
    } else {
      router.push("/studio?tab=assistant");
      speak("Let me help you in the assistant.", settings.soundOn, "en-US", settings.voiceGender);
    }
  }, [router, settings.soundOn]);

  const toggle = () => {
    if (listening) {
      stopRef.current?.();
      setListening(false);
      return;
    }
    const stop = startListening({
      onResult: (t) => {
        setListening(false);
        handleCommand(t);
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (stop) {
      stopRef.current = stop;
      setListening(true);
    }
  };

  if (!supported) return null;

  return (
    <button
      onClick={toggle}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full transition-all ${listening ? "bg-red-600 animate-pulse scale-110 shadow-[0_0_15px_rgba(220,38,38,0.5)]" : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"}`}
      title="Voice Assistant"
    >
      {listening ? "🛑" : "🎙️"}
      {listening && (
        <span className="absolute -inset-1 rounded-full border-2 border-red-500 animate-ping" />
      )}
    </button>
  );
}
