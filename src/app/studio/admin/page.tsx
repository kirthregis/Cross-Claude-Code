"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, SectionLabel } from "@/components/studio/ui";

interface AdminItem {
  id: string;
  clientId: string | null;
  text: string;
  device: string | null;
  category: string | null;
  priority: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  plan: { category?: string; priority?: string; oneLine?: string; plan?: string } | null;
}

const STATUS_ORDER = ["new", "planned", "done", "dismissed"] as const;
const STATUS_LABELS: Record<string, string> = { new: "New", planned: "Planned", done: "Done", dismissed: "Not now" };

function tokenStore() {
  return typeof window !== "undefined" ? window.sessionStorage : null;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [items, setItems] = useState<AdminItem[] | null>(null);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; byCategory: { category: string; c: number }[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(
    async (tok: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/studio/feedback/admin", { headers: { Authorization: `Bearer ${tok}` } });
        const j = await res.json();
        if (!res.ok || !j.ok) {
          setAuthed(false);
          setError(j.error || "Not authorized.");
          return;
        }
        setAuthed(true);
        setItems(j.items ?? []);
        setStats(j.stats ?? null);
      } catch {
        setError("Couldn't load the back end — is the server running?");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const saved = tokenStore()?.getItem("emy-admin-token");
    if (saved) {
      setToken(saved);
      void load(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setStatus = useCallback(
    async (id: string, status: string) => {
      if (!authed) return;
      const tok = tokenStore()?.getItem("emy-admin-token") ?? token;
      const res = await fetch(`/api/studio/feedback/admin/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok}` },
        body: JSON.stringify({ status }),
      });
      const j = await res.json();
      if (j.ok) {
        setItems((prev) => prev?.map((it) => (it.id === id ? { ...it, status } : it)) ?? null);
      }
    },
    [authed, token],
  );

  if (!authed) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10">
        <Card className="p-6">
          <SectionLabel>Developer back end</SectionLabel>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            This page shows every improvement suggestion from the app. Enter the admin token (set as{" "}
            <span className="font-mono text-zinc-300">STUDIO_ADMIN_TOKEN</span> in the app environment) to unlock it.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              tokenStore()?.setItem("emy-admin-token", token);
              void load(token);
            }}
          >
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none"
            />
            <Button type="submit" disabled={!token.trim() || loading}>
              {loading ? "…" : "Unlock"}
            </Button>
          </form>
          {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</div>}
        </Card>
        <Link href="/studio" className="block text-center text-xs text-zinc-500 hover:text-zinc-300">← Back to studio</Link>
      </div>
    );
  }

  const filtered = items?.filter((it) => filter === "all" || it.status === filter) ?? [];
  const counts = (s: string) => items?.filter((it) => it.status === s).length ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Studio suggestions — back end</h1>
          <p className="mt-1 text-xs text-zinc-500">Everything the artist has suggested, with the AI implementation plan. Only reachable with the admin token.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => void load(token)} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              tokenStore()?.removeItem("emy-admin-token");
              setAuthed(false);
              setToken("");
            }}
          >
            Lock
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Stat label="Total" value={String(stats.total)} />
          {STATUS_ORDER.map((s) => (
            <Stat key={s} label={STATUS_LABELS[s]} value={String(stats.byStatus[s] ?? 0)} accent={s === "new" ? counts("new") > 0 : false} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {["all", ...STATUS_ORDER].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === s ? "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/50" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            {s === "all" ? `All (${items?.length ?? 0})` : `${STATUS_LABELS[s]} (${counts(s)})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-center text-xs text-zinc-500">No suggestions here yet — the artist ideas will land in this list as soon as she sends them.</Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((it) => (
            <Card key={it.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-500">#{it.id.slice(0, 6)}</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold capitalize text-zinc-300">{it.category ?? "other"}</span>
                    {it.priority && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${it.priority === "high" ? "bg-red-500/15 text-red-300" : it.priority === "medium" ? "bg-amber-500/15 text-amber-300" : "bg-zinc-800 text-zinc-400"}`}>
                        {it.priority}
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-600">{new Date(it.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-100">{it.text}</p>
                  {it.device && <p className="mt-1 text-[11px] text-zinc-600">{it.device}</p>}
                  {it.plan?.plan && (
                    <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-fuchsia-400">AI plan</div>
                      <div className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">{it.plan.plan}</div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  {(["planned", "done", "dismissed"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => void setStatus(it.id, s)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        it.status === s ? "bg-fuchsia-500/25 text-fuchsia-200 ring-1 ring-fuchsia-500/60" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-3 ${accent ? "border-fuchsia-500/40 bg-fuchsia-500/10" : "border-zinc-800 bg-zinc-900/60"}`}>
      <div className="font-mono text-xl font-extrabold text-white">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
    </div>
  );
}
