"use client";

import { useState, useEffect, useCallback } from "react";
import { getGigs, updateGigStage } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/outreach";
import { Gig, GigStage } from "@/lib/types";
import { getRegistry, saveRegistry, type CountryConfig, type FeedConfig } from "@/lib/sources/registry";
import { UAE_VENUES, generatePitchEmail, getGigRevenue, upsertGigRevenue, totalRevenue, addFollowUp, getDueFollowUps, type GigRevenue, type VenueContact } from "@/lib/studio/gigradar-ai";
import { useSettings } from "@/lib/studio/store";
import { Card, SectionLabel, Button } from "@/components/studio/ui";

const STAGES: GigStage[] = ["new", "contacted", "negotiating", "confirmed", "paid"];
type Tab = "radar" | "venues" | "revenue" | "sources" | "add";

export default function GigRadarPage() {
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("radar");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filter, setFilter] = useState<GigStage | "all">("all");
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const [sweeping, setSweeping] = useState(false);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualResult, setManualResult] = useState<string | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [pitchEmail, setPitchEmail] = useState<string>("");
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [pitchCopied, setPitchCopied] = useState(false);
  const [venueFilter, setVenueFilter] = useState<string>("all");
  const [revenueData, setRevenueData] = useState<GigRevenue[]>([]);
  const [dueFollowUps, setDueFollowUps] = useState(getDueFollowUps());
  const [newCountryName, setNewCountryName] = useState("");
  const [newCountryCode, setNewCountryCode] = useState("");
  const [newCountryFlag, setNewCountryFlag] = useState("");
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedLabel, setNewFeedLabel] = useState("");

  useEffect(() => {
    setGigs(getGigs());
    setCountries(getRegistry());
    setRevenueData(getGigRevenue());
    setDueFollowUps(getDueFollowUps());
  }, []);

  const refresh = useCallback(() => {
    setGigs(getGigs());
    setRevenueData(getGigRevenue());
    setDueFollowUps(getDueFollowUps());
  }, []);

  const handleStageChange = (id: string, stage: GigStage) => {
    updateGigStage(id, stage);
    refresh();
  };

  const triggerSweep = async () => {
    setSweeping(true); setSweepResult(null);
    try {
      const res = await fetch("/api/sweep");
      const data = await res.json();
      const errCount = data.errors?.length ?? 0;
      const srcCount = (data.sources ?? []).filter((s: {found: number}) => s.found > 0).length;
      // Save returned gigs into browser localStorage so they appear in the UI
      if (data.gigs && data.gigs.length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem("emy-gigs-db") || "[]");
          const existingIds = new Set(existing.map((g: {id: string}) => g.id));
          const incoming = (data.gigs as {id: string}[]).filter(g => !existingIds.has(g.id));
          const merged = [...incoming, ...existing].slice(0, 500);
          localStorage.setItem("emy-gigs-db", JSON.stringify(merged));
        } catch {}
      }
      setSweepResult(
        "Scanned " + srcCount + " sources. Found " + data.found + " leads. " +
        data.newGigs + " new gigs added." +
        (data.alerted > 0 ? " " + data.alerted + " alerts sent." : "") +
        (errCount > 0 ? " (" + errCount + " sources offline)" : " All sources OK.")
      );
      refresh();
    } catch { setSweepResult("Sweep failed — check your internet connection."); }
    finally { setSweeping(false); }
  };

  const submitManualLead = async () => {
    if (!manualText.trim()) return;
    setManualSubmitting(true); setManualResult(null);
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: manualText.slice(0, 80), text: manualText, sourceName: "Manual Entry" }),
      });
      const data = await res.json();
      if (data.ok) { setManualResult("✅ Added " + data.newGigs + " gig" + (data.newGigs !== 1 ? "s" : "") + "."); setManualText(""); refresh(); }
      else setManualResult("Could not process this lead. Try adding more detail.");
    } catch { setManualResult("Submission failed."); }
    finally { setManualSubmitting(false); }
  };

  const generatePitch = async (gig?: Gig, venue?: VenueContact) => {
    setGeneratingPitch(true); setPitchEmail("");
    const venueName = venue?.name ?? gig?.title ?? "the venue";
    const venueArea = venue?.area ?? "Dubai";
    const email = await generatePitchEmail({
      venueName, venueArea,
      artistName: settings.artistName,
      genre: settings.defaultGenre,
      instagram: settings.instagram,
      youtubeChannel: settings.youtubeChannel,
      geminiKey: settings.geminiKey,
      geminiModel: settings.geminiTextModel,
    });
    setPitchEmail(email);
    setGeneratingPitch(false);
  };

  const toggleCountry = (code: string) => {
    const updated = countries.map(c => c.code === code ? { ...c, active: !c.active } : c);
    setCountries(updated); saveRegistry(updated);
  };

  const toggleFeed = (countryCode: string, feedId: string) => {
    const updated = countries.map(c => c.code === countryCode ? { ...c, feeds: c.feeds.map(f => f.id === feedId ? { ...f, active: !f.active } : f) } : c);
    setCountries(updated); saveRegistry(updated);
  };

  const addCountry = () => {
    if (!newCountryName || !newCountryCode) return;
    const newCountry: CountryConfig = { code: newCountryCode.toUpperCase(), name: newCountryName, flag: newCountryFlag || "🌍", currency: "USD", priority: countries.length + 1, active: true,
      feeds: newFeedUrl ? [{ id: newCountryCode.toLowerCase() + "-feed-1", label: newFeedLabel || newCountryName, url: newFeedUrl, kind: "rss", active: true }] : [] };
    const updated = [...countries, newCountry];
    setCountries(updated); saveRegistry(updated);
    setNewCountryName(""); setNewCountryCode(""); setNewCountryFlag(""); setNewFeedUrl(""); setNewFeedLabel("");
  };

  const rev = totalRevenue();
  const visible = filter === "all" ? gigs : gigs.filter(g => g.stage === filter);
  const filteredVenues = venueFilter === "all" ? UAE_VENUES : UAE_VENUES.filter(v => v.tier === venueFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">🎯 GigRadar</h1>
          <p className="mt-1 text-sm text-zinc-400">UAE & Global DJ Booking Intelligence</p>
        </div>
        <button onClick={() => void triggerSweep()} disabled={sweeping}
          className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50 transition">
          {sweeping ? "⏳ Sweeping..." : "🔄 Sweep Now"}
        </button>
      </div>

      {dueFollowUps.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-300">⏰ {dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} due today</p>
          <div className="mt-1 space-y-1">
            {dueFollowUps.map(f => (
              <p key={f.gigId} className="text-xs text-amber-200">{f.message}</p>
            ))}
          </div>
        </div>
      )}

      {sweepResult && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">{sweepResult}</div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([
          { id: "radar", label: "🎯 Radar" },
          { id: "venues", label: "🏙 UAE Venues" },
          { id: "revenue", label: "💰 Revenue" },
          { id: "add", label: "➕ Add Lead" },
          { id: "sources", label: "🌍 Sources" },
        ] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-1 whitespace-nowrap rounded-xl py-2 text-xs font-semibold transition " + (tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* RADAR TAB */}
      {tab === "radar" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter("all")} className={"px-4 py-1.5 rounded-full text-xs font-bold transition " + (filter === "all" ? "bg-white text-black" : "bg-zinc-900 text-zinc-400")}>
              ALL ({gigs.length})
            </button>
            {STAGES.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={"px-4 py-1.5 rounded-full text-xs font-bold uppercase transition " + (filter === s ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-400")}>
                {s} ({gigs.filter(g => g.stage === s).length})
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
              <p className="text-zinc-500 text-sm">No gigs in this stage.</p>
              <p className="text-zinc-600 text-xs mt-2">Press "Sweep Now" to pull from UAE feeds, or use "Add Lead" to paste one manually.</p>
            </div>
          ) : (
            visible.map(g => {
              const gigRev = revenueData.find(r => r.gigId === g.id);
              return (
                <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 hover:border-zinc-700 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{g.sourceKind}</span>
                        <span className="text-[10px] text-zinc-600">•</span>
                        <span className="text-[10px] text-zinc-500">{new Date(g.postedAt).toLocaleDateString("en-GB")}</span>
                        {g.score > 0 && (
                          <span className={"text-[10px] font-bold " + (g.score >= 70 ? "text-green-400" : g.score >= 50 ? "text-yellow-400" : "text-zinc-500")}>
                            Score: {g.score}
                          </span>
                        )}
                        {gigRev && <span className="text-[10px] font-bold text-fuchsia-400">💰 {gigRev.amount} {gigRev.currency}</span>}
                      </div>
                      <h3 className="text-base font-bold text-white leading-tight">{g.title}</h3>
                      <p className="text-sm text-zinc-400 line-clamp-2">{g.body}</p>
                      {g.sourceUrl && <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:text-blue-300">View original →</a>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button onClick={() => { setSelectedGig(g); void generatePitch(g); setTab("radar"); }}
                        className="flex items-center gap-1 rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                        ✉ AI Pitch
                      </button>
                      <a href={generateWhatsAppLink(g)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 transition">
                        💬 WhatsApp
                      </a>
                      <select value={g.stage} onChange={e => handleStageChange(g.id, e.target.value as GigStage)}
                        className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-white border-none focus:ring-2 focus:ring-blue-500">
                        {STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        <option value="archived">ARCHIVE</option>
                      </select>
                    </div>
                  </div>
                  {!gigRev && (
                    <div className="mt-3 border-t border-zinc-800 pt-3">
                      <RevenueTracker gigId={g.id} onSave={refresh} />
                    </div>
                  )}
                  {gigRev && (
                    <div className="mt-3 border-t border-zinc-800 pt-3 flex items-center gap-3">
                      <span className={"text-xs rounded-full px-2 py-0.5 font-semibold " + (gigRev.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                        {gigRev.paid ? "✓ Paid" : "⏳ Pending"}
                      </span>
                      <span className="text-xs text-zinc-500">{gigRev.amount} {gigRev.currency}</span>
                      <button onClick={() => { upsertGigRevenue({ ...gigRev, paid: !gigRev.paid }); refresh(); }} className="text-xs text-zinc-600 hover:text-fuchsia-400">toggle paid</button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {pitchEmail && selectedGig && (
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>✉ AI Pitch Email — {selectedGig.title}</SectionLabel>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { void navigator.clipboard.writeText(pitchEmail); setPitchCopied(true); setTimeout(() => setPitchCopied(false), 1500); }}>
                    {pitchCopied ? "✓ Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setPitchEmail(""); setSelectedGig(null); }}>✕</Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed bg-zinc-950 rounded-xl p-3 border border-zinc-800">{generatingPitch ? "Generating with AI…" : pitchEmail}</pre>
            </Card>
          )}
        </div>
      )}

      {/* UAE VENUES TAB */}
      {tab === "venues" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["all", "superclub", "beach_club", "hotel", "restaurant", "lounge"].map(t => (
              <button key={t} onClick={() => setVenueFilter(t)}
                className={"px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition " + (venueFilter === t ? "bg-fuchsia-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>
                {t === "all" ? "All Venues" : t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredVenues.map(venue => (
              <div key={venue.name} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-100">{venue.name}</p>
                    <p className="text-xs text-zinc-500">{venue.area} · {venue.tier.replace("_", " ")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">
                    ~{venue.avgPayAed.toLocaleString()} AED
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{venue.bookingNotes}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {venue.genres.map(g => (
                    <span key={g} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={"mailto:" + venue.email} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                    📧 {venue.email}
                  </a>
                  <a href={"https://instagram.com/" + venue.instagram.replace("@", "")} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                    📸 {venue.instagram}
                  </a>
                  <button onClick={() => { void generatePitch(undefined, venue); setTab("radar"); }}
                    className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                    ✉ Generate Pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REVENUE TAB */}
      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-fuchsia-300">{Math.round(rev.totalAed).toLocaleString()} AED</p>
              <p className="text-xs text-zinc-500">Total Pipeline</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-emerald-300">{Math.round(rev.paidAed).toLocaleString()} AED</p>
              <p className="text-xs text-zinc-500">Paid</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-extrabold text-amber-300">{Math.round(rev.pendingAed).toLocaleString()} AED</p>
              <p className="text-xs text-zinc-500">Pending</p>
            </Card>
          </div>
          <Card className="p-4 sm:p-5">
            <SectionLabel>All Gig Revenue</SectionLabel>
            {revenueData.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-600">No revenue tracked yet. Add amounts from the Radar tab on each gig.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {revenueData.map(r => {
                  const gig = gigs.find(g => g.id === r.gigId);
                  return (
                    <div key={r.gigId} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-zinc-200">{gig?.title ?? r.gigId}</p>
                        <p className="text-xs text-zinc-500">{r.notes}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-fuchsia-400">{r.amount} {r.currency}</span>
                        <span className={"text-xs rounded-full px-2 py-0.5 font-semibold " + (r.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                          {r.paid ? "Paid" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ADD LEAD TAB */}
      {tab === "add" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-1">Add a Booking Lead Manually</h2>
            <p className="text-sm text-zinc-500 mb-4">Paste anything — a WhatsApp message, Instagram caption, email, website text, or venue name.</p>
            <textarea value={manualText} onChange={e => setManualText(e.target.value)}
              placeholder={"Examples:\n• \"White Dubai is looking for DJs for their Saturday nights\"\n• Paste a WhatsApp group message about a gig\n• \"Atlantis brunch entertainment booking enquiries to events@atlantis.com\""}
              rows={8} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none resize-none" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-zinc-600">{manualText.length} characters</p>
              <button onClick={() => void submitManualLead()} disabled={manualSubmitting || !manualText.trim()}
                className="rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition">
                {manualSubmitting ? "Processing..." : "Extract & Add Gig"}
              </button>
            </div>
            {manualResult && (
              <div className={"mt-3 rounded-xl px-4 py-2 text-sm " + (manualResult.startsWith("✅") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300")}>
                {manualResult}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-1">Quick Add — Top Dubai Venues</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {UAE_VENUES.map(venue => (
                <button key={venue.name} onClick={() => {
                  setManualText("DJ booking opportunity at " + venue.name + " (" + venue.area + ", Dubai). " + venue.bookingNotes);
                  setTab("add");
                }} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:border-fuchsia-500/50 hover:text-white transition">
                  {venue.name}
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* SOURCES TAB */}
      {tab === "sources" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-1">Country & Source Manager</h2>
            <p className="text-sm text-zinc-500 mb-2">Toggle countries and feeds on/off. UAE is always priority 1.</p>
            <div className="mb-4 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
              <p className="text-xs font-bold text-fuchsia-300">Built-in UAE sources (always active, no setup needed)</p>
              <p className="text-[11px] text-zinc-400 mt-1">40+ free public sources: Indeed, Bayt, GulfTalent, NaukriGulf, Hozpitality, Dubizzle, Reddit (r/DJs, r/dubai), Twitter/X (DJ booking, DJ wanted, Afro House Dubai), Eventbrite, Meetup, Time Out Dubai, Resident Advisor, Platinumlist, Visit Dubai, Dubai Calendar, What's On UAE, Gulf News, Khaleej Times, Arabian Business, Esquire ME, Hospitality Net, Caterer, Total Jobs.</p>
            </div>
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
                  <button onClick={() => toggleCountry(country.code)}
                    className={"px-3 py-1 rounded-full text-xs font-bold transition " + (country.active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700")}>
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
                      <button onClick={() => toggleFeed(country.code, feed.id)}
                        className={"shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold transition " + (feed.active ? "bg-blue-500/20 text-blue-300" : "bg-zinc-800 text-zinc-600")}>
                        {feed.active ? "ON" : "OFF"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-4">Add New Country</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={newCountryName} onChange={e => setNewCountryName(e.target.value)} placeholder="Country name" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              <input value={newCountryCode} onChange={e => setNewCountryCode(e.target.value)} placeholder="Country code (e.g. EG)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              <input value={newCountryFlag} onChange={e => setNewCountryFlag(e.target.value)} placeholder="Flag emoji 🇪🇬" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              <input value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} placeholder="First feed URL (optional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              <button onClick={addCountry} disabled={!newCountryName || !newCountryCode} className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition sm:col-span-2">
                Add Country
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function RevenueTracker({ gigId, onSave }: { gigId: string; onSave: () => void }) {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"AED" | "USD" | "EUR">("AED");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs text-zinc-600 hover:text-fuchsia-400 transition">+ Track payment</button>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)}
        className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
      <select value={currency} onChange={e => setCurrency(e.target.value as "AED" | "USD" | "EUR")}
        className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200">
        <option>AED</option><option>USD</option><option>EUR</option>
      </select>
      <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)}
        className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
      <button onClick={() => { if (amount) { upsertGigRevenue({ gigId, amount: parseFloat(amount), currency, paid: false, invoiceSent: false, notes }); onSave(); setOpen(false); } }}
        className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500">Save</button>
      <button onClick={() => setOpen(false)} className="text-xs text-zinc-600">Cancel</button>
    </div>
  );
}