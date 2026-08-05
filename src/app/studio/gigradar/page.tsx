"use client";

import { useEffect, useState } from "react";
import { getGigs, updateGigStage } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/outreach";
import { Gig, GigStage } from "@/lib/types";

export default function GigRadarPage() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filter, setFilter] = useState<GigStage | "all">("all");

  useEffect(() => {
    setGigs(getGigs());
  }, []);

  const refresh = () => {
    setGigs(getGigs());
  };

  const handleStageChange = (id: string, stage: GigStage) => {
    updateGigStage(id, stage);
    refresh();
  };

  const STAGES: GigStage[] = [
    "new",
    "contacted",
    "negotiating",
    "confirmed",
    "paid",
  ];

  const visible =
    filter === "all" ? gigs : gigs.filter((g) => g.stage === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-black">🎯 GIG RADAR</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Dubai Venue Tracking & Booking CRM
        </p>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-full px-4 py-1 text-xs font-bold ${
              filter === "all"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400"
            }`}
          >
            ALL
          </button>

          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-4 py-1 text-xs font-bold uppercase ${
                filter === s
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Gig Cards */}
        <div className="space-y-4">
          {visible.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-700 p-10 text-center text-zinc-500">
              No gigs in this stage.
            </div>
          )}

          {visible.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-blue-500">
                    {g.sourceKind}
                  </p>
                  <h3 className="text-lg font-bold">{g.title}</h3>
                </div>
                <p className="text-xs text-zinc-500">
                  {new Date(g.postedAt).toLocaleDateString()}
                </p>
              </div>

              <p className="mb-4 text-sm text-zinc-400">{g.body}</p>

              <div className="flex flex-wrap gap-2">
                <a
                  href={generateWhatsAppLink(g)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-500"
                >
                  WhatsApp Pitch
                </a>

                <select
                  value={g.stage}
                  onChange={(e) =>
                    handleStageChange(g.id, e.target.value as GigStage)
                  }
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-white"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                  <option value="archived">ARCHIVED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}