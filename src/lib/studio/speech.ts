/**
 * EMY Studio — speech input (Web Speech API) + output (speechSynthesis).
 * Feature-detects everything; voice is a bonus, typing always works.
 */

export interface SpeechState {
  supported: boolean;
  listening: boolean;
  error: string | null;
}

// Minimal Web Speech API typings (the DOM lib's are still not universal).
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
interface SpeechRecognitionCtor {
  new (): SpeechRecognitionLike;
}

let recognition: SpeechRecognitionLike | null = null;

function recognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function speechSupported(): boolean {
  return recognitionCtor() != null;
}

function getRecognition(): SpeechRecognitionLike | null {
  if (recognition) return recognition;
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  recognition = rec;
  return rec;
}

export function startListening(handlers: {
  onResult: (transcript: string) => void;
  onEnd: () => void;
  onError: (err: string) => void;
}): (() => void) | null {
  const rec = getRecognition();
  if (!rec) return null;
  rec.onresult = (e) => {
    const text: string = Array.from(e.results)
      .map((r) => r[0]?.transcript ?? "")
      .join(" ")
      .trim();
    if (text) handlers.onResult(text);
  };
  rec.onerror = (e) => handlers.onError(e?.error || "speech error");
  rec.onend = () => handlers.onEnd();
  try {
    rec.start();
  } catch {
    // Already started — ignore.
  }
  return () => {
    try {
      rec.onend = null;
      rec.onresult = null;
      rec.onerror = null;
      rec.abort();
    } catch {
      /* noop */
    }
  };
}

export function speak(text: string, enabled: boolean, lang = "en-US", gender: "male" | "female" | "auto" = "male"): void {
  if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 1;
    u.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    // Nicer, more natural voices first; prefer the requested gender.
    const score = (v: SpeechSynthesisVoice): number => {
      let s = 0;
      if (/en[-_](US|GB|AU)/i.test(v.lang)) s += 10;
      if (gender === "male" && /david|guy|male|christopher|james|daniel|george|ryan|mark|eric|alex|arthur|thomas|james/i.test(v.name)) s += 8;
      if (gender === "female" && /zira|female|samantha|victoria|susan|hazel|aria|jenny|kate|michelle|libby/i.test(v.name)) s += 8;
      if (/natural|online|premium|enhanced|neural|google/i.test(v.name)) s += 4;
      if (/google/i.test(v.name) && /en[-_](US|GB|AU)/i.test(v.lang)) s += 2;
      if (/^en/i.test(v.lang)) s += 1;
      return s;
    };
    const ranked = [...voices].sort((a, b) => score(b) - score(a));
    const preferred = ranked[0];
    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech is best-effort */
  }
}

export function notify(title: string, body: string): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  try {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon-192.png" });
    } else if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") new Notification(title, { body, icon: "/icon-192.png" });
      });
    }
  } catch {
    /* best-effort */
  }
}
