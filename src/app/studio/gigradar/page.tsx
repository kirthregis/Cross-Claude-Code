"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { updateGigStage } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/outreach";
import { Gig, GigStage } from "@/lib/types";
import { UAE_VENUES, generatePitchEmail, getGigRevenue, upsertGigRevenue, totalRevenue, getDueFollowUps, type GigRevenue, type VenueContact } from "@/lib/studio/gigradar-ai";
import { getRegistry, saveRegistry, type CountryConfig } from "@/lib/sources/registry";
import { useSettings } from "@/lib/studio/store";
import { Card, SectionLabel, Button } from "@/components/studio/ui";

const STAGES: GigStage[] = ["new", "contacted", "negotiating", "confirmed", "paid"];
const DB_KEY = "emy-gigs-db";
const SWEEP_KEY = "emy-last-sweep";
const SIX_HOURS = 6 * 60 * 60 * 1000;
type Tab = "radar" | "venues" | "revenue" | "add" | "sources";

function readGigs(): Gig[] {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || "[]"); } catch { return []; }
}
function writeGigs(list: Gig[]) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(list.slice(0, 500))); } catch {}
}
function mergeGigs(incoming: Gig[]) {
  const existing = readGigs();
  const ids = new Set(existing.map(g => g.id));
  const merged = [...incoming.filter(g => !ids.has(g.id)), ...existing];
  writeGigs(merged);
  return merged.sort((a, b) => b.score - a.score);
}
function extractContacts(text: string) {
  const out: { type: string; label: string; href: string }[] = [];
  (text.match(/(?:\+971|00971)?[\s]?(?:50|52|54|55|56|58)\d{7}/g) || []).forEach(p => {
    const n = p.replace(/\s/g, "").replace(/^00/, "+").replace(/^(?!\+)/, "+971");
    out.push({ type: "whatsapp", label: n, href: "https://wa.me/" + n.replace("+", "") });
  });
  (text.match(/[\w.+%-]+@[\w.-]+\.[a-z]{2,}/gi) || []).forEach(e =>
    out.push({ type: "email", label: e, href: "mailto:" + e }));
  (text.match(/(?<!\w)@[\w.]{3,30}/g) || []).forEach(h =>
    out.push({ type: "ig", label: h, href: "https://instagram.com/" + h.replace("@", "") }));
  return out;
}

