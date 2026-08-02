"use client";

import useSWRLike from "@/lib/useFetch";
import { GigCard } from "@/components/GigCard";
import { useState } from "react";
import type { Gig, PriceQuote } from "@/lib/types";
import type { Scored } from "@/lib/score";

interface Row extends Gig { scored: Scored; quote: PriceQuote }

export default function Dashboard() {
  const { data, loading, refresh } = useSWRLike<{
    stats: { total: number; byStage: { stage: string; c: number }[]; lastSweep?: { finished_at: string; new_gigs: number } };
    gigs: Row[];
  }>("/api/gigs", 15000);

  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function addLead() {
    if (!paste.trim()) return;
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paste, title: paste.slice(0, 60) }),
      });
      const j = await res.json();
      setMsg(j.duplicate ? "Already tracked — no duplicate created." : "Lead added and scored.");
      setPaste("");
      refresh();
    } catch { setMsg("Failed to add."); }
    setBusy(false);
  }

  async function runSweep() {
    setBusy(true);
    await fetch("/api/sweep").catch(() => {});
    refresh();
    setBusy(false);
  }

  const gigs = data?.gigs ?? [];
  const live = gigs.filter((g) => !["lost", "paid"].includes(g.stage));
  const urgent = live.filter((g) => g.scored.tier === "urgent");
  const strong = live.filter((g) => g.scored.tier === "high");
  const rest = live.filter((g) => !["urgent", "high"].includes(g.scored.tier));

  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <header className="mb-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gig<span className="text-indigo-400">Radar</span>
          </h1>
          <p className="text-xs text-zinc-500">DJ Emy · Dubai</p>
        </div>
        <div className="text-right text-[11px] text-zinc-500">
          <div>{data?.stats.total ?? 0} tracked</div>
          {data?.stats.lastSweep && (
            <div>swept {new Date(data.stats.lastSweep.finished_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
          )}
        </div>
      </header>

      <div className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Paste a gig — a WhatsApp message, an Instagram caption, an email. It gets parsed, priced and scored instantly."
          className="w-full resize-none rounded-lg bg-zinc-950 p-3 text-sm outline-none ring-zinc-700 placeholder:text-zinc-600 focus:ring-1"
          rows={3}
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={addLead} disabled={busy || !paste.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Add lead
          </button>
          <button onClick={runSweep} disabled={busy} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40">
            Sweep sources
          </button>
          {msg && <span className="text-xs text-zinc-400">{msg}</span>}
        </div>
      </div>

      {loading && !data && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loading && !live.length && (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-sm text-zinc-400">No gigs yet.</p>
          <p className="mt-1 text-xs text-zinc-600">
            Paste one above, or run <code className="text-zinc-400">npm run seed</code> to see the pipeline with sample Dubai leads.
          </p>
        </div>
      )}

      <Section title="Act now" gigs={urgent} accent="text-rose-400" />
      <Section title="Strong leads" gigs={strong} accent="text-amber-400" />
      <Section title="Everything else" gigs={rest} accent="text-zinc-400" />

      <footer className="mt-10 border-t border-zinc-900 pt-4 text-center text-[11px] text-zinc-600">
        <a href="/sources" className="underline hover:text-zinc-400">Source status &amp; setup</a>
      </footer>
    </main>
  );
}

function Section({ title, gigs, accent }: { title: string; gigs: Row[]; accent: string }) {
  if (!gigs.length) return null;
  return (
    <section className="mb-6">
      <h2 className={`mb-2 text-xs font-bold uppercase tracking-widest ${accent}`}>
        {title} <span className="text-zinc-600">({gigs.length})</span>
      </h2>
      <div className="space-y-2">
        {gigs.map((g) => <GigCard key={g.id} gig={g} scored={g.scored} quote={g.quote} />)}
      </div>
    </section>
  );
}
