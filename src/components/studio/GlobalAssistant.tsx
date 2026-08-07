"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatTurn, ProjectKind } from "@/lib/studio/types";
import { replyForIntent, routeCommand } from "@/lib/studio/assistant";
import { geminiChat, isGeminiConfigured } from "@/lib/studio/gemini";
import { getServerAiStatus, serverTextChat } from "@/lib/studio/server-ai";
import { speak, speechSupported, startListening } from "@/lib/studio/speech";
import { createProject, upsertProject, loadProjects, loadSettings } from "@/lib/studio/store";

const QUICK = ["Master my mix", "Make the cover art", "Build the release pack", "Is it ready?", "Open the library", "Open my EPK"];

/**
 * Floating "talk" assistant available on EVERY page (mounted in the root
 * layout). She taps the mic, says what she needs, and it navigates her —
 * no matter which screen she's on.
 */
export function GlobalAssistant() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const stopListenRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settings = loadSettings();

  useEffect(() => {
    setVoiceOk(speechSupported());
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const push = useCallback((role: "user" | "assistant", text: string, intent?: string) => {
    const turn: ChatTurn = { role, text, at: Date.now(), intent };
    setMessages((m) => [...m.slice(-30), turn]);
    if (role === "assistant") speak(text, settings.soundOn, "en-US", settings.voiceGender);
  }, [settings.soundOn, settings.voiceGender]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setBusy(true);
      setInput("");
      push("user", text);
      const intent = routeCommand(text);
      const projects = loadProjects();
      const latest = projects[0];

      // create project directly if she names it
      if (intent === "create_project") {
        const m = text.match(/(?:called|named|for)\s+["']?([^"']+?)["']?\s*$/i);
        if (m && m[1]) {
          const kind: ProjectKind = /\b(track|song|single|release)\b/i.test(text) ? "track" : "mix";
          const p = createProject({ name: m[1].replace(/\.$/, "").trim(), kind, genre: settings.defaultGenre, mood: "Deep, energetic, hypnotic" });
          upsertProject(p);
          push("assistant", `Created "${p.meta.name}" — opening it now.`, intent);
          router.push(`/studio/p/${p.meta.id}?tab=assistant`);
          setBusy(false);
          return;
        }
        push("assistant", "Tell me what to call it: “create a project called Summer Mix” — or I'll open the studio to start one.", intent);
        router.push("/studio");
        setBusy(false);
        return;
      }

      if (intent === "open_project") {
        router.push("/studio");
        push("assistant", latest ? `Opening your projects — “${latest.meta.name}” is the most recent.` : "You don't have projects yet — say “create a project called …”.", intent);
        setBusy(false);
        return;
      }
      if (intent === "list_projects") {
        router.push("/studio");
        push("assistant", projects.length ? `You have ${projects.length} project${projects.length === 1 ? "" : "s"} — opening the studio.` : "No projects yet — say “create a project called …”.", intent);
        setBusy(false);
        return;
      }
      if (intent === "settings") {
        router.push("/studio/settings");
        push("assistant", "Opening settings.", intent);
        setBusy(false);
        return;
      }
      if (intent === "release" || intent === "check" || intent === "master" || intent === "artwork") {
        const tab = intent === "release" ? "release" : intent === "check" ? "check" : intent === "artwork" ? "artwork" : "master";
        if (latest) {
          router.push(`/studio/p/${latest.meta.id}?tab=${tab}`);
          push("assistant", `Opening the ${tab} tab of “${latest.meta.name}”.`, intent);
        } else {
          router.push("/studio");
          push("assistant", "Open or create a project first, then say it again — I'll take you straight there.", intent);
        }
        setBusy(false);
        return;
      }

      const hasGemini = isGeminiConfigured(settings);
      const serverAi = await getServerAiStatus();
      const decision = replyForIntent(intent, { project: latest, projectCount: projects.length, hasGemini: hasGemini || serverAi.serverGemini });

      if (decision.action?.type === "navigate") router.push(decision.action.to);
      if (decision.intent === "fallback" && (hasGemini || serverAi.serverGemini)) {
        try {
          const history = [...messages, { role: "user" as const, text, at: Date.now() }].slice(-6).map((t) => ({ role: t.role === "assistant" ? ("model" as const) : ("user" as const), parts: [{ text: t.text }] }));
          const res = serverAi.serverGemini
            ? await serverTextChat("You are the assistant in DJ EMY's music studio. Be warm, concise and practical. Guide her to the right tab or give the answer directly. Keep replies under 120 words.", history)
            : (await geminiChat({ key: settings.geminiKey, model: settings.geminiTextModel, messages: history })).text;
          push("assistant", res, "gemini");
        } catch (e) {
          push("assistant", `AI hiccup: ${e instanceof Error ? e.message : "unknown error"}. Try a command like “master my mix”.`, "fallback");
        }
      } else {
        push("assistant", decision.reply, decision.intent);
      }
      setBusy(false);
    },
    [busy, messages, push, router, settings],
  );

  const toggleVoice = useCallback(() => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    const stop = startListening({
      onResult: (t) => void send(t),
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (stop) {
      stopListenRef.current = stop;
      setListening(true);
    } else {
      push("assistant", "Voice isn't available here — type below instead.", "fallback");
    }
  }, [listening, send, push]);

  useEffect(() => () => stopListenRef.current?.(), []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="brand-grad flex h-7 w-7 items-center justify-center rounded-full text-sm">🎧</span>
              <div>
                <div className="text-xs font-bold text-white">Your assistant</div>
                <div className="text-[10px] text-zinc-500">{listening ? "Listening…" : busy ? "Working…" : "On every page"}</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded px-2 py-1 text-zinc-500 hover:text-white">✕</button>
          </div>
          <div ref={scrollRef} className="max-h-64 space-y-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 && (
              <div className="text-[12px] leading-relaxed text-zinc-500">
                Say or type what you need from anywhere:
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK.map((q) => (
                    <button key={q} onClick={() => void send(q)} className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 brand-hover-border hover:brand-text">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${m.role === "user" ? "rounded-br-sm bg-fuchsia-600/80 text-white" : "rounded-bl-sm border border-zinc-800 bg-zinc-800/70 text-zinc-200"}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {busy && <div className="text-[11px] text-zinc-500">…</div>}
          </div>
          <form
            className="flex gap-1.5 border-t border-zinc-800 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. master my mix" className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none" />
            <button type="submit" disabled={!input.trim() || busy} className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Send</button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition active:scale-95 ${listening ? "animate-pulse bg-red-500 text-white" : "brand-grad text-white"}`}
        title="Talk to the assistant (works on every page)"
      >
        {listening ? "■" : "🎙"}
      </button>
      {voiceOk && !open && <span className="rounded-full bg-zinc-900/90 px-2 py-0.5 text-[10px] text-zinc-400">🎙 Talk</span>}
    </div>
  );
}
