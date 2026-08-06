"use client";

import { useState, useEffect, useCallback } from "react";
import { getRevenueStats, allStudioFeedback, setStudioFeedbackStatus, type StudioFeedback } from "@/lib/db";
import type { RevenueStats } from "@/lib/types";

export default function AdminPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [feedbackList, setFeedbackList] = useState<StudioFeedback[]>([]);
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState<string>("all");

  const loadData = useCallback(() => {
    setStats(getRevenueStats());
    setFeedbackList(allStudioFeedback());
  }, []);

  useEffect(() => {
    if (authed) {
      loadData();
    }
  }, [authed, loadData]);

  const handleStatusChange = (id: string, status: "new" | "planned" | "done" | "rejected") => {
    setStudioFeedbackStatus(id, status);
    loadData();
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 text-center">
          <div className="brand-grad mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black text-white">
            E
          </div>
          <h1 className="mb-2 text-xl font-extrabold">EMY Studio Admin</h1>
          <p className="mb-5 text-xs text-zinc-500">Enter admin password to access pipeline & feedback management.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pass === "Emy1912@") setAuthed(true);
              else alert("Invalid password");
            }}
          >
            <input
              type="password"
              placeholder="Admin Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mb-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-white focus:border-fuchsia-500 focus:outline-none"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-fuchsia-600 py-2.5 text-sm font-bold text-white transition hover:bg-fuchsia-500"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredFeedback = feedbackFilter === "all"
    ? feedbackList
    : feedbackList.filter((f) => f.status === feedbackFilter);

  return (
    <div className="min-h-screen bg-black p-6 sm:p-8 text-white space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Admin & Feedback Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">Manage studio performance, revenue pipeline, and user suggestions.</p>
        </div>
        <button
          onClick={loadData}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white"
        >
          ↻ Refresh Data
        </button>
      </div>

      {/* Financial Pipeline Overview */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Earned</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">
            AED {(stats?.totalEarned ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Commission Due</p>
          <p className="mt-2 text-3xl font-black text-blue-400">
            AED {(stats?.totalCommission ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Collection</p>
          <p className="mt-2 text-3xl font-black text-amber-400">
            AED {(stats?.pendingAed ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gigs Tracked</p>
          <p className="mt-2 text-3xl font-black text-white">
            {stats?.gigCount ?? 0}
          </p>
        </div>
      </div>

      {/* Suggestion Feedback Queue */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">User Suggestions & Feature Requests</h2>
            <p className="text-xs text-zinc-500">Manage items submitted through the studio feedback box.</p>
          </div>
          <div className="flex gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 p-1">
            {["all", "new", "planned", "done", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => setFeedbackFilter(st)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${
                  feedbackFilter === st ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredFeedback.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-600">
            No feedback items found in this status category.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFeedback.map((item) => (
              <div key={item.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-100">{item.text || item.message}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                      {item.category && <span className="rounded-full bg-zinc-800 px-2 py-0.5 capitalize">{item.category}</span>}
                      {item.priority && <span className={`font-semibold ${item.priority === "high" ? "text-red-400" : "text-zinc-400"}`}>Priority: {item.priority}</span>}
                      <span>{new Date(item.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                    {item.plan && (
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-800">
                        📋 <strong>Plan:</strong> {item.plan}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(item.id, "planned")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        item.status === "planned" ? "bg-amber-500 text-black font-bold" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Planned
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, "done")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        item.status === "done" ? "bg-emerald-500 text-black font-bold" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Done ✓
                    </button>
                    <button
                      onClick={() => handleStatusChange(item.id, "rejected")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                        item.status === "rejected" ? "bg-red-500 text-white font-bold" : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
