"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArtistProfile } from "@/lib/artist";
import type { VenueTier } from "@/lib/types";

const TIERS: VenueTier[] = [
  "superclub", "beach_club", "festival", "brand_activation", "hotel", "private", "other"
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<ArtistProfile>>({});

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/studio" className="text-sm text-zinc-400 hover:text-white">
          ← Back to Studio
        </Link>
        <h1 className="mt-4 text-3xl font-black">Artist Profile</h1>
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 font-bold">Venue Preferences</h2>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((tier) => (
                <span
                  key={tier}
                  className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                >
                  {tier.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}