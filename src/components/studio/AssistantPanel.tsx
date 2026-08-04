"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AssistantDecision, ChatTurn, Project, ProjectKind } from "@/lib/studio/types";
import { routeCommand, replyForIntent } from "@/lib/studio/assistant";
import { isGeminiConfigured, geminiChat } from "@/lib/studio/gemini";
import { getServerAiStatus, serverTextChat } from "@/lib/studio/server-ai";
import { speak, speechSupported, startListening } from "@/lib/studio/speech";
import { loadSettings, upsertProject } from "@/lib/studio/store";
import { Button, Card } from "./ui";

const QUICK_COMMANDS = ["Create a new mix project", "Master my mix", "Make the cover art", "Build the release pack", "Is it ready?", "What's left to do?"];

function systemPrompt(project?: Project): string {
  const ctx = project
    ? `\nCurrently open project: "${project.meta.name}" (${project.meta.kind}, ${project.meta.genre}). ` +
      `Audio ${project.audio ? `loaded (${project.audio.fileName}, ${Math.floor(project.audio.durationSec / 60)}m)` : "not loaded"}. ` +
      `Mastering ${project.meta.mastered ? "done" : "pending"}. Artwork ${project.meta.artworkDone ? "done" : "pending"}. Release ${project.meta.releaseDone ? "done" : "pending"}.`
    : "";
  return (
    `You are the assistant inside DJ EMY's personal music production studio (she is a professional Afro House DJ in Dubai who releases mixes and tracks on YouTube, Instagram and record labels). ` +
    `Be warm, concise and practical. You know the platform rules cold: loudness target -14 LUFS (YouTube/Spotify), 48 kHz sample rate, cover art 3000x3000, ` +
    `YouTube title max 100 chars, description max 5000 chars, tags max 500 chars total. ` +
    `When she asks to do something in the studio (master, cover art, release pack, check), tell her exactly which tab to open. Keep replies under 120 words.` +
    ctx
  );
}

