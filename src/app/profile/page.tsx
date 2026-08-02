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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => { setP(d.profile); setGaps(d.gaps); });
  }, []);

  if (!p) return <main className="p-6 text-sm text-zinc-500">Loading…</main>;

  const set = (patch: Partial<ArtistProfile>) => setP({ ...p, ...patch } as ArtistProfile);

  async function save() {
    const res = await fetch("/api/profile", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p),
    });
    const d = await res.json();
    setP(d.profile); setGaps(d.gaps);
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
        <Field label="SoundCloud" value={p.soundcloud ?? ""} onChange={(v) => set({ soundcloud: v })} />
      </Section>

      <Section title="Sound">
        <ListField label="Core genres (drives fit scoring)" value={p.genres} onChange={(v) => set({ genres: v })} />
        <ListField label="Will also play" value={p.secondaryGenres} onChange={(v) => set({ secondaryGenres: v })} />
        <ListField label="Won't play (auto-rejected)" value={p.wontPlay} onChange={(v) => set({ wontPlay: v })} />
      </Section>

      <Section title="Rates — AED for a standard 2h peak set">
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
