"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, saveProfile } from "@/lib/profile-store";
import type { ArtistProfile } from "@/lib/artist";
import type { VenueTier } from "@/lib/types";

const TIERS: VenueTier[] = [
  "superclub", "beach_club", "festival", "brand_activation", "hotel", "private", "other"
];

export default function ProfilePage() {
  const [profile, setProfileState] = useState<ArtistProfile>(() => getProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfileState(getProfile());
  }, []);

  const handleSave = () => {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link href="/studio" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Studio
          </Link>
          {saved && <span className="text-xs font-semibold text-emerald-400">✓ Profile Saved</span>}
        </div>
        <h1 className="mt-4 text-3xl font-black">{profile.name} — Profile & Representation</h1>
        <p className="mt-1 text-sm text-zinc-400">{profile.tagline}</p>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 font-bold text-zinc-200">Management & Representation</h2>
            <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
              <div>
                <span className="text-xs uppercase text-zinc-500">Company</span>
                <p className="font-semibold text-white">{profile.management.company}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-zinc-500">Trade Licence</span>
                <p className="font-semibold text-white">{profile.management.tradeLicenceNo}</p>
              </div>
              <div>
                <span className="text-xs uppercase text-zinc-500">Contact</span>
                <p className="font-semibold text-white">{profile.management.contactName} ({profile.management.contactRole})</p>
              </div>
              <div>
                <span className="text-xs uppercase text-zinc-500">Phone</span>
                <p className="font-semibold text-white">{profile.management.phone}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 font-bold text-zinc-200">Venue Base Rates</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TIERS.map((tier) => (
                <div key={tier} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <span className="text-xs uppercase text-zinc-500">{tier.replace("_", " ")}</span>
                  <p className="text-sm font-bold text-emerald-400">
                    AED {profile.baseRatesAed[tier]?.toLocaleString() ?? "N/A"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black hover:bg-zinc-200 transition"
            >
              Save Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
