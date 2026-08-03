"use client";

import Link from "next/link";
import type { Gig, PriceQuote } from "@/lib/types";
import type { Scored } from "@/lib/score";

const TIER_STYLE: Record<string, { bg: string; label: string }> = {
  urgent: { bg: "bg-rose-500/15 border-rose-500/50 urgent-ring", label: "🚨 URGENT" },
  high: { bg: "bg-amber-500/10 border-amber-500/40", label: "🔥 STRONG" },
  normal: { bg: "bg-zinc-800/40 border-zinc-700", label: "🎧 NEW" },
  digest: { bg: "bg-zinc-900/60 border-zinc-800", label: "📋 MAYBE" },
  suppress: { bg: "bg-zinc-900/40 border-zinc-900", label: "· LOW" },
};

export function GigCard({ gig, scored, quote }: { gig: Gig; scored: Scored; quote: PriceQuote }) {
  const st = TIER_STYLE[scored.tier] ?? TIER_STYLE.normal;
  const when = gig.eventDate
    ? new Date(gig.eventDate).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : "Date TBC";
  const daysOut = gig.eventDate
    ? Math.round((new Date(gig.eventDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <Link href={`/gig/${gig.id}`} className={`block rounded-xl border p-4 transition hover:brightness-125 ${st.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-zinc-400">
            <span>{st.label}</span>
            <span className="text-zinc-600">·</span>
            <span>{gig.sourceName}</span>
          </div>
          <h3 className="mt-1 truncate text-base font-semibold text-white">
            {gig.venueName ?? gig.title}
          </h3>
          <p className="mt-0.5 text-xs text-zinc-400">
            {when}
            {daysOut !== null && daysOut >= 0 && daysOut <= 7 && (
              <span className="ml-1 text-rose-400">· in {daysOut}d</span>
            )}
            {gig.area && ` · ${gig.area}`}
            {gig.setLengthMins && ` · ${(gig.setLengthMins / 60).toFixed(1)}h`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-emerald-400">
            {quote.askAed.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500">AED ask</div>
          <div className="mt-1 text-[10px] font-semibold text-zinc-400">{scored.score}/100</div>
        </div>
      </div>

      {gig.budgetStatedAed && (
        <div className={`mt-2 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${
          gig.budgetStatedAed >= quote.targetAed
            ? "bg-emerald-500/20 text-emerald-300"
            : gig.budgetStatedAed >= quote.walkAwayAed
              ? "bg-amber-500/20 text-amber-300"
              : "bg-rose-500/20 text-rose-300"
        }`}>
          They offered AED {gig.budgetStatedAed.toLocaleString()}
        </div>
      )}

      <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{scored.reasons.slice(0, 2).join(" · ")}</p>
    </Link>
  );
}
