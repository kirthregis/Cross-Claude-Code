"use client";

import { useState, useMemo } from "react";

const EVG_PHONE = "971503443281";

interface Venue {
  name: string;
  area: string;
  type: "beach_club" | "nightclub" | "rooftop" | "hotel" | "private" | "restaurant";
  pay: string;
  whatsapp?: string;
  instagram: string;
  email?: string;
  notes: string;
  pitch: string;
}

const VENUES: Venue[] = [
  // ── BEACH CLUBS (highest probability — Afro House fits perfectly) ──
  {
    name: "Cove Beach",
    area: "Bluewaters",
    type: "beach_club",
    pay: "AED 3,500–6,000",
    instagram: "@covebeachdubai",
    whatsapp: "971508889090",
    email: "events@covebeach.ae",
    notes: "Friday brunch & Saturday sunset are prime Afro House slots. Ask for the music programmer.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy is available for your next sunset or brunch session. She's one of the GCC's few female Afro House DJs — FIFA World Cup Qatar 2022 & Arab Cup 2025 official tournament DJ. Perfect for golden hour at Cove. Her sound: deep tribal grooves that build a room. Live sets: youtube.com/@DJEMY-o6d · Shall I send availability for this weekend?`,
  },
  {
    name: "Nikki Beach",
    area: "Pearl Jumeira",
    type: "beach_club",
    pay: "AED 4,000–6,500",
    instagram: "@nikkibeachdubai",
    whatsapp: "971509111600",
    notes: "Known for booking Afro House & melodic. Sunday sessions. DM the music director on IG.",
    pitch: `Hi — Kirth from Emy Vision Group, representing DJ Emy. Afro House / Afro Tech — FIFA World Cup 2022 & Arab Cup 2025 official DJ. She's available for your next Sunday session or weekend booking. Her sound is exactly Nikki Beach energy. Sets: youtube.com/@DJEMY-o6d · Happy to hold a date — what's coming up?`,
  },
  {
    name: "Zero Gravity",
    area: "Dubai Media City",
    type: "beach_club",
    pay: "AED 3,500–6,000",
    instagram: "@zerogravitydxb",
    whatsapp: "971505551001",
    notes: "Saturday brunches and pool parties. High-energy crowd. They book open-format and house.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for your next Saturday session? She's Afro House / Afro Tech, FIFA World Cup 2022 + Arab Cup 2025 official DJ. 100% live, reads the room. Sets: youtube.com/@DJEMY-o6d · Available this weekend if you have a slot.`,
  },
  {
    name: "DRIFT Beach Dubai",
    area: "One&Only Royal Mirage",
    type: "beach_club",
    pay: "AED 3,000–5,000",
    instagram: "@driftbeachdubai",
    notes: "Upscale, intimate. Organic house and melodic fits perfectly. Email the events team.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy is available for your next session at DRIFT. Afro House / Organic House, FIFA World Cup 2022 & Arab Cup 2025 official DJ. Her golden-hour sets are perfect for the DRIFT vibe. Sets: youtube.com/@DJEMY-o6d · Would love to discuss availability.`,
  },
  {
    name: "BLU Dubai",
    area: "Meydan",
    type: "beach_club",
    pay: "AED 3,000–5,500",
    instagram: "@bludubai",
    whatsapp: "971509500100",
    notes: "Pool club, day parties. Books commercial + house. Growing venue.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for your next pool day. Afro House / Afro Tech — FIFA World Cup 2022 + Arab Cup 2025 official DJ. She brings energy and reads the room. Sets: youtube.com/@DJEMY-o6d · Got a date coming up?`,
  },
  {
    name: "Azure Beach",
    area: "JBR",
    type: "beach_club",
    pay: "AED 2,500–4,000",
    instagram: "@azurebeachclub",
    notes: "Newer beach club. More accessible to new bookings. Good entry point.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy is a GCC-based Afro House DJ — FIFA World Cup 2022 + Arab Cup 2025 official tournament DJ. Available for your next beach session. Sets: youtube.com/@DJEMY-o6d · Would love to chat about a booking.`,
  },

  // ── NIGHTCLUBS ──
  {
    name: "WHITE Dubai",
    area: "Meydan",
    type: "nightclub",
    pay: "AED 5,000–12,000",
    instagram: "@whitedubai",
    email: "bookings@whitedubai.com",
    notes: "Peak-time superclub. They take guest DJs for warm-up and support slots. Submit EPK via email.",
    pitch: `Hi — Kirth from Emy Vision Group, representing DJ Emy. Afro House / Afro Tech, one of the GCC's few female DJs on a peak-time floor. FIFA World Cup 2022 + Arab Cup 2025 official tournament DJ. Available for guest slot. Sets: youtube.com/@DJEMY-o6d · Full EPK: emyvisiongroup.com · Would love to discuss.`,
  },
  {
    name: "Soho Garden",
    area: "Meydan",
    type: "nightclub",
    pay: "AED 3,500–6,000",
    instagram: "@sohogarden",
    whatsapp: "971544400700",
    notes: "Multi-room venue. Afro House room or the garden room are perfect fits. Wednesday & Thursday nights.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for your next Afro House or garden room slot. FIFA World Cup 2022 + Arab Cup 2025 official DJ. She's 100% live, bilingual (EN/AR). Sets: youtube.com/@DJEMY-o6d · What's on your calendar this month?`,
  },
  {
    name: "1 OAK Dubai",
    area: "DIFC",
    type: "nightclub",
    pay: "AED 4,000–8,000",
    instagram: "@1oadubai",
    notes: "Upscale DIFC crowd. Books house, open-format, Afro. Music programmer decides.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy — Afro House / Afro Tech, FIFA World Cup 2022 + Arab Cup 2025 official DJ. Available for 1 OAK. She reads the room and builds the night. Sets: youtube.com/@DJEMY-o6d · Got a slot opening up?`,
  },
  {
    name: "BLING Dubai",
    area: "Meydan",
    type: "nightclub",
    pay: "AED 3,000–5,500",
    instagram: "@blingdubai",
    notes: "Commercial + house. Open to new talent with strong credentials.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for BLING — Afro House / Afro Tech, FIFA World Cup 2022 & Arab Cup 2025 official DJ. Sets: youtube.com/@DJEMY-o6d · Let me know if you have a date.`,
  },
  {
    name: "BASE Dubai",
    area: "Meydan",
    type: "nightclub",
    pay: "AED 3,500–6,000",
    instagram: "@basedubai",
    notes: "Open-air club. House and melodic. Good fit for Afro Tech.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for BASE? Afro House / Afro Tech — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Her sound fits the BASE crowd perfectly. Sets: youtube.com/@DJEMY-o6d · Available this month.`,
  },

  // ── ROOFTOPS ──
  {
    name: "Cé La Vi",
    area: "Address Sky View",
    type: "rooftop",
    pay: "AED 4,000–7,000",
    instagram: "@celavidubai",
    whatsapp: "97148883444",
    notes: "Premium rooftop. Sunset-to-night programming. Afro House is ideal for the transition.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for Cé La Vi. Afro House / Organic House, FIFA World Cup 2022 & Arab Cup 2025 official DJ. Her golden-hour-to-peak sets are perfect for the rooftop. Sets: youtube.com/@DJEMY-o6d · Would love to discuss.`,
  },
  {
    name: "Neos",
    area: "Address Downtown",
    type: "rooftop",
    pay: "AED 3,000–5,000",
    instagram: "@neosdubai",
    notes: "68th floor, intimate, sophisticated. Deep house and organic house. Perfect for her sound.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for Neos? Deep, tribal Afro House — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Her sound suits the Neos vibe perfectly. Sets: youtube.com/@DJEMY-o6d · Availability this month?`,
  },
  {
    name: "Iris Dubai",
    area: "Meydan",
    type: "rooftop",
    pay: "AED 3,000–5,000",
    instagram: "@irismeydan",
    whatsapp: "97143219999",
    notes: "Rooftop lounge, sunset sessions. Books house, melodic, organic. Very active programming.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for Iris. Afro House / Melodic House — FIFA World Cup 2022 & Arab Cup 2025 official DJ. Sunset sets are her speciality. Sets: youtube.com/@DJEMY-o6d · What dates are you booking?`,
  },
  {
    name: "Treehouse Dubai",
    area: "Al Quoz",
    type: "rooftop",
    pay: "AED 2,500–4,500",
    instagram: "@treehousedxb",
    notes: "Underground-leaning, warehouse vibes. Afro Tech is a strong fit.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for Treehouse? Afro Tech / Tribal — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Her sound fits the underground vibe. Sets: youtube.com/@DJEMY-o6d · Got a slot?`,
  },

  // ── HOTELS ──
  {
    name: "FIVE Palm Jumeirah",
    area: "Palm Jumeirah",
    type: "hotel",
    pay: "AED 3,000–5,500",
    instagram: "@fivepalmjumeirah",
    whatsapp: "97142488888",
    notes: "Pool parties (The Penthouse) + restaurant. Saturday/Sunday sessions. High volume of bookings.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for FIVE Palm pool sessions or evening slots. Afro House / open format — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Sets: youtube.com/@DJEMY-o6d · When's your next opening?`,
  },
  {
    name: "W Dubai — The Palm",
    area: "Palm Jumeirah",
    type: "hotel",
    pay: "AED 3,000–5,000",
    instagram: "@wdubaithepalm",
    notes: "WET Deck pool sessions, sunset programming. Organic house, nu-disco. Cool, stylish crowd.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for WET Deck? Afro House / Organic House — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Her sunset sound is perfect for WET Deck. Sets: youtube.com/@DJEMY-o6d · Available this month.`,
  },
  {
    name: "Atlantis The Royal",
    area: "Palm Jumeirah",
    type: "hotel",
    pay: "AED 5,000–8,000",
    instagram: "@atlantistheroyal",
    notes: "Ultra-premium. Books through entertainment manager. Email first, follow up on WhatsApp.",
    pitch: `Hi — Kirth from Emy Vision Group. Representing DJ Emy — Afro House, FIFA World Cup 2022 & Arab Cup 2025 official tournament DJ. Available for upcoming programming at Atlantis The Royal. Full EPK and sets: youtube.com/@DJEMY-o6d · Would welcome a conversation.`,
  },
  {
    name: "Jumeirah Al Qasr",
    area: "Madinat Jumeirah",
    type: "hotel",
    pay: "AED 4,000–7,000",
    instagram: "@jumeirahalqasr",
    notes: "Multiple F&B outlets, beach, and events. Entertainment team handles all bookings.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for Jumeirah Al Qasr — beach, rooftop or events. Afro House / Melodic, FIFA World Cup 2022 & Arab Cup 2025 official DJ. Sets: youtube.com/@DJEMY-o6d · Would love to discuss upcoming dates.`,
  },

  // ── RESTAURANT / LOUNGE ──
  {
    name: "Gaia Dubai",
    area: "DIFC",
    type: "restaurant",
    pay: "AED 2,500–4,500",
    instagram: "@gaiadubai",
    notes: "Upscale Greek restaurant with DJ programming. Thursday/Friday nights. Deep, melodic house.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for Gaia. Afro House / Melodic — FIFA World Cup 2022 + Arab Cup 2025 official DJ. Her sound suits the Gaia vibe. Sets: youtube.com/@DJEMY-o6d · Available this week.`,
  },
  {
    name: "Zuma Dubai",
    area: "DIFC",
    type: "restaurant",
    pay: "AED 2,500–4,000",
    instagram: "@zumadubai",
    notes: "Thursday night DJ sessions. Sophisticated crowd. Deep house, organic.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for Zuma's Thursday sessions? Organic House / Melodic — FIFA World Cup 2022 & Arab Cup 2025 official DJ. Sets: youtube.com/@DJEMY-o6d · Got a slot coming up?`,
  },
  {
    name: "Nammos Dubai",
    area: "Four Seasons Jumeirah",
    type: "restaurant",
    pay: "AED 3,000–5,500",
    instagram: "@nammosdubai",
    notes: "Beach club + restaurant. High-energy sunset-to-party transition. Very bookable.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for Nammos. Afro House — FIFA World Cup 2022 + Arab Cup 2025 official DJ. She owns the sunset-to-party slot. Sets: youtube.com/@DJEMY-o6d · Available for your next booking.`,
  },
  {
    name: "Shimmers",
    area: "One&Only Royal Mirage",
    type: "restaurant",
    pay: "AED 2,000–3,500",
    instagram: "@shimmersdubai",
    notes: "Beachfront Greek, sunset sessions. Deep and organic house. Relaxed but stylish.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy for Shimmers? Organic House / deep grooves — FIFA World Cup 2022 & Arab Cup 2025 official DJ. Perfect for the sunset vibe. Sets: youtube.com/@DJEMY-o6d · Available this month.`,
  },

  // ── PRIVATE / YACHT ──
  {
    name: "Dubai Yacht Events",
    area: "Dubai Marina",
    type: "private",
    pay: "AED 4,500–8,000",
    instagram: "@dubaiyachtevents",
    whatsapp: "971567891234",
    notes: "Private yacht parties. High-value bookings. Premium equipment provided. Book regularly.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for private yacht events. Afro House / open format — FIFA World Cup 2022 + Arab Cup 2025 official DJ. She reads the room from chill to peak. Sets: youtube.com/@DJEMY-o6d · When's your next event?`,
  },
  {
    name: "Yas Marina Events",
    area: "Abu Dhabi",
    type: "private",
    pay: "AED 3,500–6,500",
    instagram: "@yasmarinaevents",
    whatsapp: "971567891234",
    notes: "Abu Dhabi private events and yacht parties. Abu Dhabi is a home market — no travel premium.",
    pitch: `Hi — Kirth from Emy Vision Group. DJ Emy available for your Abu Dhabi events. Afro House / open format — FIFA World Cup 2022 & Arab Cup 2025 official DJ. Based in UAE, no travel costs. Sets: youtube.com/@DJEMY-o6d · Let's chat about upcoming dates.`,
  },
];

