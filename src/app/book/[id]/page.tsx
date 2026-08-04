import { getGig } from "@/lib/db";
import { quoteFor } from "@/lib/outreach";
import { activeProfile } from "@/lib/active-profile";
import { registerProfileLoader } from "@/lib/profile-store";
import { registerSettingsLoader } from "@/lib/settings-store";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

registerProfileLoader();
registerSettingsLoader();

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const g = getGig(id);
  if (!g) return {};
  return {
    title: `Book ${activeProfile().name} — ${g.venueName ?? g.title}`,
    description: `Live booking page for ${g.venueName ?? g.title}. Request this date directly.`,
  };
}

/**
 * A shareable, client-facing booking page — the thing she texts a booker in one
 * tap. Public on purpose (no auth): a client opens this link and sees the
 * artist's EPK, the date, and can request the booking in two taps, which lands
 * in EVG's inbox. This is the seed of the marketplace and a real edge — no
 * booking tool lets an artist hand a client a live, per-opportunity booking
 * page straight off their own radar.
 */
export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = getGig(id);
  if (!g) notFound();

  const p = activeProfile();
  const m = p.management;
  const q = quoteFor(g);
  const when = g.eventDate
    ? new Date(g.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "date to be agreed";
  const setLen = g.setLengthMins ? `${(g.setLengthMins / 60).toFixed(1)} hours` : "2 hours";

  const subject = `Booking request — ${p.name} for ${g.venueName ?? "your event"}${g.eventDate ? ` (${g.eventDate})` : ""}`;
  const body = [
    `Hi ${m.contactName} at ${m.company},`,
    ``,
    `We'd like to book ${p.name} for the following:`,
    `  • Event: ${g.title}`,
    g.venueName ? `  • Venue: ${g.venueName}${g.area ? `, ${g.area}` : ""}` : "",
    `  • Date: ${when}`,
    `  • Set: ${setLen}${g.slot && g.slot !== "unknown" ? ` (${g.slot} slot)` : ""}`,
    ``,
    `Please share availability and the booking confirmation.`,
    ``,
    `Thanks,`,
    `[Your name] · [Your company]`,
  ].filter(Boolean).join("\n");
  const mailto = `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  const eventLabel = g.venueName ?? g.title;
  const wa = m.phone ? `https://wa.me/${m.phone.replace(/\D/g, "")}?text=${encodeURIComponent(subject + " — " + eventLabel)}` : null;

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Booking request — {g.area ? `${g.area}, ` : ""}UAE
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">{g.venueName ?? g.title}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {when} · {setLen}
          {g.genresWanted.length ? ` · ${g.genresWanted.join(", ")}` : ""}
        </p>

        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">{p.name}</span>
            <span className="text-lg font-bold text-emerald-400">AED {q.askAed.toLocaleString()}</span>
          </div>
          <p className="mt-2 text-xs text-zinc-500">{p.tagline}</p>
          <div className="mt-3 space-y-1">
            {p.sellingPoints.slice(0, 3).map((sp) => (
              <div key={sp} className="flex gap-2 text-xs text-zinc-400">
                <span className="text-red-500">▸</span><span>{sp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-2">
          <a href={mailto}
             className="block rounded-lg bg-red-600 py-3 text-center text-sm font-semibold text-white">
            Request this booking
          </a>
          {wa && (
            <a href={wa}
               className="block rounded-lg border border-emerald-600/50 bg-emerald-600/10 py-3 text-center text-sm font-semibold text-emerald-300">
              WhatsApp {m.company}
            </a>
          )}
          <p className="pt-1 text-center text-[11px] text-zinc-600">
            Your request goes straight to {m.company} ({m.contactRole}: {m.contactName}).
          </p>
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-zinc-600">
        Bookings are contracted through {m.legalName} t/a {m.company} · {m.phone}
      </p>
    </main>
  );
}
