"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getGigs, updateGigStage } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/outreach";
import { Gig, GigStage } from "@/lib/types";
import { getRegistry, saveRegistry, type CountryConfig } from "@/lib/sources/registry";
import { UAE_VENUES, generatePitchEmail, getGigRevenue, upsertGigRevenue, totalRevenue, getDueFollowUps, type GigRevenue, type VenueContact } from "@/lib/studio/gigradar-ai";
import { useSettings } from "@/lib/studio/store";
import { Card, SectionLabel, Button } from "@/components/studio/ui";

const STAGES: GigStage[] = ["new", "contacted", "negotiating", "confirmed", "paid"];
const SWEEP_KEY = "emy-gigradar-last-sweep";
const AUTO_SWEEP_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours
type Tab = "radar" | "venues" | "revenue" | "sources" | "add";

// Extract verified contacts directly from advert text
function extractContacts(body: string): { type: string; value: string; action: string; label: string }[] {
  const contacts: { type: string; value: string; action: string; label: string }[] = [];
  // Phone / WhatsApp
  const phones = body.match(/(?:\+971|00971|971)?[\s.-]?(?:50|52|54|55|56|58|2|3|4|6|7|9)[\s.-]?\d{3}[\s.-]?\d{4}/g) ?? [];
  for (const p of phones) {
    const clean = p.replace(/[\s.-]/g, "").replace(/^00/, "+");
    const intl = clean.startsWith("+") ? clean : "+971" + clean;
    contacts.push({ type: "whatsapp", value: intl, action: "https://wa.me/" + intl.replace("+", ""), label: "WhatsApp " + intl });
  }
  // Email
  const emails = body.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? [];
  for (const e of emails) {
    contacts.push({ type: "email", value: e, action: "mailto:" + e, label: e });
  }
  // Instagram
  const handles = body.match(/(?:^|[\s,])@([a-zA-Z0-9._]{3,30})/g) ?? [];
  for (const h of handles) {
    const handle = h.trim();
    contacts.push({ type: "instagram", value: handle, action: "https://instagram.com/" + handle.replace("@", ""), label: handle });
  }
  return contacts;
}

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
  const [lastSweep, setLastSweep] = useState<string | null>(null);
  const sweepRef = useRef(false);

  const refresh = useCallback(() => {
    const all = getGigs().sort((a, b) => b.score - a.score);
    setGigs(all);
    setRevenueData(getGigRevenue());
    setDueFollowUps(getDueFollowUps());
  }, []);

  // Auto-sweep on load if last sweep was more than 6 hours ago
  const runSweep = useCallback(async (auto = false) => {
    if (sweepRef.current) return;
    sweepRef.current = true;
    setSweeping(true);
    if (!auto) setSweepResult(null);
    try {
      const res = await fetch("/api/sweep");
      const data = await res.json();
      const errCount = data.errors?.length ?? 0;
      const srcCount = (data.sources ?? []).filter((s: { found: number }) => s.found > 0).length;
      // Save returned gigs into browser localStorage
      if (data.gigs && data.gigs.length > 0) {
        try {
          const existing = JSON.parse(localStorage.getItem("emy-gigs-db") || "[]");
          const existingIds = new Set(existing.map((g: { id: string }) => g.id));
          const incoming = (data.gigs as { id: string }[]).filter(g => !existingIds.has(g.id));
          const merged = [...incoming, ...existing].slice(0, 500);
          localStorage.setItem("emy-gigs-db", JSON.stringify(merged));
        } catch {}
      }
      const now = new Date().toISOString();
      localStorage.setItem(SWEEP_KEY, now);
      setLastSweep(now);
      setSweepResult(
        (auto ? "Auto-sweep: " : "") +
        "Scanned " + srcCount + " sources. Found " + data.found + " leads. " +
        data.newGigs + " new gigs added." +
        (data.alerted > 0 ? " " + data.alerted + " alerts sent." : "") +
        (errCount > 0 ? " (" + errCount + " sources offline)" : " All sources OK.")
      );
      refresh();
    } catch {
      setSweepResult("Sweep failed � check your internet connection.");
    } finally {
      setSweeping(false);
      sweepRef.current = false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    setCountries(getRegistry());
    // Check last sweep time and auto-sweep if needed
    const last = localStorage.getItem(SWEEP_KEY);
    setLastSweep(last);
    if (!last || Date.now() - new Date(last).getTime() > AUTO_SWEEP_INTERVAL_MS) {
      void runSweep(true);
    }
  }, [refresh, runSweep]);

  const handleStageChange = (id: string, stage: GigStage) => {
    updateGigStage(id, stage);
    refresh();
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
      if (data.ok) {
        if (data.gigs && data.gigs.length > 0) {
          try {
            const existing = JSON.parse(localStorage.getItem("emy-gigs-db") || "[]");
            const existingIds = new Set(existing.map((g: { id: string }) => g.id));
            const incoming = (data.gigs as { id: string }[]).filter(g => !existingIds.has(g.id));
            localStorage.setItem("emy-gigs-db", JSON.stringify([...incoming, ...existing].slice(0, 500)));
          } catch {}
        }
        setManualResult("Added " + data.newGigs + " gig" + (data.newGigs !== 1 ? "s" : "") + ".");
        setManualText("");
        refresh();
      } else setManualResult("Could not process this lead. Try adding more detail.");
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
    const newCountry: CountryConfig = {
      code: newCountryCode.toUpperCase(), name: newCountryName, flag: newCountryFlag || "??",
      currency: "USD", priority: countries.length + 1, active: true,
      feeds: newFeedUrl ? [{ id: newCountryCode.toLowerCase() + "-feed-1", label: newFeedLabel || newCountryName, url: newFeedUrl, kind: "rss", active: true }] : []
    };
    const updated = [...countries, newCountry];
    setCountries(updated); saveRegistry(updated);
    setNewCountryName(""); setNewCountryCode(""); setNewCountryFlag(""); setNewFeedUrl(""); setNewFeedLabel("");
  };

  const rev = totalRevenue();
  const visible = (filter === "all" ? gigs : gigs.filter(g => g.stage === filter))
    .sort((a, b) => b.score - a.score);
  const filteredVenues = venueFilter === "all" ? UAE_VENUES : UAE_VENUES.filter(v => v.tier === venueFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">GigRadar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live UAE and global DJ booking intelligence
            {lastSweep && <span className="ml-2 text-zinc-600 text-xs">Last sweep: {new Date(lastSweep).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
        <button onClick={() => void runSweep(false)} disabled={sweeping}
          className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50 transition">
          {sweeping ? "Scanning..." : "Sweep Now"}
        </button>
      </div>

      {dueFollowUps.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-300">{dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} due today</p>
          <div className="mt-1 space-y-1">
            {dueFollowUps.map(f => <p key={f.gigId} className="text-xs text-amber-200">{f.message}</p>)}
          </div>
        </div>
      )}

      {sweepResult && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-sm text-emerald-300">{sweepResult}</div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([
          { id: "radar", label: "Radar" },
          { id: "venues", label: "UAE Venues" },
          { id: "revenue", label: "Revenue" },
          { id: "add", label: "Add Lead" },
          { id: "sources", label: "Sources" },
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
          <div className="flex flex-wrap gap-2 items-center justify-between">
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
            <span className="text-[11px] text-zinc-600">Sorted by score</span>
          </div>

          {visible.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-12 text-center">
              <div className="text-3xl mb-3">{sweeping ? "..." : "??"}</div>
              <p className="text-zinc-500 text-sm">{sweeping ? "Scanning 40+ sources..." : "No gigs yet."}</p>
              <p className="text-zinc-600 text-xs mt-2">{sweeping ? "This takes up to 30 seconds." : "Sweep is automatic � or press Sweep Now."}</p>
            </div>
          ) : (
            visible.map(g => {
              const gigRev = revenueData.find(r => r.gigId === g.id);
              const contacts = extractContacts(g.body + " " + (g.title ?? ""));
              const scoreColor = g.score >= 70 ? "text-green-400" : g.score >= 50 ? "text-yellow-400" : "text-zinc-500";
              return (
                <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={"text-[11px] font-black " + scoreColor}>
                          {g.score >= 70 ? "HIGH" : g.score >= 50 ? "MED" : "LOW"} {g.score}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500">{g.sourceKind}</span>
                        <span className="text-[10px] text-zinc-600">{new Date(g.postedAt).toLocaleDateString("en-GB")}</span>
                        {g.eventDate && <span className="text-[10px] font-semibold text-fuchsia-400">Event: {g.eventDate}</span>}
                        {gigRev && <span className="text-[10px] font-bold text-emerald-400">{gigRev.amount} {gigRev.currency} {gigRev.paid ? "PAID" : "pending"}</span>}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">{g.title}</h3>
                      {g.venueName && <p className="text-xs font-semibold text-fuchsia-300">{g.venueName} {g.area ? "- " + g.area : ""}</p>}
                      {g.budgetStatedAed && <p className="text-xs font-bold text-emerald-300">Budget: AED {g.budgetStatedAed.toLocaleString()}</p>}
                      <p className="text-xs text-zinc-400 line-clamp-2">{g.body}</p>
                      {g.sourceUrl && (
                        <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:text-blue-300">
                          View original source
                        </a>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <button onClick={() => { setSelectedGig(g); void generatePitch(g); }}
                        className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                        AI Pitch
                      </button>
                      <a href={generateWhatsAppLink(g)} target="_blank" rel="noopener noreferrer"
                        className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500 transition">
                        WhatsApp
                      </a>
                      <select value={g.stage} onChange={e => handleStageChange(g.id, e.target.value as GigStage)}
                        className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-white border-none focus:ring-2 focus:ring-blue-500">
                        {STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        <option value="archived">ARCHIVE</option>
                      </select>
                    </div>
                  </div>

                  {/* VERIFIED CONTACTS from advert */}
                  {contacts.length > 0 && (
                    <div className="mt-3 border-t border-zinc-800 pt-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Verified contacts from advert</p>
                      <div className="flex flex-wrap gap-2">
                        {contacts.map((c, i) => (
                          <a key={i} href={c.action} target="_blank" rel="noreferrer"
                            className={"rounded-lg px-3 py-1.5 text-xs font-semibold transition " +
                              (c.type === "whatsapp" ? "bg-green-600/20 border border-green-600/40 text-green-300 hover:bg-green-600/30" :
                               c.type === "email" ? "bg-blue-600/20 border border-blue-600/40 text-blue-300 hover:bg-blue-600/30" :
                               "bg-fuchsia-600/20 border border-fuchsia-600/40 text-fuchsia-300 hover:bg-fuchsia-600/30")}>
                            {c.type === "whatsapp" ? "WhatsApp " : c.type === "email" ? "Email " : "IG "}
                            {c.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Revenue tracker */}
                  {!gigRev && (
                    <div className="mt-3 border-t border-zinc-800 pt-3">
                      <RevenueTracker gigId={g.id} onSave={refresh} />
                    </div>
                  )}
                  {gigRev && (
                    <div className="mt-3 border-t border-zinc-800 pt-3 flex items-center gap-3">
                      <span className={"text-xs rounded-full px-2 py-0.5 font-semibold " + (gigRev.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                        {gigRev.paid ? "Paid" : "Pending"}
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
                <SectionLabel>AI Pitch � {selectedGig.title}</SectionLabel>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { void navigator.clipboard.writeText(pitchEmail); setPitchCopied(true); setTimeout(() => setPitchCopied(false), 1500); }}>
                    {pitchCopied ? "Copied" : "Copy"}
                  </Button>
                  <Button variant="ghost" onClick={() => { setPitchEmail(""); setSelectedGig(null); }}>Close</Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-zinc-300 leading-relaxed bg-zinc-950 rounded-xl p-3 border border-zinc-800 max-h-64 overflow-y-auto">{generatingPitch ? "Generating..." : pitchEmail}</pre>
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
                    <p className="text-xs text-zinc-500">{venue.area} - {venue.tier.replace("_", " ")}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">
                    ~{venue.avgPayAed.toLocaleString()} AED
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-500 leading-relaxed">{venue.bookingNotes}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {venue.genres.map(g => <span key={g} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>)}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={"mailto:" + venue.email} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                    {venue.email}
                  </a>
                  <a href={"https://instagram.com/" + venue.instagram.replace("@", "")} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                    {venue.instagram}
                  </a>
                  <button onClick={() => { void generatePitch(undefined, venue); setTab("radar"); }}
                    className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                    Generate Pitch
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
              <p className="mt-3 text-xs text-zinc-600">No revenue tracked yet.</p>
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
            <p className="text-sm text-zinc-500 mb-4">Paste anything � WhatsApp message, Instagram caption, email, or venue name. Contacts are extracted automatically.</p>
            <textarea value={manualText} onChange={e => setManualText(e.target.value)}
              placeholder={"Examples:\n- White Dubai is looking for DJs for their Saturday nights, contact bookings@whitedubai.com or WhatsApp +971 50 123 4567\n- Atlantis brunch entertainment enquiries to events@atlantis.com"}
              rows={8} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none resize-none" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-zinc-600">{manualText.length} characters</p>
              <button onClick={() => void submitManualLead()} disabled={manualSubmitting || !manualText.trim()}
                className="rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition">
                {manualSubmitting ? "Processing..." : "Extract and Add Gig"}
              </button>
            </div>
            {manualResult && (
              <div className={"mt-3 rounded-xl px-4 py-2 text-sm " + (manualResult.startsWith("Added") ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border border-red-500/30 text-red-300")}>
                {manualResult}
              </div>
            )}
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-1">Quick Add � Top Dubai Venues</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              {UAE_VENUES.map(venue => (
                <button key={venue.name} onClick={() => {
                  setManualText("DJ booking opportunity at " + venue.name + " (" + venue.area + ", Dubai). " + venue.bookingNotes + " Contact: " + venue.email);
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
            <h2 className="text-lg font-bold mb-1">Source Manager</h2>
            <p className="text-sm text-zinc-500 mb-2">Toggle countries and feeds on/off. UAE built-in sources always run.</p>
            <div className="mb-4 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
              <p className="text-xs font-bold text-fuchsia-300">Built-in UAE sources � always active, no setup needed</p>
              <p className="text-[11px] text-zinc-400 mt-1">40+ free public sources: Indeed x3, Bayt x2, GulfTalent, NaukriGulf, Hozpitality, Dubizzle, Monster, Reddit (r/DJs, r/dubai, r/electronicmusic), Twitter/X via Nitter (DJ booking Dubai, DJ wanted, looking for DJ, Afro House Dubai, DJ booking UAE), Eventbrite (DJ, Electronic, Nightlife), Meetup, Time Out Dubai x2, Resident Advisor Dubai and Doha, Platinumlist x2, Visit Dubai, Dubai Calendar, What's On UAE, Gulf News, Khaleej Times, Arabian Business, Esquire ME, Hospitality Net, Caterer, Total Jobs. Auto-sweep 09:00 and 21:00 Dubai time daily.</p>
            </div>
            {countries.map(country => (
              <div key={country.code} className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{country.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{country.name}</p>
                      <p className="text-xs text-zinc-500">{country.feeds.length} feeds - Priority {country.priority}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleCountry(country.code)}
                    className={"px-3 py-1 rounded-full text-xs font-bold transition " + (country.active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700")}>
                    {country.active ? "ACTIVE" : "INACTIVE"}
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
              <input value={newCountryFlag} onChange={e => setNewCountryFlag(e.target.value)} placeholder="Flag emoji" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
              <input value={newFeedUrl} onChange={e => setNewFeedUrl(e.target.value)} placeholder="Feed URL (optional)" className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
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
