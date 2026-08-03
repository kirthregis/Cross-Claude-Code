"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ArtistProfile } from "@/lib/artist";
import type { VenueTier } from "@/lib/types";

const TIERS: VenueTier[] = [
  "superclub", "beach_club", "festival", "brand_activation",
  "private_event", "hotel_lounge", "bar_restaurant", "unknown",
];

export default function ProfilePage() {
  const [p, setP] = useState<ArtistProfile | null>(null);
  const [gaps, setGaps] = useState<string[]>([]);
  const [estimates, setEstimates] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => { setP(d.profile); setGaps(d.gaps); setEstimates(d.ratesAreEstimates); });
  }, []);

  if (!p) return <main className="p-6 text-sm text-zinc-500">Loading…</main>;

  const set = (patch: Partial<ArtistProfile>) => setP({ ...p, ...patch } as ArtistProfile);

  async function save() {
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    });
    const d = await res.json();
    setP(d.profile); setGaps(d.gaps); setEstimates(d.ratesAreEstimates);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-6">
      <Link href="/" className="text-xs text-red-500">← Dashboard</Link>
      <h1 className="mb-1 mt-3 text-xl font-bold">Artist profile</h1>
      <p className="mb-5 text-xs text-zinc-500">
        Everything here feeds pricing, pitches and contracts. The rates especially — the quote engine
        is only as accurate as these numbers.
      </p>

      {gaps.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-600/40 bg-amber-500/10 p-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">Still needed</h2>
          <ul className="mt-2 space-y-1 text-xs text-amber-200/90">
            {gaps.map((g) => <li key={g}>· {g}</li>)}
          </ul>
        </div>
      )}

      <DocImport onApplied={(prof, g) => { setP(prof); setGaps(g); }} />

      <Section title="Identity">
        <Field label="Stage name" value={p.name} onChange={(v) => set({ name: v })} />
        <Field label="Full legal name (for contracts)" value={p.legalName} onChange={(v) => set({ legalName: v })} />
        <Field label="Tagline" value={p.tagline} onChange={(v) => set({ tagline: v })} />
        <Field label="Based in" value={p.basedIn} onChange={(v) => set({ basedIn: v })} />
      </Section>

      <Section title="Contact & links">
        <Field label="Booking email" value={p.email} onChange={(v) => set({ email: v })} />
        <Field label="Phone / WhatsApp" value={p.phone} onChange={(v) => set({ phone: v })} />
        <Field label="Instagram" value={p.instagram ?? ""} onChange={(v) => set({ instagram: v })} />
        <Field label="EPK / mixes URL" value={p.epkUrl ?? ""} onChange={(v) => set({ epkUrl: v })} />
        <Field label="YouTube (live sets)" value={p.youtube ?? ""} onChange={(v) => set({ youtube: v })} />
        <Field label="SoundCloud" value={p.soundcloud ?? ""} onChange={(v) => set({ soundcloud: v })} />
      </Section>

      <Section title="Management — Emy Vision Group">
        <p className="mb-2 text-[11px] leading-relaxed text-zinc-500">
          EVG is the contracting party on every booking. Pitches are sent from here, payments
          are made here, and the contract is signed here on the artist&apos;s behalf.
        </p>
        <Field label="Company (trading name)" value={p.management.company}
          onChange={(v) => set({ management: { ...p.management, company: v } })} />
        <Field label="Registered legal entity (exactly as on the trade licence)" value={p.management.legalName}
          onChange={(v) => set({ management: { ...p.management, legalName: v } })} />
        <Field label="Trade licence number" value={p.management.tradeLicenceNo ?? ""}
          onChange={(v) => set({ management: { ...p.management, tradeLicenceNo: v } })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Contact name" value={p.management.contactName}
            onChange={(v) => set({ management: { ...p.management, contactName: v } })} />
          <Field label="Role" value={p.management.contactRole}
            onChange={(v) => set({ management: { ...p.management, contactRole: v } })} />
        </div>
        <Field label="Booking email" value={p.management.email}
          onChange={(v) => set({ management: { ...p.management, email: v } })} />
        <Field label="Booking phone" value={p.management.phone}
          onChange={(v) => set({ management: { ...p.management, phone: v } })} />
        <Field label="Instagram" value={p.management.instagram ?? ""}
          onChange={(v) => set({ management: { ...p.management, instagram: v } })} />
      </Section>

      <Section title="Sound">
        <ListField label="Core genres (drives fit scoring)" value={p.genres} onChange={(v) => set({ genres: v })} />
        <ListField label="Will also play" value={p.secondaryGenres} onChange={(v) => set({ secondaryGenres: v })} />
        <ListField label="Won't play (auto-rejected)" value={p.wontPlay} onChange={(v) => set({ wontPlay: v })} />
      </Section>

      <Section title="Bank details — for invoices">
        <div className="mb-3 rounded-lg border border-zinc-700 bg-zinc-950/60 p-3">
          <p className="text-[11px] leading-relaxed text-zinc-400">
            🔒 Stored only in your own local database and printed on invoices. Never sent
            anywhere else, never logged. Enter them here rather than sharing them over
            chat or email.
          </p>
        </div>
        <Field label="Account name" value={p.management.bank?.accountName ?? ""}
          onChange={(v) => set({ management: { ...p.management, bank: { ...(p.management.bank ?? { accountName: "", bankName: "", iban: "" }), accountName: v } } })} />
        <Field label="Bank" value={p.management.bank?.bankName ?? ""}
          onChange={(v) => set({ management: { ...p.management, bank: { ...(p.management.bank ?? { accountName: "", bankName: "", iban: "" }), bankName: v } } })} />
        <Field label="IBAN" value={p.management.bank?.iban ?? ""}
          onChange={(v) => set({ management: { ...p.management, bank: { ...(p.management.bank ?? { accountName: "", bankName: "", iban: "" }), iban: v } } })} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="SWIFT / BIC" value={p.management.bank?.swift ?? ""}
            onChange={(v) => set({ management: { ...p.management, bank: { ...(p.management.bank ?? { accountName: "", bankName: "", iban: "" }), swift: v } } })} />
          <Field label="Notes (branch, a/c no.)" value={p.management.bank?.notes ?? ""}
            onChange={(v) => set({ management: { ...p.management, bank: { ...(p.management.bank ?? { accountName: "", bankName: "", iban: "" }), notes: v } } })} />
        </div>
      </Section>

      <Section title="Rates — AED for a standard 2h peak set">
        {estimates && (
          <div className="mb-3 rounded-lg border border-amber-600/40 bg-amber-500/10 p-3">
            <p className="text-xs font-semibold text-amber-300">These are market estimates, not her real rates.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-amber-200/80">
              They&apos;re set for her positioning — FIFA credits, genre scarcity, full EVG
              representation — but every quote, pitch and contract is built on them.
              Enter her actual fees from past bookings to make the engine accurate.
            </p>
          </div>
        )}
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          These are the base numbers every quote is built from. Multipliers for season, night,
          set length, exclusivity and short notice are applied on top automatically.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {TIERS.map((t) => (
            <label key={t} className="block">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">{t.replace(/_/g, " ")}</span>
              <input
                type="number"
                value={p.baseRatesAed[t]}
                onChange={(e) => set({ baseRatesAed: { ...p.baseRatesAed, [t]: Number(e.target.value) } })}
                className="mt-0.5 w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600"
              />
            </label>
          ))}
        </div>
        <div className="mt-3">
          <Field
            label="Absolute floor — never play below this, any venue"
            type="number"
            value={String(p.hardFloorAed)}
            onChange={(v) => set({ hardFloorAed: Number(v) })}
          />
        </div>
      </Section>

      <Section title="Contract defaults">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Deposit %" type="number" value={String(p.contractDefaults.depositPercent)}
            onChange={(v) => set({ contractDefaults: { ...p.contractDefaults, depositPercent: Number(v) } })} />
          <Field label="Deposit due (days before)" type="number" value={String(p.contractDefaults.depositDueDays)}
            onChange={(v) => set({ contractDefaults: { ...p.contractDefaults, depositDueDays: Number(v) } })} />
        </div>
        <Field label="Default radius clause (km)" type="number" value={String(p.contractDefaults.defaultExclusivityKm)}
          onChange={(v) => set({ contractDefaults: { ...p.contractDefaults, defaultExclusivityKm: Number(v) } })} />
      </Section>

      <div className="fixed inset-x-0 bottom-0 border-t border-zinc-800 bg-[#0a0a0f]/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button onClick={save} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold">
            Save profile
          </button>
          {saved && <span className="text-xs text-emerald-400">Saved ✓ — pricing updated everywhere</span>}
        </div>
      </div>
    </main>
  );
}

