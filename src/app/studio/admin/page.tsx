"use client";

import { useState, useEffect } from "react";
import { getRevenueStats } from "@/lib/db";
import { RevenueStats } from "@/lib/types";

export default function AdminPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (authed) {
      setStats(getRevenueStats());
    }
  }, [authed]);

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
        <h1 className="mb-6 text-2xl font-black">EMY Studio Admin</h1>
        <input
          type="password"
          placeholder="Enter Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="mb-4 w-64 rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-white"
        />
        <button
          onClick={() => {
            if (pass === "Emy1912@") setAuthed(true);
            else alert("Wrong password");
          }}
          className="rounded-lg bg-blue-600 px-6 py-2 font-bold hover:bg-blue-500"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <h1 className="mb-8 text-3xl font-black">FINANCIAL DASHBOARD</h1>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Total Earned</p>
          <p className="text-3xl font-bold text-green-400">
            {stats?.totalEarned ?? 0} AED
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Commission Due</p>
          <p className="text-3xl font-bold text-blue-400">
            {stats?.totalCommission ?? 0} AED
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Pending Collection</p>
          <p className="text-3xl font-bold text-yellow-400">
            {stats?.pendingAed ?? 0} AED
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="text-sm text-zinc-500">Gigs Tracked</p>
          <p className="text-3xl font-bold">
            {stats?.gigCount ?? 0}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-zinc-800 px-4 py-2 hover:bg-zinc-700"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  );
}