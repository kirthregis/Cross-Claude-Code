"use client";
import { useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { useSettings } from "@/lib/studio/store";

interface Artist {
  id: string;
  name: string;
  handle: string;
  city: string;
  country: string;
  genre: string[];
  lookingFor: string;
  bio: string;
  instagram: string;
  avatar: string;
  verified: boolean;
}

const MENA_ARTISTS: Artist[] = [
  { id: "1", name: "DJ Emy", handle: "@DJEMY", city: "Dubai", country: "🇦🇪 UAE", genre: ["Afro House", "Afro Tech"], lookingFor: "Vocalist for studio collaboration", bio: "Professional Afro House DJ based in Dubai. Playing superclubs and beach clubs across UAE.", instagram: "@dj_emy_", avatar: "🎧", verified: true },
  { id: "2", name: "Khalid Al Rashid", handle: "@khalid_dj", city: "Dubai", country: "🇦🇪 UAE", genre: ["Tech House", "Techno"], lookingFor: "Label submissions, festival slots", bio: "Underground techno DJ. Resident at BASE Dubai. 8 years in the game.", instagram: "@khalid_dj_ae", avatar: "🎛", verified: false },
  { id: "3", name: "Layla Beats", handle: "@laylabeats", city: "Riyadh", country: "🇸🇦 Saudi Arabia", genre: ["Deep House", "Nu-Disco"], lookingFor: "Collaboration on EP, vocal producer", bio: "Saudi Arabia's rising female DJ. KSA Vision 2030 music scene pioneer.", instagram: "@laylabeats_sa", avatar: "🎵", verified: true },
  { id: "4", name: "Omar Groove", handle: "@omargroove", city: "Abu Dhabi", country: "🇦🇪 UAE", genre: ["Afro House", "Tribal"], lookingFor: "Co-headline events, remix swaps", bio: "Afro House specialist. Playing across UAE and Bahrain. Loves collaboration.", instagram: "@omargroove_ae", avatar: "🔊", verified: false },
  { id: "5", name: "Nadia Karim", handle: "@nadiakarim", city: "Cairo", country: "🇪🇬 Egypt", genre: ["Oriental House", "Deep House"], lookingFor: "International bookings, management", bio: "Blending Eastern scales with House music. Cairo underground scene veteran.", instagram: "@nadiakarim_music", avatar: "🎹", verified: true },
  { id: "6", name: "Sami Al Farsi", handle: "@samifarsi", city: "Muscat", country: "🇴🇲 Oman", genre: ["Melodic Techno", "Progressive House"], lookingFor: "Festival bookings, label demo submission", bio: "Oman's first melodic techno DJ. Building the scene from scratch.", instagram: "@samifarsi_music", avatar: "🎼", verified: false },
  { id: "7", name: "Rania Hassan", handle: "@raniahassan", city: "Beirut", country: "🇱🇧 Lebanon", genre: ["Afro Tech", "House"], lookingFor: "Dubai/UAE residency, agent", bio: "Beirut underground legend. 12 years DJing. Ready for the Gulf market.", instagram: "@raniahassan_dj", avatar: "🎤", verified: true },
  { id: "8", name: "Faisal Groove", handle: "@faisalgroove", city: "Doha", country: "🇶🇦 Qatar", genre: ["Deep House", "Afro House"], lookingFor: "Studio collaboration, vocal features", bio: "Qatar World Cup 2022 official event DJ. Growing regional presence.", instagram: "@faisalgroove_qa", avatar: "🎚", verified: false },
];

const OPPORTUNITIES = [
  { id: "1", type: "Collaboration", title: "Looking for Arabic Vocalist", artist: "DJ Emy", city: "Dubai", genre: "Afro House", description: "Working on an original track with Arabic lyrics. Need a female vocalist for studio session. Remote recording welcome.", posted: "2 days ago" },
  { id: "2", type: "Residency Offer", title: "House DJ Wanted — Thursdays", artist: "Cielo Sky Lounge", city: "Dubai Creek Harbour", genre: "Deep House / Afro House", description: "Looking for a resident DJ for Thursday nights. Must have 3+ years experience and a following.", posted: "1 day ago" },
  { id: "3", type: "Festival Slot", title: "ADE Showcase — MENA Artists", artist: "Amsterdam Dance Event", city: "Amsterdam", genre: "All Electronic", description: "Curating MENA artists for ADE 2026 showcase. Submit EPK + 30 min mix.", posted: "3 days ago" },
  { id: "4", type: "Remix Swap", title: "Swap Remixes — Afro House", artist: "Omar Groove", city: "Abu Dhabi", genre: "Afro House / Tribal", description: "Have 2 original tracks. Looking for DJs to remix one each. I remix yours in return.", posted: "5 days ago" },
  { id: "5", type: "Label Demo", title: "Open Demo Submissions", artist: "Desert Rave Records", city: "Dubai", genre: "Afro House / Afro Tech", description: "MENA-based label looking for fresh Afro House and Afro Tech demos. Send EPK + demo to demos@desertraverecords.com", posted: "1 week ago" },
];

type Tab = "discover" | "opportunities" | "connect";

export default function CommunityPage() {
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("discover");
  const [genreFilter, setGenreFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [connectMsg, setConnectMsg] = useState("");
  const [connected, setConnected] = useState<string[]>([]);

  const allGenres = ["all", ...Array.from(new Set(MENA_ARTISTS.flatMap(a => a.genre)))];
  const allCities = ["all", ...Array.from(new Set(MENA_ARTISTS.map(a => a.city)))];

  const filtered = MENA_ARTISTS.filter(a =>
    (genreFilter === "all" || a.genre.includes(genreFilter)) &&
    (cityFilter === "all" || a.city === cityFilter) &&
    a.handle !== settings.artistHandle
  );

  const connect = (artistId: string) => {
    setConnected(p => [...p, artistId]);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">🌍 MENA Community</h1>
        <p className="mt-1 text-sm text-zinc-400">Connect with artists, find collaborators, and discover opportunities across the Middle East & North Africa.</p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
        {([{ id: "discover", label: "🔍 Discover Artists" }, { id: "opportunities", label: "🎯 Opportunities" }, { id: "connect", label: "🤝 Connect" }] as { id: Tab; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={"flex-1 rounded-xl py-2 text-xs font-semibold transition " + (tab === t.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300")}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 overflow-x-auto">
              {allGenres.slice(0, 6).map(g => (
                <button key={g} onClick={() => setGenreFilter(g)}
                  className={"whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition " + (genreFilter === g ? "bg-fuchsia-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>
                  {g === "all" ? "All Genres" : g}
                </button>
              ))}
            </div>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}
              className="rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none">
              {allCities.map(c => <option key={c} value={c}>{c === "all" ? "All Cities" : c}</option>)}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map(artist => (
              <Card key={artist.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-2xl">{artist.avatar}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-zinc-100">{artist.name}</p>
                      {artist.verified && <span className="text-[10px] text-blue-400">✓ verified</span>}
                    </div>
                    <p className="text-xs text-zinc-500">{artist.country} · {artist.city}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{artist.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.genre.map(g => <span key={g} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>)}
                </div>
                <div className="mt-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-2">
                  <p className="text-[11px] text-fuchsia-300">🔍 Looking for: {artist.lookingFor}</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <a href={"https://instagram.com/" + artist.instagram.replace("@", "")} target="_blank" rel="noreferrer"
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-fuchsia-500 transition">
                    📸 {artist.instagram}
                  </a>
                  {connected.includes(artist.id) ? (
                    <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300">✓ Request Sent</span>
                  ) : (
                    <button onClick={() => connect(artist.id)} className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                      Connect
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "opportunities" && (
        <div className="space-y-3">
          {OPPORTUNITIES.map(opp => (
            <Card key={opp.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " +
                      (opp.type === "Collaboration" ? "bg-fuchsia-500/20 text-fuchsia-300" :
                       opp.type === "Residency Offer" ? "bg-blue-500/20 text-blue-300" :
                       opp.type === "Festival Slot" ? "bg-emerald-500/20 text-emerald-300" :
                       opp.type === "Remix Swap" ? "bg-amber-500/20 text-amber-300" :
                       "bg-zinc-700 text-zinc-300")}>
                      {opp.type}
                    </span>
                    <span className="text-[10px] text-zinc-600">{opp.posted}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-zinc-100">{opp.title}</h3>
                  <p className="text-xs text-zinc-500">{opp.artist} · {opp.city} · {opp.genre}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{opp.description}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setTab("connect"); setConnectMsg("Hi! I saw your post about \"" + opp.title + "\" and I am interested. I am " + settings.artistName + ", a " + settings.defaultGenre + " DJ based in Dubai. Let me know if you would like to connect!"); }}
                  className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                  Apply / Respond
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "connect" && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <SectionLabel>Your Profile in the Community</SectionLabel>
            <div className="mt-3 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 text-3xl">🎧</div>
              <div>
                <p className="text-base font-bold text-zinc-100">{settings.artistName || "Your Artist Name"}</p>
                <p className="text-xs text-zinc-500">{settings.defaultGenre} · Dubai, UAE</p>
                <p className="text-xs text-zinc-600 mt-0.5">{settings.instagram} · {settings.tiktok}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Your profile is built from your Settings. Update your name, genre, and social handles there to improve your visibility.</p>
            <div className="mt-3">
              <a href="/studio/settings" className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                ⚙ Update Profile in Settings
              </a>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionLabel>Send a Connection Message</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">Draft your outreach message. Copy it and send via Instagram DM or email.</p>
            <textarea value={connectMsg} onChange={e => setConnectMsg(e.target.value)} rows={6}
              placeholder={"Hi [Artist Name],\n\nI came across your profile and I think we could create something great together. I am " + (settings.artistName || "your name") + ", a " + (settings.defaultGenre || "House") + " DJ based in Dubai.\n\nWould love to connect!"}
              className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none leading-relaxed" />
            <div className="mt-2 flex gap-2">
              <Button onClick={() => { void navigator.clipboard.writeText(connectMsg); }}>Copy Message</Button>
              <Button variant="ghost" onClick={() => setConnectMsg("")}>Clear</Button>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionLabel>🚀 Coming Soon</SectionLabel>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {["Real-time messaging between artists", "Verified artist badges", "Collaborative project rooms", "MENA talent agency connections", "Festival booking portal", "Label demo submission hub"].map(item => (
                <div key={item} className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
                  <span className="text-zinc-700">◉</span>{item}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}