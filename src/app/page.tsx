"use client";

import { useState } from "react";
import { GigCard } from "@/components/GigCard";
import type { Gig } from "@/lib/types";

export default function Home() {
  const [gigs] = useState<Gig[]>([]);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-black">EMY STUDIO</h1>
        <p className="mb-8 text-zinc-500">
          Your AI-powered DJ career management system.
        </p>

        {gigs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
            No gigs yet. Head to{" "}
            <a href="/studio/gigradar" className="text-blue-400 underline">
              GigRadar
            </a>{" "}
            to start tracking.
          </div>
        ) : (
          <div className="space-y-4">
            {gigs.map((g) => (
              <GigCard key={g.id} gig={g} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}