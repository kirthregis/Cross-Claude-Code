"use client";

import useSWRLike from "@/lib/useFetch";
import { GigCard } from "@/components/GigCard";
import { useState } from "react";
import Link from "next/link";
import type { Gig, PriceQuote } from "@/lib/types";
import type { Scored } from "@/lib/score";

interface Row extends Gig { scored: Scored; quote: PriceQuote }

export default function Dashboard() {
  const { data, loading, refresh } = useSWRLike<{
    stats: { total: number; byStage: { stage: string; c: number }[]; lastSweep?: { finished_at: string; new_gigs: number } };
    gigs: Row[];
  }>("/api/gigs", 15000);

  const { data: digest } = useSWRLike<{ count: number }>("/api/digest", 60000);
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
            Gig<span className="text-red-500">Radar</span>
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

      <HowToGuide />

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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Add lead
          </button>
          <button onClick={runSweep} disabled={busy} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm disabled:opacity-40">
            Sweep sources
          </button>
          {msg && <span className="text-xs text-zinc-400">{msg}</span>}
        </div>
      </div>

      {!!digest?.count && (
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-xs text-zinc-400">
          🌙 <strong className="text-zinc-200">{digest.count}</strong> gig{digest.count > 1 ? "s" : ""} held
          from overnight — sent as one briefing at 09:00, or{" "}
          <button
            onClick={async () => { await fetch("/api/digest", { method: "POST" }); refresh(); }}
            className="underline hover:text-white"
          >send now</button>.
        </div>
      )}

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
        <a href="/profile" className="underline hover:text-zinc-400">Artist profile &amp; rates</a>
        <span className="mx-2 text-zinc-700">·</span>
        <a href="/sources" className="underline hover:text-zinc-400">Source status &amp; setup</a>
        <span className="mx-2 text-zinc-700">·</span>
        <a href="/admin/feedback" className="underline hover:text-zinc-400">Suggestions</a>
      </footer>
    </main>
  );
}

/** "What GigRadar does + how to do it" — the front-facing guide Emy sees first. */
function HowToGuide() {
  const [open, setOpen] = useState(false);
  return (
    <section className="mb-5 overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900/70 to-zinc-900/30">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <h2 className="text-sm font-bold text-white">How to use GigRadar</h2>
          <p className="text-[11px] text-zinc-500">Find it first, price it, pitch it, book it — all from your phone.</p>
        </div>
        <span className="text-lg text-zinc-400">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-zinc-800/70 px-4 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white">{s.n}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">{s.what}</span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-zinc-200">{s.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">{s.how}</p>
                <p className="mt-1.5 text-[11px] text-zinc-600"><span className="text-zinc-500">Tip:</span> {s.tip}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 text-[11px] leading-relaxed text-zinc-400">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Not sure where something is?</p>
            The top bar takes you everywhere: <Link href="/gigs" className="text-red-400 underline">Gigs</Link> (this list) ·
            <Link href="/profile" className="text-red-400 underline"> Profile</Link> (rates, EVG details, documents) ·
            <Link href="/customize" className="text-red-400 underline"> Studio</Link> (what it hunts, quiet hours, looks, artwork) ·
            <Link href="/sources" className="text-red-400 underline"> Sources</Link> (alerts &amp; feeds).
          </div>

          <SuggestImprovement />
        </div>
      )}
    </section>
  );
}

const STEPS = [
  {
    n: 1, what: "Spot it", title: "GigRadar finds the gig for you",
    how: "It watches venues, promoters, the web and your inbox around the clock. The moment something worth your time appears, it scores it and — if it's good — alerts your phone.",
    tip: "Set up alerts in Sources. The web scan works with zero setup.",
  },
  {
    n: 2, what: "Price it", title: "Know exactly what to charge",
    how: "Every gig shows an opening ask, a realistic target, and a never-go-below number, built on the venue, night, slot and urgency — so you never leave money on the table.",
    tip: "Enter your real rates in Profile to make quotes accurate.",
  },
  {
    n: 3, what: "Pitch it", title: "Send a pitch in one tap",
    how: "Each gig has a ready-to-send pitch for WhatsApp, Instagram or email — already addressed to the right contact, in the right voice.",
    tip: "Copy it and hit send, or open WhatsApp directly from the gig page.",
  },
  {
    n: 4, what: "Share it", title: "Hand the booker a live page",
    how: "Copy the booking link from any gig. The booker opens a clean page with her EPK, the date and a 'Request this booking' button that lands in EVG's inbox.",
    tip: "A link beats an attachment — it always looks pro.",
  },
  {
    n: 5, what: "Book it", title: "Paperwork generated instantly",
    how: "The moment it's agreed, generate the contract, tech rider, runsheet, invoice and press pack — all from the agreed fee.",
    tip: "Fill the EVG legal name, licence and bank in Profile so contracts are valid.",
  },
  {
    n: 6, what: "Tune it", title: "Make it yours in Studio",
    how: "Change what it hunts, quiet hours, how loud alerts are, the look, the pitch sign-off, and upload her photos/videos as artwork. No code needed.",
    tip: "It's all in Studio — changes apply instantly.",
  },
];

/** "Suggest an improvement" — Emy's ideas land in the backend inbox. */
function SuggestImprovement() {
  const [msg, setMsg] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (msg.trim().length < 3) return;
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg.trim(), contact: contact.trim() || undefined }),
      });
      setMsg(""); setContact(""); setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">💡 Suggest an improvement</p>
      <p className="mt-1 text-[11px] text-zinc-500">
        Want GigRadar to do something new? Tell me and it gets added to the build list.
      </p>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        placeholder="e.g. 'Alert me when a venue I've played before is booking again'…"
        rows={2}
        className="mt-2 w-full resize-none rounded-lg bg-zinc-900 p-2.5 text-xs outline-none ring-zinc-700 placeholder:text-zinc-600 focus:ring-1"
      />
      <input
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        placeholder="Your number / WhatsApp (optional)"
        className="mt-2 w-full rounded-lg bg-zinc-900 p-2.5 text-xs outline-none ring-zinc-700 placeholder:text-zinc-600 focus:ring-1"
      />
      <div className="mt-2 flex items-center gap-2">
        <button onClick={submit} disabled={busy || msg.trim().length < 3}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-[11px] font-medium disabled:opacity-40">
          {busy ? "Sending…" : "Send suggestion"}
        </button>
        {done && <span className="text-[11px] text-emerald-400">Thanks — noted ✓</span>}
      </div>
    </div>
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
