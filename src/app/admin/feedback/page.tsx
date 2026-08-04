"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Suggestion {
  id: string;
  message: string;
  category?: string;
  contact?: string;
  status: "new" | "in_progress" | "done";
  createdAt: string;
}

const STATUS_STYLE: Record<Suggestion["status"], string> = {
  new: "bg-amber-500/20 text-amber-300",
  in_progress: "bg-blue-500/20 text-blue-300",
  done: "bg-emerald-500/20 text-emerald-300",
};

/** Admin-only inbox: every improvement Emy has suggested. Locked with ADMIN_KEY. */
export default function AdminFeedbackPage() {
  const [key, setKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [err, setErr] = useState("");

  async function load(k: string) {
    const res = await fetch("/api/feedback", { headers: k ? { "x-admin-key": k } : {} });
    if (res.status === 401) { setErr("Wrong admin key"); return; }
    if (!res.ok) { setErr("Failed to load"); return; }
    const d = await res.json();
    setItems(d.feedback ?? []);
    setUnlocked(true);
    setErr("");
  }

  useEffect(() => {
    // If ADMIN_KEY is not set server-side, it loads without a key.
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: Suggestion["status"]) {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key ? { "x-admin-key": key } : {}) },
      body: JSON.stringify({ id, status }),
    });
    load(key);
  }

  const counts = {
    new: items.filter((i) => i.status === "new").length,
    in_progress: items.filter((i) => i.status === "in_progress").length,
    done: items.filter((i) => i.status === "done").length,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Link href="/" className="text-xs text-red-500">← Dashboard</Link>
      <h1 className="mb-1 mt-3 text-xl font-bold">Suggestions inbox</h1>
      <p className="mb-4 text-xs text-zinc-500">
        Everything Emy has asked for. <strong>{counts.new}</strong> new · {counts.in_progress} in progress · {counts.done} done.
      </p>

      {!unlocked && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="text-xs text-zinc-400">Enter the admin key to view suggestions (set the <code className="text-zinc-300">ADMIN_KEY</code> env var).</p>
          <div className="mt-2 flex gap-2">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              type="password" placeholder="Admin key"
              className="flex-1 rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600"
            />
            <button onClick={() => load(key)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium">Unlock</button>
          </div>
          {err && <p className="mt-2 text-xs text-rose-400">{err}</p>}
        </div>
      )}

      {unlocked && items.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
          No suggestions yet. Share the app with Emy — anything she asks for lands here.
        </div>
      )}

      <div className="space-y-3">
        {items.map((i) => (
          <div key={i.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-zinc-200">{i.message}</p>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold capitalize ${STATUS_STYLE[i.status]}`}>{i.status}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span>{new Date(i.createdAt).toLocaleString()}</span>
              {i.category && <span>· {i.category}</span>}
              {i.contact && <span>· 📞 {i.contact}</span>}
            </div>
            <div className="mt-3 flex gap-1.5">
              {(["new", "in_progress", "done"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(i.id, s)}
                  className={`rounded px-2 py-1 text-[10px] capitalize ${i.status === s ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
