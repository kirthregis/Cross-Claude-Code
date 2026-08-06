"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startListening, speechSupported } from "@/lib/studio/speech";
import { Button, Card, SectionLabel } from "./ui";

interface FeedbackItem {
  id: string;
  text: string;
  category: string | null;
  priority: string | null;
  status: string;
  createdAt: string;
  plan: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  new: { label: "Received", cls: "bg-zinc-800 text-zinc-300" },
  planned: { label: "Planned", cls: "bg-amber-500/15 text-amber-300" },
  done: { label: "Done ✓", cls: "bg-emerald-500/15 text-emerald-300" },
  dismissed: { label: "Not now", cls: "bg-zinc-800 text-zinc-500" },
};

function getClientId(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "emy-studio-client-id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `anon-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export function FeedbackBox() {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState<{ id: string; text: string; category: string } | null>(null);
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceOk, setVoiceOk] = useState(false);
  const voiceRef = useRef(false);

  useEffect(() => {
    // Detect speech support after mount (avoids hydration mismatch).
    voiceRef.current = speechSupported();
    setVoiceOk(voiceRef.current);
  }, []);

  const load = useCallback(() => {
    const clientId = getClientId();
    fetch(`/api/studio/feedback?clientId=${encodeURIComponent(clientId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setItems(j.items ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const submit = useCallback(async (raw: string) => {
    const t = raw.trim();
    if (!t || t.length < 3) return;
    setSending(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch("/api/studio/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: t,
          clientId: getClientId(),
          device: typeof navigator !== "undefined" ? `${navigator.platform || ""} · ${screen.width}x${screen.height}` : "",
        }),
      });
      const j = await res.json();
      if (!j.ok) {
        setError(j.error || "Couldn't send that — try again.");
        return;
      }
      setText("");
      setReply({ id: j.id, text: j.reply, category: j.category });
      load();
    } catch {
      setError("Couldn't reach the suggestion service — check your internet and try again.");
    } finally {
      setSending(false);
    }
  }, [load]);

  const toggleVoice = useCallback(() => {
    if (listening) {
      setListening(false);
      return;
    }
    const stop = startListening({
      onResult: (t) => {
        setText((prev) => (prev ? `${prev} ${t}` : t));
      },
      onEnd: () => setListening(false),
      onError: () => setListening(false),
    });
    if (stop) setListening(true);
  }, [listening]);

  return (
    <Card id="improve" className="scroll-mt-24 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <SectionLabel>Make EMY Studio better</SectionLabel>
          <p className="mt-1 text-xs text-zinc-500">
            Something you wish it did? Say it here — the app logs it, plans the change, and you can watch it go from{" "}
            <span className="text-zinc-300">Received</span> → <span className="text-amber-300">Planned</span> →{" "}
            <span className="text-emerald-300">Done</span>. The developer sees every suggestion.
          </p>
        </div>
        {voiceOk && (
          <Button variant={listening ? "danger" : "ghost"} onClick={toggleVoice} className="!px-3">
            {listening ? "■ Stop" : "🎙 Talk"}
          </Button>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder={listening ? "Listening…" : "e.g. Can the app also export a version for Instagram Reels?  ·  I'd love a reminder before label deadlines"}
          className="min-w-0 flex-1 resize-y rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-fuchsia-500 focus:outline-none"
        />
        <Button onClick={() => void submit(text)} disabled={sending || text.trim().length < 3} className="self-end">
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>

      {error && <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}

      {reply && (
        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[13px] leading-relaxed text-emerald-200">
          <span className="font-bold">💡 Suggestion #{reply.id.slice(0, 6)} logged.</span> {reply.text}
        </div>
      )}

      {items && items.length > 0 && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Your suggestions</div>
          <div className="mt-2 space-y-1.5">
            {items.slice(0, 5).map((it) => (
              <div key={it.id} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] text-zinc-200">{it.text}</div>
                  <div className="mt-0.5 text-[11px] text-zinc-600">
                    {it.category ? <span className="capitalize">{it.category}</span> : null}
                    {it.plan ? <span> · {it.plan}</span> : null}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_LABELS[it.status]?.cls ?? STATUS_LABELS.new.cls}`}>
                  {STATUS_LABELS[it.status]?.label ?? it.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
