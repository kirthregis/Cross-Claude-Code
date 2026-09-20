"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfile, saveProfile } from "@/lib/profile-store";
import type { ArtistProfile } from "@/lib/artist";
import type { VenueTier } from "@/lib/types";
import { Card, SectionLabel, Button } from "@/components/studio/ui";

const TIERS: VenueTier[] = [
  "superclub", "beach_club", "festival", "brand_activation", "hotel_lounge", "bar_restaurant", "private_event", "unknown", "hotel", "private", "other"
];

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none"
      />
    </label>
  );
}

function ListField({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string[]; onChange: (v: string[]) => void; placeholder?: string; rows?: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label} <span className="normal-case text-zinc-600">(one per line)</span></span>
      <textarea
        value={value.join("\n")}
        onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:border-fuchsia-500 focus:outline-none resize-y"
      />
    </label>
  );
}

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

  const set = <K extends keyof ArtistProfile>(key: K, value: ArtistProfile[K]) =>
    setProfileState((p) => ({ ...p, [key]: value }));

  const setMgmt = <K extends keyof ArtistProfile["management"]>(key: K, value: ArtistProfile["management"][K]) =>
    setProfileState((p) => ({ ...p, management: { ...p.management, [key]: value } }));

  const setBank = (key: "accountName" | "bankName" | "iban" | "swift" | "notes", value: string) =>
    setProfileState((p) => ({
      ...p,
      management: {
        ...p.management,
        bank: { accountName: "", bankName: "", iban: "", ...p.management.bank, [key]: value },
      },
    }));

  const setRider = <K extends keyof ArtistProfile["techRider"]>(key: K, value: ArtistProfile["techRider"][K]) =>
    setProfileState((p) => ({ ...p, techRider: { ...p.techRider, [key]: value } }));

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link href="/studio" className="text-sm text-zinc-400 hover:text-white">
            ← Back to Studio
          </Link>
          {saved && <span className="text-xs font-semibold text-emerald-400">✓ Profile saved on this device</span>}
        </div>
        <h1 className="mt-4 text-3xl font-black">{profile.name || "Your Profile"}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          This is your own copy of the app. Everything here is saved only in this browser — fill in your real name, contact, bio and rider, and every pitch, contract, invoice and EPK document will use your details instead of the sample ones.
        </p>

        <div className="mt-6 space-y-4">
          <Card className="p-5">
            <SectionLabel>Identity</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Artist / DJ name" value={profile.name} onChange={(v) => set("name", v)} placeholder="e.g. DJ Emy" />
              <Field label="Full legal name" value={profile.legalName} onChange={(v) => set("legalName", v)} placeholder="For contracts" />
              <Field label="Tagline" value={profile.tagline} onChange={(v) => set("tagline", v)} placeholder="e.g. Afro House DJ" />
              <Field label="Based in" value={profile.basedIn} onChange={(v) => set("basedIn", v)} placeholder="e.g. Dubai, UAE" />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Contact — this is what goes out on every pitch and document</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Your email" value={profile.email} onChange={(v) => set("email", v)} placeholder="you@example.com" />
              <Field label="Your phone / WhatsApp" value={profile.phone} onChange={(v) => set("phone", v)} placeholder="+971 5X XXX XXXX" />
              <Field label="Instagram" value={profile.instagram || ""} onChange={(v) => set("instagram", v)} placeholder="@yourhandle" />
              <Field label="YouTube" value={profile.youtube || ""} onChange={(v) => set("youtube", v)} />
              <Field label="SoundCloud" value={profile.soundcloud || ""} onChange={(v) => set("soundcloud", v)} />
              <Field label="EPK link (optional)" value={profile.epkUrl || ""} onChange={(v) => set("epkUrl", v)} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Sound</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ListField label="Main genres" value={profile.genres} onChange={(v) => set("genres", v)} rows={3} />
              <ListField label="Secondary genres" value={profile.secondaryGenres} onChange={(v) => set("secondaryGenres", v)} rows={3} />
              <ListField label="Languages" value={profile.languages} onChange={(v) => set("languages", v)} rows={2} />
              <ListField label="Won&apos;t play" value={profile.wontPlay} onChange={(v) => set("wontPlay", v)} rows={2} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Positioning — used in pitches, contracts and your press kit</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ListField label="Selling points" value={profile.sellingPoints} onChange={(v) => set("sellingPoints", v)} rows={5} />
              <ListField label="Selected appearances" value={profile.selectedAppearances} onChange={(v) => set("selectedAppearances", v)} rows={5} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Management & Representation</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">Leave this the same as your own contact above if you book for yourself directly.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Company / agency name" value={profile.management.company} onChange={(v) => setMgmt("company", v)} />
              <Field label="Company legal name" value={profile.management.legalName} onChange={(v) => setMgmt("legalName", v)} />
              <Field label="Trade licence no." value={profile.management.tradeLicenceNo || ""} onChange={(v) => setMgmt("tradeLicenceNo", v)} />
              <Field label="Registered address" value={profile.management.address || ""} onChange={(v) => setMgmt("address", v)} />
              <Field label="Manager / contact name" value={profile.management.contactName} onChange={(v) => setMgmt("contactName", v)} />
              <Field label="Contact role" value={profile.management.contactRole} onChange={(v) => setMgmt("contactRole", v)} />
              <Field label="Management email" value={profile.management.email} onChange={(v) => setMgmt("email", v)} />
              <Field label="Management phone" value={profile.management.phone} onChange={(v) => setMgmt("phone", v)} />
              <Field label="Management Instagram" value={profile.management.instagram || ""} onChange={(v) => setMgmt("instagram", v)} />
              <Field label="Website" value={profile.management.website || ""} onChange={(v) => setMgmt("website", v)} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Settlement / Banking — shown on invoices</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">Stored only on this device. Never leave this blank if you plan to send real invoices — otherwise the sample bank details will show instead of yours.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="Account name" value={profile.management.bank?.accountName || ""} onChange={(v) => setBank("accountName", v)} />
              <Field label="Bank name" value={profile.management.bank?.bankName || ""} onChange={(v) => setBank("bankName", v)} />
              <Field label="IBAN" value={profile.management.bank?.iban || ""} onChange={(v) => setBank("iban", v)} />
              <Field label="SWIFT / BIC" value={profile.management.bank?.swift || ""} onChange={(v) => setBank("swift", v)} />
              <Field label="Notes (account no., other currencies)" value={profile.management.bank?.notes || ""} onChange={(v) => setBank("notes", v)} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Tech Rider — feeds the contract and the EPK page&apos;s generated rider</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ListField label="Mixer(s)" value={profile.techRider.mixer} onChange={(v) => setRider("mixer", v)} rows={2} />
              <ListField label="Player(s)" value={profile.techRider.players} onChange={(v) => setRider("players", v)} rows={2} />
              <Field label="Monitoring" value={profile.techRider.monitors} onChange={(v) => setRider("monitors", v)} />
              <ListField label="Booth requirements" value={profile.techRider.booth} onChange={(v) => setRider("booth", v)} rows={3} />
              <ListField label="Connectivity" value={profile.techRider.connectivity} onChange={(v) => setRider("connectivity", v)} rows={2} />
              <ListField label="Notes" value={profile.techRider.notes} onChange={(v) => setRider("notes", v)} rows={3} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Hospitality Rider</SectionLabel>
            <div className="mt-3">
              <ListField label="Requirements" value={profile.hospitalityRider} onChange={(v) => set("hospitalityRider", v)} rows={4} />
            </div>
          </Card>

          <Card className="p-5">
            <SectionLabel>Base rates (AED, 2h peak set)</SectionLabel>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {TIERS.map((tier) => (
                <label key={tier} className="block rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                  <span className="text-xs uppercase text-zinc-500">{tier.replace("_", " ")}</span>
                  <input
                    type="number"
                    value={profile.baseRatesAed[tier] ?? 0}
                    onChange={(e) => set("baseRatesAed", { ...profile.baseRatesAed, [tier]: Number(e.target.value) || 0 })}
                    className="mt-1 w-full bg-transparent text-sm font-bold text-emerald-400 focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-2 pb-8">
            <Button onClick={handleSave}>Save Profile</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
