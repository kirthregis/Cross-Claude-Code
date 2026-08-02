"use client";

import useFetch from "@/lib/useFetch";
import Link from "next/link";

export default function SourcesPage() {
  type Row = { id: string; label: string; setup: string; configured: boolean };
  const { data } = useFetch<{ sources: Row[]; channels: Row[] }>("/api/sources");
  return (
    <main className="mx-auto max-w-2xl px-4 pb-24 pt-6">
      <Link href="/" className="text-xs text-red-500">← Dashboard</Link>
      <h1 className="mb-1 mt-3 text-xl font-bold">Alerts &amp; sources</h1>
      <h2 className="mb-2 mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500">
        Where alerts are sent
      </h2>
      <div className="mb-6 space-y-3">
        {data?.channels?.map((c) => (
          <div key={c.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{c.label}</h3>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${c.configured ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700/40 text-zinc-400"}`}>
                {c.configured ? "LIVE" : "NOT SET UP"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{c.setup}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
        Where gigs are found
      </h2>
      <p className="mb-5 text-xs text-zinc-500">
        Each feed switches on with environment variables. Anything not configured is simply skipped — the rest keep running.
      </p>
      <div className="space-y-3">
        {data?.sources.map((s) => (
          <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{s.label}</h2>
              <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${s.configured ? "bg-emerald-500/20 text-emerald-300" : "bg-zinc-700/40 text-zinc-400"}`}>
                {s.configured ? "LIVE" : "NOT SET UP"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">{s.setup}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
