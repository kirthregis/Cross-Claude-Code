"use client";

import { useState, useEffect, useCallback } from "react";
import { getGigs, updateGigStage } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/outreach";
import { Gig, GigStage } from "@/lib/types";
import {
  getRegistry,
  saveRegistry,
  type CountryConfig,
  type FeedConfig,
} from "@/lib/sources/registry";

const STAGES: GigStage[] = ["new", "contacted", "negotiating", "confirmed", "paid"];

type Tab = "radar" | "sources" | "add";

export default function GigRadarPage() {
  const [tab, setTab] = useState<Tab>("radar");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filter, setFilter] = useState<GigStage | "all">("all");
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualResult, setManualResult] = useState<string | null>(null);
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryFlag, setNewCountryFlag] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");

  useEffect(() => {
    setGigs(getGigs());
    setCountries(getRegistry());
  }, []);

  const refresh = useCallback(() => setGigs(getGigs()), []);

  const handleStageChange = (id: string, stage: GigStage) => {
    updateGigStage(id, stage);
    refresh();
  };

  const triggerSweep = async () => {
    setSweeping(true);
    setSweepResult(null);
    try {
      const res = await fetch("/api/sweep");
      const data = await res.json();
      setSweepResult(`Found ${data.found} leads. ${data.newGigs} new gigs added. ${data.alerted} alerts sent.`);
      refresh();
    } catch {
      setSweepResult("Sweep failed — check your internet connection.");
    } finally {
      setSweeping(false);
    }
  };

  const submitManualLead = async () => {
    if (!manualText.trim()) return;
    setManualSubmitting(true);
    setManualResult(null);
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: manualText.slice(0, 80),
          text: manualText,
          sourceName: "Manual Entry",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setManualResult(`✅ Added ${data.newGigs} new gig${data.newGigs !== 1 ? "s" : ""} from your lead.`);
        setManualText("");
        refresh();
      } else {
        setManualResult("Could not process this lead. Try adding more detail.");
      }
    } catch {
      setManualResult("Submission failed — check your connection.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const toggleCountry = (code: string) => {
    const updated = countries.map(c =>
      c.code === code ? { ...c, active: !c.active } : c
    );
    setCountries(updated);
    saveRegistry(updated);
  };

  const toggleFeed = (countryCode: string, feedId: string) => {
    const updated = countries.map(c =>
      c.code === countryCode
        ? { ...c, feeds: c.feeds.map(f => f.id === feedId ? { ...f, active: !f.active } : f) }
        : c
    );
    setCountries(updated);
    saveRegistry(updated);
  };

  const addCountry = () => {
    if (!newCountryName || !newCountryCode) return;
    const newCountry: CountryConfig = {
      code: newCountryCode.toUpperCase(),
      name: newCountryName,
      flag: newCountryFlag || "🌍",
      currency: "USD",
      priority: countries.length + 1,
      active: true,
      feeds: newFeedUrl ? [{
        id: `${newCountryCode.toLowerCase()}-feed-1`,
        label: newFeedLabel || newCountryName,
        url: newFeedUrl,
        kind: "rss",
        active: true,
      }] : [],
    };
    const updated = [...countries, newCountry];
    setCountries(updated);
    saveRegistry(updated);
    setNewCountryName("");
    setNewCountryCode("");
    setNewCountryFlag("");
    setNewFeedUrl("");
    setNewFeedLabel("");
  };

  const addFeedToCountry = (code: string, url: string, label: string) => {
    const newFeed: FeedConfig = {
      id: `${code.toLowerCase()}-feed-${Date.now()}`,
      label: label || url,
      url,
      kind: "rss",
      active: true,
    };
    const updated = countries.map(c =>
      c.code === code ? { ...c, feeds: [...c.feeds, newFeed] } : c
    );
    setCountries(updated);
    saveRegistry(updated);
  };

  const visible = filter === "all" ? gigs : gigs.filter(g => g.stage === filter);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-4 pb-24">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-3xl font-black tracking-tighter">🎯 GIG RADAR</h1>
          <p className="text-zinc-500 text-sm mt-1">UAE & Global DJ Booking Intelligence</p>
        </header>

        {/* Main tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          {([
            { id: "radar", label: "🎯 Radar" },
            { id: "add", label: "➕ Add Lead" },
            { id: "sources", label: "🌍 Countries & Sources" },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                tab === t.id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            onClick={() => void triggerSweep()}
            disabled={sweeping}
            className="ml-auto px-4 py-2 rounded-xl text-sm font-bold bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-50 transition"
          >
            {sweeping ? "⏳ Sweeping..." : "🔄 Sweep Now"}
          </button>
        </div>

        {sweepResult && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">
            {sweepResult}
          </div>
        )}

        {/* RADAR TAB */}
        {tab === "radar" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                  filter === "all" ? "bg-white text-black" : "bg-zinc-900 text-zinc-400"
                }`}
              >
                ALL ({gigs.length})
              </button>
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition ${
                    filter === s ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-400"
                  }`}
                >
                  {s} ({gigs.filter(g => g.stage === s).length})
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
                <p className="text-zinc-500 text-sm">No gigs in this stage.</p>
                <p className="text-zinc-600 text-xs mt-2">
                  Press "Sweep Now" to pull from UAE feeds, or use "Add Lead" to paste one manually.
                </p>
              </div>
            ) : (
              visible.map(g => (
                <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">
                          {g.sourceKind}
                        </span>
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(g.postedAt).toLocaleDateString("en-GB")}
                        </span>
                        {g.score > 0 && (
                          <>
                            <span className="text-[10px] text-zinc-600">•</span>
                            <span className={`text-[10px] font-bold ${
                              g.score >= 70 ? "text-green-400" :
                              g.score >= 50 ? "text-yellow-400" : "text-zinc-500"
                            }`}>
                              Score: {g.score}
                            </span>
                          </>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight">{g.title}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2">{g.body}</p>
                      {g.sourceUrl && (
                        <a
                          href={g.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-400 hover:text-blue-300"
                        >
                          View original →
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={generateWhatsAppLink(g)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 transition"
                      >
                        💬 Pitch
                      </a>
                      <select
                        value={g.stage}
                        onChange={e => handleStageChange(g.id, e.target.value as GigStage)}
                        className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-white border-none focus:ring-2 focus:ring-blue-500"
                      >
                        {STAGES.map(s => (
                          <option key={s} value={s}>{s.toUpperCase()}</option>
                        ))}
                        <option value="archived">ARCHIVE</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ADD LEAD TAB */}
        {tab === "add" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-bold mb-1">Add a Booking Lead Manually</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Paste anything — a WhatsApp message, Instagram caption, email, website text, or venue name. 
                The system extracts the booking opportunity automatically.
              </p>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                placeholder={`Examples:\n• "White Dubai is looking for DJs for their Saturday nights, DM @whitedubai"\n• Paste a WhatsApp group message about a gig\n• Paste text from a venue website\n• "Atlantis brunch entertainment booking enquiries to events@atlantis.com"`}
                rows={8}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <p className="text-xs text-zinc-600">
                  {manualText.length} characters
                </p>
                <button
                  onClick={() => void submitManualLead()}
                  disabled={manualSubmitting || !manualText.trim()}
                  className="rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition"
                >
                  {manualSubmitting ? "Processing..." : "Extract & Add Gig"}
                </button>
              </div>
              {manualResult && (
                <div className={`mt-3 rounded-xl px-4 py-2 text-sm ${
                  manualResult.startsWith("✅")
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/30 text-red-300"
                }`}>
                  {manualResult}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-bold mb-1">Quick Add — Specific Venues</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Click any venue to instantly create a lead for it.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "White Dubai", "Soho Garden", "BASE Dubai", "Iris Dubai",
                  "Cove Beach", "Zero Gravity", "Nikki Beach", "Drift Beach",
                  "Atlantis The Palm", "Burj Al Arab", "FIVE Palm Jumeirah",
                  "W Dubai", "Waldorf Astoria", "Address Downtown",
                  "Billionaire Dubai", "Toy Room Dubai", "Club Odyssey",
                  "Nobu Dubai", "Coya Dubai", "Zuma Dubai", "Amazonico Dubai",
                  "Azure Beach", "Barasti", "Nasimi Beach",
                ].map(venue => (
                  <button
                    key={venue}
                    onClick={() => {
                      setManualText(`DJ booking opportunity at ${venue}, Dubai. Looking for experienced DJ for events and regular nights. Contact for booking enquiries.`);
                      setTab("add");
                    }}
                    className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:border-fuchsia-500/50 hover:text-white transition"
                  >
                    {venue}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {tab === "sources" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-bold mb-1">Country & Source Manager</h2>
              <p className="text-sm text-zinc-500 mb-4">
                Toggle countries and feeds on/off. Add new countries and their booking feeds.
                UAE is always priority 1.
              </p>

              {countries.map(country => (
                <div key={country.code} className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{country.name}</p>
                        <p className="text-xs text-zinc-500">{country.feeds.length} feeds · Priority {country.priority}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleCountry(country.code)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                        country.active
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                      }`}
                    >
                      {country.active ? "✓ ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {country.feeds.map(feed => (
                      <div key={feed.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-300 truncate">{feed.label}</p>
                          <p className="text-[10px] text-zinc-600 truncate">{feed.url}</p>
                        </div>
                        <button
                          onClick={() => toggleFeed(country.code, feed.id)}
                          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            feed.active
                              ? "bg-blue-500/20 text-blue-300"
                              : "bg-zinc-800 text-zinc-600"
                          }`}
                        >
                          {feed.active ? "ON" : "OFF"}
                        </button>
                      </div>
                    ))}
                  </div>

                  <AddFeedForm
                    onAdd={(url, label) => addFeedToCountry(country.code, url, label)}
                  />
                </div>
              ))}
            </div>

            {/* Add new country */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-bold mb-4">Add New Country</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={newCountryName}
                  onChange={e => setNewCountryName(e.target.value)}
                  placeholder="Country name (e.g. Egypt)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                />
                <input
                  value={newCountryCode}
                  onChange={e => setNewCountryCode(e.target.value)}
                  placeholder="Country code (e.g. EG)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                />
                <input
                  value={newCountryFlag}
                  onChange={e => setNewCountryFlag(e.target.value)}
                  placeholder="Flag emoji (e.g. 🇪🇬)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                />
                <input
                  value={newFeedUrl}
                  onChange={e => setNewFeedUrl(e.target.value)}
                  placeholder="First feed URL (optional RSS/JSON)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                />
                <input
                  value={newFeedLabel}
                  onChange={e => setNewFeedLabel(e.target.value)}
                  placeholder="Feed label (e.g. Cairo Events)"
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
                />
                <button
                  onClick={addCountry}
                  disabled={!newCountryName || !newCountryCode}
                  className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition"
                >
                  Add Country
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddFeedForm({ onAdd }: { onAdd: (url: string, label: string) => void }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-xs text-zinc-600 hover:text-zinc-400 transition"
      >
        + Add feed to this country
      </button>
    );
  }

  return (
    <div className="mt-2 flex gap-2 flex-wrap">
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Feed URL (RSS or JSON)"
        className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
      />
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Label"
        className="w-32 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none"
      />
      <button
        onClick={() => { if (url) { onAdd(url, label); setUrl(""); setLabel(""); setOpen(false); } }}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500"
      >
        Add
      </button>
      <button
        onClick={() => setOpen(false)}
        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400"
      >
        Cancel
      </button>
    </div>
  );
}