export default function GigRadarPage() {
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("radar");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filter, setFilter] = useState<GigStage | "all">("all");
  const [sweeping, setSweeping] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lastSweep, setLastSweep] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<GigRevenue[]>([]);
  const [dueFollowUps, setDueFollowUps] = useState(getDueFollowUps());
  const [manualText, setManualText] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const [pitchGig, setPitchGig] = useState<Gig | null>(null);
  const [pitchText, setPitchText] = useState("");
  const [pitchBusy, setPitchBusy] = useState(false);
  const [venueFilter, setVenueFilter] = useState("all");
  const [countries, setCountries] = useState<CountryConfig[]>([]);
  const sweepRef = useRef(false);

  const reload = useCallback(() => {
    setGigs(readGigs().sort((a, b) => b.score - a.score));
    setRevenueData(getGigRevenue());
    setDueFollowUps(getDueFollowUps());
  }, []);

  const sweep = useCallback(async (auto = false) => {
    if (sweepRef.current) return;
    sweepRef.current = true;
    setSweeping(true);
    if (!auto) setMsg(null);
    try {
      const res = await fetch("/api/sweep");
      if (!res.ok) { setMsg("Sweep failed: " + res.status); return; }
      const data = await res.json();
      const incoming: Gig[] = data.gigs || [];
      const merged = mergeGigs(incoming);
      setGigs(merged);
      const now = new Date().toISOString();
      localStorage.setItem(SWEEP_KEY, now);
      setLastSweep(now);
      const src = (data.sources || []).filter((s: { found: number }) => s.found > 0).length;
      const errs = (data.errors || []).length;
      setMsg((auto ? "Auto-sweep: " : "") + src + " sources. " + incoming.length + " new leads. " + (errs ? "(" + errs + " offline)" : "All OK."));
    } catch (e) {
      setMsg("Sweep error: " + String(e));
    } finally {
      setSweeping(false);
      sweepRef.current = false;
    }
  }, []);

  useEffect(() => {
    reload();
    setCountries(getRegistry());
    const last = localStorage.getItem(SWEEP_KEY);
    setLastSweep(last);
    if (!last || Date.now() - new Date(last).getTime() > SIX_HOURS) {
      void sweep(true);
    }
  }, [reload, sweep]);

  const changeStage = (id: string, stage: GigStage) => {
    updateGigStage(id, stage);
    const list = readGigs().map(g => g.id === id ? { ...g, stage } : g);
    writeGigs(list);
    setGigs(list.sort((a, b) => b.score - a.score));
  };

  const addManual = async () => {
    if (!manualText.trim()) return;
    setManualBusy(true); setManualMsg(null);
    try {
      const res = await fetch("/api/ingest/manual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: manualText.slice(0, 80), text: manualText, sourceName: "Manual" }),
      });
      const d = await res.json();
      const incoming: Gig[] = d.gigs || [];
      setGigs(mergeGigs(incoming));
      setManualMsg("Added " + incoming.length + " gig" + (incoming.length !== 1 ? "s" : "") + ".");
      setManualText("");
    } catch { setManualMsg("Failed."); }
    finally { setManualBusy(false); }
  };

  const getPitch = async (gig: Gig, venue?: VenueContact) => {
    setPitchGig(gig); setPitchBusy(true); setPitchText("");
    const t = await generatePitchEmail({
      venueName: venue?.name ?? gig.title,
      venueArea: venue?.area ?? "Dubai",
      artistName: settings.artistName,
      genre: settings.defaultGenre,
      instagram: settings.instagram,
      youtubeChannel: settings.youtubeChannel,
      geminiKey: settings.geminiKey,
      geminiModel: settings.geminiTextModel,
    });
    setPitchText(t); setPitchBusy(false);
  };

  const rev = totalRevenue();
  const visible = filter === "all" ? gigs : gigs.filter(g => g.stage === filter);
  const filteredVenues = venueFilter === "all" ? UAE_VENUES : UAE_VENUES.filter(v => v.tier === venueFilter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">GigRadar</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Live UAE and global DJ booking intelligence
            {lastSweep && <span className="ml-2 text-[11px] text-zinc-600">Last: {new Date(lastSweep).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>}
          </p>
        </div>
        <button onClick={() => void sweep(false)} disabled={sweeping}
          className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-50 transition">
          {sweeping ? "Scanning..." : "Sweep Now"}
        </button>
      </div>

      {dueFollowUps.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-sm font-semibold text-amber-300">{dueFollowUps.length} follow-up{dueFollowUps.length > 1 ? "s" : ""} due</p>
          {dueFollowUps.map(f => <p key={f.gigId} className="text-xs text-amber-200">{f.message}</p>)}
        </div>
      )}

      {msg && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">{msg}</div>}

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {(["radar", "venues", "revenue", "add", "sources"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={"flex-1 whitespace-nowrap rounded-xl py-2 text-xs font-semibold capitalize transition " + (tab === t ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t === "radar" ? "Radar" : t === "venues" ? "UAE Venues" : t === "revenue" ? "Revenue" : t === "add" ? "Add Lead" : "Sources"}
          </button>
        ))}
      </div>

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
              <div className="text-4xl mb-3">{sweeping ? "..." : "??"}</div>
              <p className="text-zinc-500 text-sm">{sweeping ? "Scanning 40+ sources..." : "No gigs yet. Press Sweep Now."}</p>
            </div>
          ) : visible.map(g => {
            const gigRev = revenueData.find(r => r.gigId === g.id);
            const contacts = extractContacts((g.body || "") + " " + (g.title || ""));
            const scoreColor = g.score >= 70 ? "text-green-400" : g.score >= 50 ? "text-yellow-400" : "text-zinc-500";
            return (
              <div key={g.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={"text-xs font-black " + scoreColor}>{g.score >= 70 ? "HIGH" : g.score >= 50 ? "MED" : "LOW"} {g.score}</span>
                      <span className="text-[10px] font-bold uppercase text-blue-500">{g.sourceKind}</span>
                      <span className="text-[10px] text-zinc-600">{new Date(g.postedAt).toLocaleDateString("en-GB")}</span>
                      {g.eventDate && <span className="text-[10px] font-semibold text-fuchsia-400">{g.eventDate}</span>}
                      {gigRev && <span className="text-[10px] font-bold text-emerald-400">{gigRev.amount} {gigRev.currency} {gigRev.paid ? "PAID" : "pending"}</span>}
                    </div>
                    <h3 className="text-sm font-bold text-white">{g.title}</h3>
                    {g.venueName && <p className="text-xs font-semibold text-fuchsia-300">{g.venueName}{g.area ? " - " + g.area : ""}</p>}
                    {g.budgetStatedAed && <p className="text-xs font-bold text-emerald-300">Budget: AED {g.budgetStatedAed.toLocaleString()}</p>}
                    <p className="text-xs text-zinc-400 line-clamp-3">{g.body}</p>
                    {g.sourceUrl && <a href={g.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-blue-400 hover:text-blue-300">View source</a>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button onClick={() => void getPitch(g)} className="rounded-xl bg-fuchsia-600 px-3 py-2 text-xs font-bold text-white hover:bg-fuchsia-500">AI Pitch</button>
                    <a href={generateWhatsAppLink(g)} target="_blank" rel="noreferrer" className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white hover:bg-green-500">WhatsApp</a>
                    <select value={g.stage} onChange={e => changeStage(g.id, e.target.value as GigStage)} className="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-bold text-white border-none">
                      {STAGES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      <option value="archived">ARCHIVE</option>
                    </select>
                  </div>
                </div>
                {contacts.length > 0 && (
                  <div className="mt-3 border-t border-zinc-800 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Contacts from advert</p>
                    <div className="flex flex-wrap gap-2">
                      {contacts.map((c, i) => (
                        <a key={i} href={c.href} target="_blank" rel="noreferrer"
                          className={"rounded-lg px-3 py-1.5 text-xs font-semibold transition border " + (c.type === "whatsapp" ? "bg-green-600/20 border-green-600/40 text-green-300" : c.type === "email" ? "bg-blue-600/20 border-blue-600/40 text-blue-300" : "bg-fuchsia-600/20 border-fuchsia-600/40 text-fuchsia-300")}>
                          {c.type === "whatsapp" ? "WA " : c.type === "email" ? "Email " : "IG "}{c.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 border-t border-zinc-800 pt-3">
                  <RevenueTracker gigId={g.id} existing={gigRev} onSave={() => setRevenueData(getGigRevenue())} />
                </div>
              </div>
            );
          })}

          {pitchGig && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <SectionLabel>AI Pitch - {pitchGig.title}</SectionLabel>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => void navigator.clipboard.writeText(pitchText)}>Copy</Button>
                  <Button variant="ghost" onClick={() => setPitchGig(null)}>Close</Button>
                </div>
              </div>
              <pre className="whitespace-pre-wrap text-xs text-zinc-300 bg-zinc-950 rounded-xl p-3 border border-zinc-800 max-h-64 overflow-y-auto">
                {pitchBusy ? "Generating..." : pitchText}
              </pre>
            </Card>
          )}
        </div>
      )}

      {tab === "venues" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["all", "superclub", "beach_club", "hotel", "restaurant", "lounge"].map(t => (
              <button key={t} onClick={() => setVenueFilter(t)} className={"px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition " + (venueFilter === t ? "bg-fuchsia-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>
                {t === "all" ? "All" : t.replace("_", " ")}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredVenues.map(v => (
              <div key={v.name} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="text-sm font-bold text-zinc-100">{v.name}</p><p className="text-xs text-zinc-500">{v.area} - {v.tier.replace("_", " ")}</p></div>
                  <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-bold text-fuchsia-300">~{v.avgPayAed.toLocaleString()} AED</span>
                </div>
                <p className="mt-2 text-xs text-zinc-500">{v.bookingNotes}</p>
                <div className="mt-2 flex flex-wrap gap-1">{v.genres.map(g => <span key={g} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>)}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={"mailto:" + v.email} className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-fuchsia-500 transition">{v.email}</a>
                  <a href={"https://instagram.com/" + v.instagram.replace("@", "")} target="_blank" rel="noreferrer" className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-fuchsia-500 transition">{v.instagram}</a>
                  <button onClick={() => void getPitch({ id: "", title: v.name, body: v.bookingNotes, score: 0, stage: "new", sourceKind: "event_calendar", sourceName: v.name, postedAt: new Date().toISOString() } as Gig, v)} className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">Pitch</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4 text-center"><p className="text-2xl font-extrabold text-fuchsia-300">{Math.round(rev.totalAed).toLocaleString()} AED</p><p className="text-xs text-zinc-500">Pipeline</p></Card>
            <Card className="p-4 text-center"><p className="text-2xl font-extrabold text-emerald-300">{Math.round(rev.paidAed).toLocaleString()} AED</p><p className="text-xs text-zinc-500">Paid</p></Card>
            <Card className="p-4 text-center"><p className="text-2xl font-extrabold text-amber-300">{Math.round(rev.pendingAed).toLocaleString()} AED</p><p className="text-xs text-zinc-500">Pending</p></Card>
          </div>
          <Card className="p-4"><SectionLabel>All Gig Revenue</SectionLabel>
            {revenueData.length === 0 ? <p className="mt-3 text-xs text-zinc-600">No revenue tracked yet.</p> : (
              <div className="mt-3 space-y-2">
                {revenueData.map(r => { const g = gigs.find(x => x.id === r.gigId); return (
                  <div key={r.gigId} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                    <div><p className="text-sm font-semibold text-zinc-200">{g?.title ?? r.gigId}</p><p className="text-xs text-zinc-500">{r.notes}</p></div>
                    <div className="flex items-center gap-3"><span className="text-sm font-black text-fuchsia-400">{r.amount} {r.currency}</span>
                      <span className={"text-xs rounded-full px-2 py-0.5 font-semibold " + (r.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>{r.paid ? "Paid" : "Pending"}</span>
                    </div>
                  </div>);})}
              </div>)}
          </Card>
        </div>
      )}

      {tab === "add" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-1">Add a Lead Manually</h2>
            <p className="text-sm text-zinc-500 mb-4">Paste anything. Contacts extracted automatically.</p>
            <textarea value={manualText} onChange={e => setManualText(e.target.value)} rows={8}
              placeholder="Example: White Dubai looking for DJ contact bookings@whitedubai.com WhatsApp +971 50 123 4567"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-200 focus:border-fuchsia-500 focus:outline-none resize-none" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-zinc-600">{manualText.length} chars</p>
              <button onClick={() => void addManual()} disabled={manualBusy || !manualText.trim()} className="rounded-xl bg-fuchsia-600 px-6 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40 transition">
                {manualBusy ? "Processing..." : "Extract and Add"}
              </button>
            </div>
            {manualMsg && <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">{manualMsg}</div>}
          </Card>
          <Card className="p-5"><h2 className="text-lg font-bold mb-3">Quick Add - Top Dubai Venues</h2>
            <div className="flex flex-wrap gap-2">
              {UAE_VENUES.map(v => (<button key={v.name} onClick={() => { setManualText("DJ booking at " + v.name + " (" + v.area + ", Dubai). " + v.bookingNotes + " Contact: " + v.email); setTab("add"); }} className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:border-fuchsia-500/50 transition">{v.name}</button>))}
            </div>
          </Card>
        </div>
      )}

      {tab === "sources" && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-bold mb-2">Sources</h2>
            <div className="mb-4 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-3">
              <p className="text-xs font-bold text-fuchsia-300">40+ built-in UAE sources - always active</p>
              <p className="text-[11px] text-zinc-400 mt-1">Indeed x3, Bayt x2, GulfTalent, NaukriGulf, Hozpitality, Dubizzle, Monster, Reddit x4, Twitter/Nitter x5, Eventbrite x3, Meetup, Time Out Dubai, Resident Advisor, Platinumlist, Visit Dubai, Dubai Calendar, Gulf News, Khaleej Times, Hospitality Net, Total Jobs. Auto-sweep 09:00 and 21:00 Dubai daily.</p>
            </div>
            {countries.map(c => (
              <div key={c.code} className="mb-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className="text-xl">{c.flag}</span><div><p className="text-sm font-bold text-white">{c.name}</p><p className="text-xs text-zinc-500">{c.feeds.length} feeds</p></div></div>
                  <button onClick={() => { const u = countries.map(x => x.code === c.code ? { ...x, active: !x.active } : x); setCountries(u); saveRegistry(u); }} className={"px-3 py-1 rounded-full text-xs font-bold transition " + (c.active ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-zinc-800 text-zinc-500 border border-zinc-700")}>{c.active ? "ACTIVE" : "OFF"}</button>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

function RevenueTracker({ gigId, existing, onSave }: { gigId: string; existing: GigRevenue | undefined; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"AED" | "USD" | "EUR">("AED");
  const [notes, setNotes] = useState("");
  if (existing) return (
    <div className="flex items-center gap-3">
      <span className={"text-xs rounded-full px-2 py-0.5 font-semibold " + (existing.paid ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>{existing.paid ? "Paid" : "Pending"}</span>
      <span className="text-xs text-zinc-500">{existing.amount} {existing.currency}</span>
      <button onClick={() => { upsertGigRevenue({ ...existing, paid: !existing.paid }); onSave(); }} className="text-xs text-zinc-600 hover:text-fuchsia-400">toggle</button>
    </div>
  );
  if (!open) return <button onClick={() => setOpen(true)} className="text-xs text-zinc-600 hover:text-fuchsia-400">+ Track payment</button>;
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} className="w-24 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
      <select value={currency} onChange={e => setCurrency(e.target.value as "AED" | "USD" | "EUR")} className="rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200"><option>AED</option><option>USD</option><option>EUR</option></select>
      <input placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} className="flex-1 min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none" />
      <button onClick={() => { if (amount) { upsertGigRevenue({ gigId, amount: parseFloat(amount), currency, paid: false, invoiceSent: false, notes }); onSave(); setOpen(false); } }} className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white">Save</button>
      <button onClick={() => setOpen(false)} className="text-xs text-zinc-600">Cancel</button>
    </div>
  );
}