export function AssistantPanel({
  project,
  onNavigate,
  onCreateProject,
}: {
  project?: Project;
  onNavigate: (path: string) => void;
  onCreateProject?: (name: string, kind: ProjectKind) => void;
}) {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const settings = loadSettings();
  const stopListenRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect speech support after mount so server and client HTML agree
    // (a window-dependent initial value caused a hydration mismatch).
    setVoiceOk(speechSupported());
  }, []);

  useEffect(() => {
    if (project) setMessages(project.chatHistory ?? []);
    else setMessages([]);
  }, [project]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const pushUser = useCallback(
    (text: string, intent?: string) => {
      const turn: ChatTurn = { role: "user", text, at: Date.now(), intent };
      setMessages((m) => [...m, turn]);
      return turn;
    },
    [],
  );

  const pushAssistant = useCallback(
    (text: string, intent?: string) => {
      const turn: ChatTurn = { role: "assistant", text, at: Date.now(), intent };
      setMessages((m) => {
        const next = [...m, turn];
        if (project) {
          upsertProject({ ...project, chatHistory: next.slice(-40) });
        }
        return next;
      });
      speak(text, settings.soundOn, "en-US", settings.voiceGender);
      return turn;
    },
    [project, settings.soundOn],
  );

  const handleDecision = useCallback(
    (d: AssistantDecision) => {
      if (d.action?.type === "navigate") {
        onNavigate(d.action.to);
      } else if (d.action?.type === "createProject") {
        onCreateProject?.(d.action.name, d.action.kind);
      }
    },
    [onNavigate, onCreateProject],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;
      setBusy(true);
      setInput("");
      const intent = routeCommand(text);

      // "create a project called X" → create directly
      if (intent === "create_project" && onCreateProject) {
        const m = text.match(/(?:called|named|for)\s+["']?([^"']+?)["']?\s*$/i);
        if (m && m[1]) {
          const name = m[1].replace(/\.$/, "").trim();
          const kind: ProjectKind = /\b(track|song|single|release)\b/i.test(text) ? "track" : "mix";
          pushUser(text, intent);
          pushAssistant(`Done — created "${name}" (${kind}). Opening it now.`, intent);
          onCreateProject(name, kind);
          return;
        }
      }

      pushUser(text, intent);
      const hasGemini = isGeminiConfigured(settings);
      const serverAi = await getServerAiStatus();
      const canUseAi = hasGemini || serverAi.serverGemini;
      const decision = replyForIntent(intent, {
        project,
        projectCount: 0,
        hasGemini: canUseAi,
      });

      if (decision.intent === "fallback" && canUseAi) {
        try {
          const history = [...messages, { role: "user" as const, text, at: Date.now() }]
            .slice(-8)
            .map((t) => ({ role: t.role === "assistant" ? ("model" as const) : ("user" as const), parts: [{ text: t.text }] }));
          const resText = serverAi.serverGemini
            ? await serverTextChat(systemPrompt(project), history)
            : (await geminiChat({
                key: settings.geminiKey,
                model: settings.geminiTextModel,
                system: systemPrompt(project),
                messages: history,
              })).text;
          pushAssistant(resText, "gemini");
        } catch (e) {
          pushAssistant(`The AI hit a snag: ${e instanceof Error ? e.message : "unknown error"}. Try a command like "master my mix" instead.`, "fallback");
        }
      } else {
        pushAssistant(decision.reply, decision.intent);
        handleDecision(decision);
      }
      setBusy(false);
    },
    [busy, messages, project, settings, pushUser, pushAssistant, handleDecision, onCreateProject],
  );

  const toggleVoice = useCallback(() => {
    if (listening) {
      stopListenRef.current?.();
      setListening(false);
      return;
    }
    const stop = startListening({
      onResult: (t) => {
        void send(t);
      },
      onEnd: () => setListening(false),
      onError: (e) => {
        setListening(false);
        pushAssistant(`I couldn't hear that (${e}) — you can type below instead.`);
      },
    });
    if (stop) {
      stopListenRef.current = stop;
      setListening(true);
    } else {
      pushAssistant("Voice isn't available in this browser — the text box below works exactly the same.");
    }
  }, [listening, send, pushAssistant]);

  useEffect(() => () => stopListenRef.current?.(), []);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-amber-500 text-lg ${listening ? "animate-pulse" : ""}`}>
                {busy ? "…" : "🎧"}
              </div>
              {listening && <span className="absolute -inset-1 -z-10 animate-ping rounded-full bg-fuchsia-500/40" />}
            </div>
            <div>
              <div className="text-sm font-bold">Your Studio Assistant</div>
              <div className="text-[11px] text-zinc-500">
                {listening ? "Listening…" : busy ? "Working…" : voiceOk ? "Say “master my mix” or type below" : "Type below — voice needs Chrome/Safari"}
              </div>
            </div>
          </div>
          {voiceOk && (
            <Button variant={listening ? "danger" : "ghost"} onClick={toggleVoice} className="!px-3">
              {listening ? "■ Stop" : "🎙 Talk"}
            </Button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="max-h-72 space-y-2.5 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length === 0 && (
          <div className="text-[13px] leading-relaxed text-zinc-500">
            Hi — I&apos;m your engineer + designer + release manager in one. Tell me what you need and I&apos;ll set it up:
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_COMMANDS.map((q) => (
                <button key={q} onClick={() => void send(q)} className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-[12px] text-zinc-300 transition hover:border-fuchsia-500/60 hover:text-fuchsia-300">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "user"
                  ? "rounded-br-sm bg-gradient-to-r from-fuchsia-600/80 to-fuchsia-500/80 text-white"
                  : "rounded-bl-sm border border-zinc-800 bg-zinc-800/70 text-zinc-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-1.5 pl-1 text-zinc-500">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:240ms]" />
          </div>
        )}
      </div>

      <div className="border-t border-zinc-800 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={listening ? "Listening…" : "e.g. Master my mix, then make a cover for it"}
            className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
          />
          <Button type="submit" disabled={!input.trim() || busy}>
            Send
          </Button>
        </form>
      </div>
    </Card>
  );
}