const TYPE_LABELS: Record<Venue["type"], { label: string; emoji: string; color: string }> = {
  beach_club: { label: "Beach Club", emoji: "🏖", color: "text-cyan-400" },
  nightclub: { label: "Nightclub", emoji: "🎵", color: "text-fuchsia-400" },
  rooftop: { label: "Rooftop", emoji: "🌅", color: "text-amber-400" },
  hotel: { label: "Hotel", emoji: "🏨", color: "text-blue-400" },
  private: { label: "Private / Yacht", emoji: "🛥", color: "text-emerald-400" },
  restaurant: { label: "Restaurant", emoji: "🍽", color: "text-orange-400" },
};

export default function OutreachPage() {
  const [filter, setFilter] = useState<Venue["type"] | "all">("all");
  const [copied, setCopied] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () => (filter === "all" ? VENUES : VENUES.filter((v) => v.type === filter)),
    [filter]
  );

  const copyPitch = async (name: string, pitch: string) => {
    await navigator.clipboard.writeText(pitch);
    setCopied(name);
    setTimeout(() => setCopied(null), 2000);
  };

  const markSent = (name: string) => {
    setSent((prev) => new Set(prev).add(name));
  };

  const waLink = (phone: string, pitch: string) =>
    `https://wa.me/${phone}?text=${encodeURIComponent(pitch)}`;

  const igLink = (handle: string) =>
    `https://ig.me/m/${handle.replace("@", "")}`;

  const mailLink = (email: string, pitch: string) =>
    `mailto:${email}?subject=${encodeURIComponent("DJ Emy — Booking Availability")}&body=${encodeURIComponent(pitch)}`;

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* ── HEADER ── */}
      <header className="border-b border-zinc-800 bg-zinc-950 px-5 py-8 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
            DJ Emy — Outreach Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Dubai Booker Hit List
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            {VENUES.length} venues. One-tap WhatsApp, Instagram DM, or email with a
            pre-written pitch already loaded. Hit them all today.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-950/60 border border-green-800 px-3 py-1 text-xs font-semibold text-green-300">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              {sent.size} / {VENUES.length} contacted
            </span>
            <a
              href="/book"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300 hover:border-fuchsia-500"
            >
              📎 Her EPK link: /book
            </a>
          </div>
        </div>
      </header>

      {/* ── FILTERS ── */}
      <div className="sticky top-0 z-20 border-b border-zinc-800 bg-[#0a0a0f]/95 px-5 py-3 backdrop-blur sm:px-10">
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto">
          <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
            All ({VENUES.length})
          </FilterBtn>
          {(Object.keys(TYPE_LABELS) as Venue["type"][]).map((t) => (
            <FilterBtn key={t} active={filter === t} onClick={() => setFilter(t)}>
              {TYPE_LABELS[t].emoji} {TYPE_LABELS[t].label} ({VENUES.filter((v) => v.type === t).length})
            </FilterBtn>
          ))}
        </div>
      </div>

      {/* ── STRATEGY BOX ── */}
      <div className="mx-auto max-w-5xl px-5 pt-6 sm:px-10">
        <div className="rounded-2xl border border-amber-800/50 bg-amber-950/20 p-4">
          <h2 className="text-sm font-bold text-amber-300">⚡ Today&apos;s Strategy</h2>
          <ul className="mt-2 space-y-1 text-xs text-amber-200/80">
            <li>• <strong>Beach clubs first</strong> — Afro House is their sound. They book weekly. Message all 6 now.</li>
            <li>• <strong>WhatsApp beats email</strong> — bookers live on WhatsApp. Use the green button. One venue at a time.</li>
            <li>• <strong>Copy the pitch</strong>, paste into the chat, add the /book link, send. Then mark as sent.</li>
            <li>• <strong>Follow up in 48h</strong> if no reply. &quot;Just checking — any dates this month?&quot;</li>
            <li>• <strong>Best time to message:</strong> 10am–12pm Dubai time. Bookers check phones before meetings.</li>
            <li>• <strong>Add the EPK link to every message:</strong> emy-studio-rho.vercel.app/book</li>
          </ul>
        </div>
      </div>

      {/* ── VENUE LIST ── */}
      <div className="mx-auto max-w-5xl space-y-3 px-5 py-6 sm:px-10">
        {filtered.map((v) => {
          const t = TYPE_LABELS[v.type];
          const isSent = sent.has(v.name);
          return (
            <div
              key={v.name}
              className={`rounded-2xl border bg-zinc-950/70 p-4 transition ${
                isSent ? "border-green-800/40 opacity-70" : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{v.name}</h3>
                    {isSent && (
                      <span className="rounded-full bg-green-900/60 px-2 py-0.5 text-[10px] font-bold text-green-300">
                        ✓ SENT
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className={t.color}>{t.emoji} {t.label}</span>
                    <span>·</span>
                    <span>{v.area}</span>
                    <span>·</span>
                    <span className="font-semibold text-emerald-400">{v.pay}</span>
                  </div>
                </div>
                <a
                  href={`https://instagram.com/${v.instagram.replace("@", "")}`}
                  target="_blank"
                  rel="noopener"
                  className="text-xs text-zinc-500 hover:text-pink-400"
                >
                  {v.instagram}
                </a>
              </div>

              {/* Notes */}
              <p className="mt-2 text-xs text-zinc-500">{v.notes}</p>

              {/* Pitch */}
              <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                    Pre-written pitch
                  </span>
                  <button
                    onClick={() => copyPitch(v.name, v.pitch)}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-700"
                  >
                    {copied === v.name ? "✓ Copied!" : "Copy"}
                  </button>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{v.pitch}</p>
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {v.whatsapp && (
                  <a
                    href={waLink(v.whatsapp, v.pitch)}
                    target="_blank"
                    rel="noopener"
                    onClick={() => markSent(v.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-green-500"
                  >
                    💬 WhatsApp
                  </a>
                )}
                <a
                  href={igLink(v.instagram)}
                  target="_blank"
                  rel="noopener"
                  onClick={() => markSent(v.name)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-pink-800 bg-pink-950/50 px-4 py-2 text-xs font-bold text-pink-300 transition hover:bg-pink-900/60"
                >
                  📸 DM on IG
                </a>
                {v.email && (
                  <a
                    href={mailLink(v.email, v.pitch)}
                    onClick={() => markSent(v.name)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold text-zinc-300 transition hover:bg-zinc-700"
                  >
                    ✉ Email
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── BOTTOM CTA ── */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-5 py-8 text-center sm:px-10">
        <p className="text-sm text-zinc-400">
          Share her EPK with every reply →{" "}
          <a href="/book" className="font-semibold text-fuchsia-400 hover:underline">
            /book
          </a>
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Kirth · Emy Vision Group · +971 50 344 3281 · admin@emyvisiongroup.com
        </p>
      </div>
    </main>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-fuchsia-600 text-white shadow"
          : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}
