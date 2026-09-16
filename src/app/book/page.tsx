import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DJ Emy — Booking | Emy Vision Group",
  description:
    "FIFA World Cup Qatar 2022 & Arab Cup 2025 official tournament DJ. Afro House · Afro Tech · Tribal. Based in Dubai & Doha. Book through Emy Vision Group.",
  openGraph: {
    title: "DJ Emy — Booking",
    description:
      "One of the GCC's few female Afro House DJs commanding a peak-time floor. FIFA World Cup 2022 · Arab Cup 2025 · 100% live.",
    images: ["/press/hero.jpg"],
    type: "profile",
  },
};

const WHATSAPP_NUMBER = "971503443281";
const WHATSAPP_MSG = encodeURIComponent(
  "Hi Kirth — I'd like to enquire about booking DJ Emy for an upcoming event."
);
const WA_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MSG}`;
const IG_LINK = "https://instagram.com/dj_emy_";
const YT_LINK = "https://youtube.com/@DJEMY-o6d";
const EVG_LINK = "https://emyvisiongroup.com";

export default function BookPage() {
  return (
    <main id="epk-print" className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/press/hero.jpg"
          alt="DJ Emy performing live"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
        <div className="relative z-10 w-full px-5 pb-10 pt-32 sm:px-10 sm:pb-16">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-fuchsia-400">
            Emy Vision Group presents
          </p>
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-7xl md:text-8xl">
            DJ Emy
          </h1>
          <p className="mt-3 max-w-lg text-lg text-zinc-300 sm:text-xl">
            Afro House · Afro Tech · Tribal
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            Dubai · Doha · GCC
          </p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-base font-bold text-black shadow-lg shadow-green-500/30 transition hover:bg-green-400 hover:shadow-green-400/40"
            >
              <WhatsAppIcon /> Book DJ Emy
            </a>
            <a
              href={`mailto:admin@emyvisiongroup.com?subject=${encodeURIComponent("Booking Enquiry — DJ Emy")}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-zinc-900/80 px-7 py-3.5 text-base font-semibold text-zinc-100 transition hover:border-fuchsia-500 hover:bg-zinc-800"
            >
              ✉ Email EVG
            </a>
          </div>
        </div>
      </section>

      {/* ── CREDENTIALS BAR ──────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-950">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-0 sm:grid-cols-4">
          {[
            { label: "FIFA World Cup", sub: "Qatar 2022 — Official DJ" },
            { label: "FIFA Arab Cup", sub: "Qatar 2025 — Tournament DJ" },
            { label: "100% Live", sub: "No pre-recorded sets" },
            { label: "Bilingual", sub: "English & Arabic floors" },
          ].map((c) => (
            <div key={c.label} className="border-b border-r border-zinc-800 px-4 py-5 text-center last:border-r-0 sm:last:border-r-0">
              <div className="text-xs font-bold uppercase tracking-wider text-fuchsia-400">
                {c.label}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-zinc-400">
                {c.sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-10">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          One of the GCC&apos;s few female Afro House DJs
          <br className="hidden sm:block" /> commanding a peak-time floor.
        </h2>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-zinc-400">
          <p>
            DJ Emy builds the night in arcs — deep, tribal grooves that open a room,
            then drives it to peak. She reads the room in real time, moving fluently
            between English and Arabic crowds with an energy that&apos;s impossible
            to fake.
          </p>
          <p>
            She was selected as an official tournament DJ for the{" "}
            <strong className="text-white">FIFA World Cup Qatar 2022</strong> and the{" "}
            <strong className="text-white">FIFA Arab Cup Qatar 2025</strong> — two of
            the biggest sporting events in the Gulf — performing for thousands of
            international guests under full broadcast production.
          </p>
          <p>
            From beach clubs at golden hour to superclubs at 3am, from private
            yacht parties to brand activations — she adapts her sound to the room
            while keeping it unmistakably hers.
          </p>
        </div>
      </section>

      {/* ── PHOTO STRIP ──────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 sm:px-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/press/dj-emy-action.jpg"
            alt="DJ Emy performing at a beach club"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/press/dj-emy-portrait.jpg"
            alt="DJ Emy press portrait"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
        </div>
      </section>

      {/* ── SELECTED APPEARANCES ─────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-10">
        <h2 className="text-xl font-bold text-white">Selected Appearances</h2>
        <ul className="mt-6 space-y-3">
          {[
            { event: "FIFA World Cup Qatar 2022", detail: "Official tournament DJ — multiple venues, international crowds" },
            { event: "FIFA Arab Cup Qatar 2025", detail: "Tournament DJ — broadcast production, VIP hospitality" },
            { event: "Zeus, Jumeirah Beach", detail: "Eid headline sets — peak-time club, 500+ capacity" },
            { event: "Amwaj Rooftop", detail: "Signature golden-hour sunset sessions — deep, tribal grooves" },
            { event: "Harry Water Park, Trinidad & Tobago", detail: "Caribbean tour 2025 — international festival stage" },
            { event: "Private & VIP, UAE", detail: "Villas, yachts, brand launches, cultural events" },
          ].map((a) => (
            <li key={a.event} className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 py-3">
              <span className="mt-0.5 text-fuchsia-400">▸</span>
              <div>
                <div className="text-sm font-semibold text-white">{a.event}</div>
                <div className="text-xs text-zinc-500">{a.detail}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ── LISTEN ───────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-14 sm:px-10">
        <h2 className="text-xl font-bold text-white">Listen</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Full-length DJ mixes — hear exactly what she brings to a floor.
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800">
          <iframe
            className="aspect-video w-full"
            src="https://www.youtube.com/embed?listType=user_uploads&list=DJEMY-o6d"
            title="DJ Emy — Live Sets"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-3 print:hidden">
          <a href={YT_LINK} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-red-800 bg-red-950/40 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-900/60">
            ▶ YouTube Channel
          </a>
          <a href={IG_LINK} target="_blank" rel="noopener" className="inline-flex items-center gap-2 rounded-full border border-pink-800 bg-pink-950/30 px-5 py-2.5 text-sm font-semibold text-pink-300 transition hover:bg-pink-900/50">
            📸 @dj_emy_
          </a>
        </div>
      </section>

      {/* ── WHAT SHE PLAYS ───────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-5 pb-14 sm:px-10">
        <h2 className="text-xl font-bold text-white">Genres & Formats</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Afro House", "Afro Tech", "Tribal", "Melodic House", "Organic House", "Deep House", "Open Format"].map((g) => (
            <span key={g} className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-300">
              {g}
            </span>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Ideal For</div>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              <li>Beach clubs & day parties</li>
              <li>Rooftop lounges & golden hour</li>
              <li>Superclubs & peak-time slots</li>
              <li>Brand activations & launches</li>
              <li>Private events, yachts & villas</li>
              <li>Festivals & cultural events</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">Technical</div>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              <li>Pioneer CDJ-3000 / DJM-900NXS2</li>
              <li>Travels with USB — adapts to venue</li>
              <li>2–4 hour sets standard</li>
              <li>Soundcheck 45 min before doors</li>
              <li>Bilingual crowd work (EN/AR)</li>
              <li>Full EVG representation & contract</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── BOOKING CTA ──────────────────────────────────── */}
      <section className="border-t border-zinc-800 bg-zinc-950">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:px-10">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Book DJ Emy
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400">
            All bookings through Emy Vision Group. One accountable point of
            contact — contracts, invoices, tech rider, all handled.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center print:hidden">
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-500 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-green-500/25 transition hover:bg-green-400 sm:w-auto"
            >
              <WhatsAppIcon /> WhatsApp Kirth
            </a>
            <a
              href={`mailto:admin@emyvisiongroup.com?subject=${encodeURIComponent("Booking Enquiry — DJ Emy")}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-600 bg-zinc-900 px-8 py-4 text-lg font-semibold text-zinc-100 transition hover:border-fuchsia-500 sm:w-auto"
            >
              ✉ admin@emyvisiongroup.com
            </a>
          </div>
          <div className="mt-8 space-y-1 text-xs text-zinc-600">
            <p>
              <strong className="text-zinc-400">Management:</strong> Kirth · Business Development · Emy Vision Group
            </p>
            <p>
              <strong className="text-zinc-400">Phone:</strong> +971 50 344 3281 ·{" "}
              <strong className="text-zinc-400">Based:</strong> Dubai & Doha
            </p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-zinc-800 py-6 text-center text-[11px] text-zinc-700">
        © {new Date().getFullYear()} Emy Vision Group FZC ·{" "}
        <a href={EVG_LINK} className="hover:text-zinc-500">emyvisiongroup.com</a>
      </footer>
    </main>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