/** Upload the EVG licence / bank documents and read the fields out of them. */
function DocImport({ onApplied }: { onApplied: (p: ArtistProfile, gaps: string[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [found, setFound] = useState<Record<string, string> | null>(null);
  const [missing, setMissing] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);

  async function send(apply: boolean) {
    if (!files?.length) return;
    setBusy(true); setErrors([]);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    fd.append("apply", String(apply));
    try {
      const res = await fetch("/api/profile/import", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) { setErrors([d.error, ...(d.errors ?? [])].filter(Boolean)); return; }
      const raw = d.found as Record<string, string> & { missing?: string[] };
      const rest: Record<string, string> = {};
      for (const [k, v] of Object.entries(raw)) {
        if (k !== "preview" && k !== "missing" && typeof v === "string") rest[k] = v;
      }
      setFound(rest); setMissing(raw.missing ?? []); setErrors(d.errors ?? []);
      if (d.applied) {
        const pr = await fetch("/api/profile").then((r) => r.json());
        onApplied(pr.profile, pr.gaps);
      }
    } catch (e) {
      setErrors([String(e)]);
    } finally { setBusy(false); }
  }

  const LABELS: Record<string, string> = {
    legalName: "Legal entity", tradeLicenceNo: "Trade licence no.",
    accountName: "Account name", bankName: "Bank", iban: "IBAN", swift: "SWIFT",
  };

  return (
    <Section title="Import from documents">
      <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
        Upload the EVG business licence and bank details (PDF, .md or .txt) and the
        fields are read out automatically — no retyping, and nothing has to go through
        chat or email. Files are parsed in memory, never saved to disk, and only the
        extracted fields are stored locally.
      </p>

      <input
        type="file" multiple accept=".pdf,.md,.txt,.csv"
        onChange={(e) => { setFiles(e.target.files); setFound(null); }}
        className="w-full text-xs file:mr-3 file:rounded file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-xs file:text-zinc-200"
      />

      <div className="mt-2 flex gap-2">
        <button onClick={() => send(false)} disabled={busy || !files?.length}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">
          {busy ? "Reading…" : "Read files"}
        </button>
        {found && (
          <button onClick={() => send(true)} disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-medium disabled:opacity-40">
            Save these values
          </button>
        )}
      </div>

      {found && (
        <div className="mt-3 rounded-lg bg-zinc-950 p-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Check before saving
          </p>
          <table className="w-full text-xs">
            <tbody>
              {Object.entries(LABELS).map(([k, label]) =>
                found[k] ? (
                  <tr key={k} className="border-b border-zinc-800/60 last:border-0">
                    <td className="py-1.5 text-zinc-500">{label}</td>
                    <td className="py-1.5 text-right font-mono text-zinc-100">{found[k]}</td>
                  </tr>
                ) : null
              )}
            </tbody>
          </table>
          {missing.length > 0 && (
            <p className="mt-2 text-[11px] text-amber-400">
              Not found — type these in below: {missing.join(", ")}
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-[11px] text-rose-400">
          {errors.map((e, i) => <li key={i}>· {e}</li>)}
        </ul>
      )}
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  const placeholder = /PLACEHOLDER|XXX/i.test(value);
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className={`mt-0.5 w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600 ${
          placeholder ? "text-amber-400" : ""
        }`}
      />
    </label>
  );
}

function ListField({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        value={value.join(", ")}
        onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        className="mt-0.5 w-full rounded bg-zinc-950 p-2 text-sm outline-none focus:ring-1 focus:ring-red-600"
      />
      <span className="text-[10px] text-zinc-600">Comma separated</span>
    </label>
  );
}
