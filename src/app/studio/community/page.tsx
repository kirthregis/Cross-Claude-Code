"use client";
import { useEffect, useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "@/components/studio/ArabicToggle";
import { useSettings } from "@/lib/studio/store";
import { DJ_EMY } from "@/lib/artist";
import { openEmail, openWhatsApp, openCall, openInstagramDM, detectPhone, generatePitchText } from "@/lib/studio/outreach-utils";
import { TutorialOverlay } from "@/components/studio/TutorialOverlay";
import { getGigs, upsertGig } from "@/lib/db";
import type { Gig } from "@/lib/types";
import { getSavedContacts, saveContact, removeContact, extractContactsFromText, type SavedContact } from "@/lib/studio/contacts";

interface Artist {
  id: string;
  name: string;
  handle: string;
  city: string;
  country: string;
  role: "dj" | "producer" | "sound_engineer" | "lighting_tech" | "visual_artist" | "vocalist" | "manager" | "promoter" | "production";
  genre: string[];
  lookingFor: string;
  bio: string;
  instagram: string;
  avatar: string;
  verified: boolean;
}

const MENA_ARTISTS: Artist[] = [
  // ── DJs ────────────────────────────────────────────────────────
  { id: "1", name: "DJ Emy", handle: "@DJEMY", city: "Dubai", country: "🇦🇪 UAE", role: "dj", genre: ["Afro House", "Afro Tech"], lookingFor: "Vocalist for studio collaboration", bio: "Professional Afro House DJ based in Dubai. Playing superclubs and beach clubs across UAE.", instagram: "@evgroup2026", avatar: "🎧", verified: true },
  { id: "2", name: "Khalid Al Rashid", handle: "@khalid_dj", city: "Dubai", country: "🇦🇪 UAE", role: "dj", genre: ["Tech House", "Techno"], lookingFor: "Label submissions, festival slots", bio: "Underground techno DJ. Resident at BASE Dubai. 8 years in the game.", instagram: "@khalid_dj_ae", avatar: "🎛", verified: false },
  { id: "3", name: "Layla Beats", handle: "@laylabeats", city: "Riyadh", country: "🇸🇦 Saudi Arabia", role: "dj", genre: ["Deep House", "Nu-Disco"], lookingFor: "Collaboration on EP, vocal producer", bio: "Saudi Arabia's rising female DJ. KSA Vision 2030 music scene pioneer.", instagram: "@laylabeats_sa", avatar: "🎵", verified: true },
  { id: "4", name: "Omar Groove", handle: "@omargroove", city: "Abu Dhabi", country: "🇦🇪 UAE", role: "dj", genre: ["Afro House", "Tribal"], lookingFor: "Co-headline events, remix swaps", bio: "Afro House specialist. Playing across UAE and Bahrain. Loves collaboration.", instagram: "@omargroove_ae", avatar: "🔊", verified: false },
  { id: "5", name: "Nadia Karim", handle: "@nadiakarim", city: "Cairo", country: "🇪🇬 Egypt", role: "dj", genre: ["Oriental House", "Deep House"], lookingFor: "International bookings, management", bio: "Blending Eastern scales with House music. Cairo underground scene veteran.", instagram: "@nadiakarim_music", avatar: "🎹", verified: true },
  { id: "6", name: "Sami Al Farsi", handle: "@samifarsi", city: "Muscat", country: "🇴🇲 Oman", role: "dj", genre: ["Melodic Techno", "Progressive House"], lookingFor: "Festival bookings, label demo submission", bio: "Oman's first melodic techno DJ. Building the scene from scratch.", instagram: "@samifarsi_music", avatar: "🎼", verified: false },
  { id: "7", name: "Rania Hassan", handle: "@raniahassan", city: "Beirut", country: "🇱🇧 Lebanon", role: "dj", genre: ["Afro Tech", "House"], lookingFor: "Dubai/UAE residency, agent", bio: "Beirut underground legend. 12 years DJing. Ready for the Gulf market.", instagram: "@raniahassan_dj", avatar: "🎤", verified: true },
  { id: "8", name: "Faisal Groove", handle: "@faisalgroove", city: "Doha", country: "🇶🇦 Qatar", role: "dj", genre: ["Deep House", "Afro House"], lookingFor: "Studio collaboration, vocal features", bio: "Qatar World Cup 2022 official event DJ. Growing regional presence.", instagram: "@faisalgroove_qa", avatar: "🎚", verified: false },
  { id: "9", name: "Fatima Al-Sayed", handle: "@fatima_dj", city: "Riyadh", country: "🇸🇦 Saudi Arabia", role: "dj", genre: ["Trance", "Progressive", "Uplifting"], lookingFor: "Festival slots, agency representation", bio: "Breaking boundaries in Saudi Arabia's emerging music scene. Pioneer for women DJs in the Kingdom, known for euphoric trance sets.", instagram: "@fatima_dj_sa", avatar: "🎧", verified: true },
  { id: "10", name: "Tariq Zayed", handle: "@tariqz", city: "Doha", country: "🇶🇦 Qatar", role: "dj", genre: ["EDM", "Commercial", "Deep House"], lookingFor: "Luxury event bookings, brand partnerships", bio: "Doha's go-to DJ for luxury events and high-energy club nights. Seamlessly blends commercial hits with underground gems.", instagram: "@tariqz_dj", avatar: "🔊", verified: true },
  { id: "11", name: "Yasmin Haddad", handle: "@yas_dj", city: "Tunis", country: "🇹🇳 Tunisia", role: "dj", genre: ["Afro Electronic", "House", "Disco"], lookingFor: "European festival bookings, label deal", bio: "Tunisia's breakout DJ talent. Afro-electronic sets turning heads at festivals across North Africa and Europe.", instagram: "@yas_haddad", avatar: "🎵", verified: true },
  { id: "12", name: "Hassan Mirza", handle: "@hmirza", city: "Muscat", country: "🇴🇲 Oman", role: "dj", genre: ["Techno", "Dark Techno", "Industrial"], lookingFor: "Warehouse events, underground collectives", bio: "Oman's premier techno DJ. Dark, driving sets across the Middle East's top venues.", instagram: "@hmirza_techno", avatar: "🎛", verified: false },
  { id: "13", name: "Dina Rashid", handle: "@dinar", city: "Kuwait City", country: "🇰🇼 Kuwait", role: "dj", genre: ["Arabic Pop", "House", "R&B"], lookingFor: "Wedding DJ referrals, event agencies", bio: "Kuwait's most in-demand wedding and event DJ. Perfect crowd reading and seamless genre-switching.", instagram: "@dinar_dj", avatar: "🎧", verified: true },
  { id: "14", name: "Rami Abdel-Nour", handle: "@rami_a", city: "Jeddah", country: "🇸🇦 Saudi Arabia", role: "dj", genre: ["Baile Funk", "Dancehall", "Arabic"], lookingFor: "Beach club residency, music festival slots", bio: "Jeddah's finest selector. The Red Sea sound — baile funk, dancehall, and Arabic rhythms.", instagram: "@rami_a_dj", avatar: "🔊", verified: true },
  { id: "15", name: "Zara Mahdi", handle: "@zara_dj", city: "Baghdad", country: "🇮🇶 Iraq", role: "dj", genre: ["Ambient Techno", "Electronica", "Folk Fusion"], lookingFor: "International showcases, documentary features", bio: "Representing Iraq on the global stage. Emotional, story-driven sets blending Kurdish folk with ambient techno.", instagram: "@zara_mahdi_music", avatar: "🎼", verified: true },
  { id: "16", name: "Amir Saab", handle: "@saab_dj", city: "Abu Dhabi", country: "🇦🇪 UAE", role: "dj", genre: ["Soulful House", "Funk", "Nu-Disco"], lookingFor: "Friday night residency, brunch events", bio: "Abu Dhabi's resident groove master. Funky, soulful house sets backbone of the city's Friday night scene.", instagram: "@saab_dj_ad", avatar: "🎚", verified: false },
  { id: "17", name: "Hana Darwish", handle: "@hanad", city: "Alexandria", country: "🇪🇬 Egypt", role: "dj", genre: ["Bass Music", "Mahraganat", "Grime"], lookingFor: "UK tour support, label release", bio: "Alexandria's rising star. Fuses mahraganat energy with UK bass music for a sound that's entirely her own.", instagram: "@hanad_bass", avatar: "🎵", verified: false },
  { id: "18", name: "Karim Taleb", handle: "@ktaleb", city: "Tangier", country: "🇲🇦 Morocco", role: "dj", genre: ["Dub", "Psychedelic", "Leftfield"], lookingFor: "Festival curation, vinyl label", bio: "Tangier's eclectic tastemaker. DJ sets traverse psychedelic rock, dub, and leftfield electronics.", instagram: "@ktaleb_music", avatar: "🎛", verified: true },
  { id: "19", name: "Salma Osman", handle: "@salma_o", city: "Khartoum", country: "🇸🇩 Sudan", role: "dj", genre: ["Electronic", "World", "Sudanese Fusion"], lookingFor: "Cultural exchange programs, residencies", bio: "Sudan's electronic music ambassador. Blends traditional Sudanese rhythms with modern electronic production.", instagram: "@salma_osman_dj", avatar: "🎧", verified: true },
  { id: "20", name: "DJ Faisal Q", handle: "@faisalq", city: "Manama", country: "🇧🇭 Bahrain", role: "dj", genre: ["EDM", "Tropical House", "Dancehall"], lookingFor: "F1 afterparty bookings, beach club residency", bio: "Bahrain's party starter. Rocking clubs and beach parties across the island for over a decade.", instagram: "@faisalq_bh", avatar: "🔊", verified: true },
  { id: "21", name: "Mira Sabbagh", handle: "@miras", city: "Beirut", country: "🇱🇧 Lebanon", role: "dj", genre: ["Micro House", "Minimal", "Dub Techno"], lookingFor: "Boiler Room showcase, Berlin bookings", bio: "Beirut's DJ royalty. Refined taste in micro-house and minimal, devoted following.", instagram: "@miras_dj", avatar: "🎛", verified: true },
  { id: "22", name: "Youssef Hamdi", handle: "@youssefh", city: "Marrakech", country: "🇲🇦 Morocco", role: "dj", genre: ["Chill House", "Downtempo", "Organic House"], lookingFor: "Rooftop residency, sunset sessions worldwide", bio: "Marrakech's sunset DJ extraordinaire. Rooftop sets overlooking the medina are legendary.", instagram: "@youssefh_chill", avatar: "🎵", verified: true },
  { id: "23", name: "Lina Masri", handle: "@linam", city: "Dubai", country: "🇦🇪 UAE", role: "dj", genre: ["Open Format", "Hip-Hop", "House"], lookingFor: "Ladies night residency, corporate events", bio: "Dubai's hardest-working DJ. Holds residencies at three venues, go-to open format DJ for elite nightlife.", instagram: "@linam_dj", avatar: "🎧", verified: true },
  { id: "24", name: "Nadia Benali", handle: "@nadiab", city: "Casablanca", country: "🇲🇦 Morocco", role: "dj", genre: ["House", "Techno", "Gnawa Fusion"], lookingFor: "Ibiza summer residency, Sonar showcase", bio: "Morocco's finest DJ export. Gnawa-infused house music and driving techno. Regular at Amnesia Ibiza.", instagram: "@nadiab_music", avatar: "🎼", verified: true },

  // ── Producers ──────────────────────────────────────────────────
  { id: "30", name: "Ahmed Bassam", handle: "@bassam", city: "Cairo", country: "🇪🇬 Egypt", role: "producer", genre: ["Melodic Techno", "Deep House", "Ambient"], lookingFor: "Label placements, remix commissions", bio: "Egypt's most prolific electronic producer. Releases on Kompakt and Innervisions put the Cairo sound on the world map.", instagram: "@bassam_music", avatar: "🎹", verified: true },
  { id: "31", name: "Noor Al-Din", handle: "@noor", city: "Dubai", country: "🇦🇪 UAE", role: "producer", genre: ["World Electronic", "Ambient", "Cinematic"], lookingFor: "Film scoring, brand sonic identity", bio: "Grammy-nominated producer blending oud and qanun samples with cutting-edge electronic production. Albums topped Beatport.", instagram: "@noor_aldin", avatar: "🎹", verified: true },
  { id: "32", name: "Rania Khoury", handle: "@raniak", city: "Beirut", country: "🇱🇧 Lebanon", role: "producer", genre: ["Electronica", "Ambient", "Classical Crossover"], lookingFor: "Orchestra collaboration, art installation scores", bio: "Lush soundscapes bridging Arabic classical music and modern electronica.", instagram: "@raniak_music", avatar: "🎼", verified: true },
  { id: "33", name: "Kamal Idris", handle: "@kamal", city: "Rabat", country: "🇲🇦 Morocco", role: "producer", genre: ["Beats", "Hip-Hop Production", "Trap"], lookingFor: "Vocal artists, remix credits", bio: "Morocco's beat architect. Produces for artists across MENA, remix credits with Major Lazer.", instagram: "@kamal_beats", avatar: "🎛", verified: true },
  { id: "34", name: "Sara Hammoud", handle: "@sarah", city: "Amman", country: "🇯🇴 Jordan", role: "producer", genre: ["Synthwave", "Retro Electronic", "Darkwave"], lookingFor: "Synth collaborators, vinyl pressing", bio: "Jordan's synth wizard. Retro-futuristic productions blending 80s analog warmth with Middle Eastern modal scales.", instagram: "@sarah_synth", avatar: "🎹", verified: false },
  { id: "35", name: "Walid Fares", handle: "@walidf", city: "Riyadh", country: "🇸🇦 Saudi Arabia", role: "producer", genre: ["Bass", "Khaleeji Fusion", "Future Beats"], lookingFor: "MDLBEAST placement, international distribution", bio: "Saudi Arabia's breakthrough producer. Fusion of traditional Khaleeji music with modern bass created an entirely new genre.", instagram: "@walidf_music", avatar: "🎧", verified: true },
  { id: "36", name: "Jamil Nasser", handle: "@jamil", city: "Baghdad", country: "🇮🇶 Iraq", role: "producer", genre: ["Experimental", "Maqam Electronic", "Drone"], lookingFor: "Art residencies, museum commissions", bio: "Iraqi producer preserving and modernizing maqam traditions through electronic production. Boiler Room set went viral.", instagram: "@jamil_maqam", avatar: "🎼", verified: true },
  { id: "37", name: "Leena Hakim", handle: "@leena", city: "Tunis", country: "🇹🇳 Tunisia", role: "producer", genre: ["Sound Design", "Experimental", "Techno"], lookingFor: "Film scoring, game audio", bio: "Tunisian producer and sound designer. Work spans film scores, art installations, and dancefloor-ready tracks.", instagram: "@leena_sound", avatar: "🎛", verified: true },
  { id: "38", name: "Tarek Osman", handle: "@tareko", city: "Alexandria", country: "🇪🇬 Egypt", role: "producer", genre: ["Mahraganat", "Electronic", "Pop"], lookingFor: "Streaming push, commercial sync", bio: "Egypt's mahraganat-meets-electronic innovator. Productions have millions of streams, sampled by global artists.", instagram: "@tareko_eg", avatar: "🎵", verified: false },
  { id: "39", name: "Aisha Mohammed", handle: "@aisham", city: "Doha", country: "🇶🇦 Qatar", role: "producer", genre: ["Minimal", "Gulf Folk", "Electroacoustic"], lookingFor: "Qatar Museums collaboration, academic research", bio: "Qatar's leading female producer. Intricate productions drawing from Gulf folk music and minimal techno.", instagram: "@aisham_qa", avatar: "🎹", verified: true },
  { id: "40", name: "Maya Zeitoun", handle: "@mayaz", city: "Beirut", country: "🇱🇧 Lebanon", role: "producer", genre: ["Melodic House", "Progressive", "Indie Dance"], lookingFor: "Afterlife/Diynamic release, touring", bio: "Multi-instrumentalist whose releases on Afterlife and Diynamic redefined the Lebanese electronic sound.", instagram: "@mayaz_music", avatar: "🎼", verified: true },
  { id: "41", name: "Bilal Sharif", handle: "@bilals", city: "Jeddah", country: "🇸🇦 Saudi Arabia", role: "producer", genre: ["EDM", "Progressive House", "Vocal Trance"], lookingFor: "Vocalist features, festival anthem placement", bio: "Jeddah producer known for massive festival anthems and collabs with top MENA vocalists.", instagram: "@bilals_edm", avatar: "🎧", verified: false },

  // ── Sound Engineers ────────────────────────────────────────────
  { id: "50", name: "Ramzi Saleh", handle: "@ramzi_foh", city: "Dubai", country: "🇦🇪 UAE", role: "sound_engineer", genre: ["All Genres"], lookingFor: "Festival FOH contracts, permanent venue install", bio: "Senior sound engineer, 20 years experience. Mixed FOH for Massive Attack, Radiohead, and major Arabic artists across MENA.", instagram: "@ramzi_foh", avatar: "🔊", verified: true },
  { id: "51", name: "Fadi Mansour", handle: "@fadi_sound", city: "Beirut", country: "🇱🇧 Lebanon", role: "sound_engineer", genre: ["Electronic", "Live"], lookingFor: "Club residency engineer, touring", bio: "Beirut's go-to live sound engineer. Specializes in electronic music events, engineered for B018 and The Grand Factory.", instagram: "@fadi_sound_lb", avatar: "🔊", verified: true },
  { id: "52", name: "Adel Bouzid", handle: "@adel_eng", city: "Casablanca", country: "🇲🇦 Morocco", role: "sound_engineer", genre: ["All Genres"], lookingFor: "Mawazine Festival contract, studio mastering", bio: "Morocco's premier studio and live sound engineer. Worked with every major Moroccan artist and internationals at Mawazine.", instagram: "@adel_eng_ma", avatar: "🔊", verified: true },
  { id: "53", name: "Issam Chehab", handle: "@issam_master", city: "Tunis", country: "🇹🇳 Tunisia", role: "sound_engineer", genre: ["Electronic"], lookingFor: "Remote mastering clients, online mixing", bio: "Studio engineer and mastering specialist. Mastered over 500 tracks for MENA electronic artists.", instagram: "@issam_master_tn", avatar: "🎛", verified: true },

  // ── Lighting & Visuals ─────────────────────────────────────────
  { id: "55", name: "Dalia Nassar", handle: "@dalia_light", city: "Cairo", country: "🇪🇬 Egypt", role: "lighting_tech", genre: ["All Genres"], lookingFor: "Festival LD contracts, immersive art", bio: "Egypt's top lighting designer. Immersive visual experiences for clubs, concerts, and festivals across the region.", instagram: "@dalia_light_eg", avatar: "💡", verified: true },
  { id: "56", name: "Mahmoud Taha", handle: "@mahmoud_ld", city: "Doha", country: "🇶🇦 Qatar", role: "lighting_tech", genre: ["All Genres"], lookingFor: "Premium venue install, Lusail events", bio: "Lighting technician and designer for Qatar's premium entertainment venues. Bespoke lighting for club nights.", instagram: "@mahmoud_ld_qa", avatar: "💡", verified: false },
  { id: "57", name: "Marwan Issa", handle: "@marwan_vj", city: "Amman", country: "🇯🇴 Jordan", role: "visual_artist", genre: ["Electronic", "Experimental"], lookingFor: "Projection mapping commissions, VJ touring", bio: "VJ and visual artist creating real-time visuals for electronic music events. Projection mapping featured at festivals globally.", instagram: "@marwan_vj", avatar: "🎨", verified: true },
  { id: "58", name: "Sami Barakat", handle: "@sami_led", city: "Dubai", country: "🇦🇪 UAE", role: "visual_artist", genre: ["Electronic"], lookingFor: "Holographic DJ booth design, LED install", bio: "Multimedia artist specializing in immersive club experiences. LED installations, holographic DJ booths, interactive dance floors.", instagram: "@sami_led_ae", avatar: "🎨", verified: true },

  // ── Production / Event Management ──────────────────────────────
  { id: "60", name: "Samira Abbas", handle: "@samira_prod", city: "Riyadh", country: "🇸🇦 Saudi Arabia", role: "production", genre: ["All Genres"], lookingFor: "SOUNDSTORM production team, large-scale events", bio: "Event production manager specializing in large-scale music festivals. Led production for MDL Beast and SOUNDSTORM.", instagram: "@samira_prod_sa", avatar: "🎛", verified: true },
  { id: "61", name: "Nabil Hamdan", handle: "@nabil_prod", city: "Muscat", country: "🇴🇲 Oman", role: "production", genre: ["All Genres"], lookingFor: "Oman festival production, venue setup contracts", bio: "Full-service production manager for Oman's growing event scene. Handles staging, sound, lighting, and logistics.", instagram: "@nabil_prod_om", avatar: "🎚", verified: false },

  // ── Managers & Promoters ───────────────────────────────────────
  { id: "65", name: "Ghada Youssef", handle: "@ghada_mgmt", city: "Dubai", country: "🇦🇪 UAE", role: "manager", genre: ["Electronic", "Pop"], lookingFor: "Emerging MENA DJs to represent", bio: "Artist manager representing biggest DJ and producer names in MENA. Expert in international bookings and brand partnerships.", instagram: "@ghada_mgmt_ae", avatar: "📋", verified: true },
  { id: "66", name: "Rana Othman", handle: "@rana_mgmt", city: "Cairo", country: "🇪🇬 Egypt", role: "manager", genre: ["Electronic"], lookingFor: "Egyptian electronic talent, label partnerships", bio: "Talent manager focused on emerging Egyptian electronic artists. Launched careers of several now-international DJs.", instagram: "@rana_mgmt_eg", avatar: "📋", verified: false },
  { id: "67", name: "Reem Al-Harbi", handle: "@reem_events", city: "Jeddah", country: "🇸🇦 Saudi Arabia", role: "promoter", genre: ["All Genres"], lookingFor: "International acts for KSA, local headliners", bio: "Leading promoter in Saudi Arabia's booming entertainment sector. Brought international acts to the Kingdom, champions local talent.", instagram: "@reem_events_sa", avatar: "📢", verified: true },
  { id: "68", name: "Lama Khalil", handle: "@lama_promo", city: "Beirut", country: "🇱🇧 Lebanon", role: "promoter", genre: ["Electronic", "Alternative"], lookingFor: "Guest DJs for Nuit Blanche, sponsors", bio: "Veteran Beirut promoter who has kept the city's nightlife alive through thick and thin. Runs legendary 'Nuit Blanche' series.", instagram: "@lama_promo_lb", avatar: "📢", verified: true },

  // ── Vocalists ──────────────────────────────────────────────────
  { id: "70", name: "Amira Fakhr", handle: "@amira_vox", city: "Beirut", country: "🇱🇧 Lebanon", role: "vocalist", genre: ["Vocal House", "Melodic Techno", "Pop"], lookingFor: "Feature spots on tracks, live performances", bio: "Lebanese vocalist whose haunting Arabic vocals graced tracks by top MENA and international producers. Beatport top 10 features.", instagram: "@amira_vox_lb", avatar: "🎤", verified: true },
  { id: "71", name: "Yara Salim", handle: "@yara_voice", city: "Damascus", country: "🇸🇾 Syria", role: "vocalist", genre: ["World", "Electronic", "Fusion"], lookingFor: "Studio sessions, album features", bio: "Syrian vocalist based between Istanbul and Dubai. Blends traditional Arabic vocal techniques with modern electronic.", instagram: "@yara_voice", avatar: "🎤", verified: true },
  { id: "72", name: "Rashid Al-Balushi", handle: "@rashid_mc", city: "Muscat", country: "🇴🇲 Oman", role: "vocalist", genre: ["Hip-Hop", "House", "Freestyle"], lookingFor: "MC slots at DJ events, recording sessions", bio: "Omani MC and vocalist who brings live energy to DJ sets. Known for freestyle performances over house and techno.", instagram: "@rashid_mc_om", avatar: "🎤", verified: false },
];

interface Opportunity {
  id: string;
  type: string;
  title: string;
  artist: string;
  city: string;
  area?: string;
  genre: string;
  description: string;
  posted: string;
  payAed?: string;
  payUsd?: string;
  capacity?: string;
  equipment?: string;
  contact?: {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
    instagram?: string;
  };
  recurring?: boolean;
  expires?: string;
}

const SOURCE_LABELS: Record<Gig["sourceKind"], string> = {
  event_calendar: "Live Listing",
  gig_board: "Gig Board",
  whatsapp: "WhatsApp Lead",
  email: "Email Lead",
  instagram: "Instagram Lead",
  manual: "Manual Entry",
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * Real gig, as GigRadar's live sweep actually found it — never invented.
 * Contact fields only appear here when extract.ts pulled them straight out
 * of the source text, so there is nothing to "verify before contacting"
 * the way there is for the guessed addresses in gigradar-ai.ts.
 */
function gigToOpportunity(g: Gig): Opportunity {
  const c = g.contacts?.[0];
  return {
    id: g.id,
    type: SOURCE_LABELS[g.sourceKind] ?? g.sourceKind,
    title: g.title,
    artist: g.venueName ?? g.sourceName,
    city: g.area ?? g.venueArea ?? "GCC",
    area: g.venueArea,
    genre: (g.genresWanted ?? []).join(" / ") || "Open format",
    description: g.body,
    posted: timeAgo(g.discoveredAt ?? g.postedAt),
    payAed: g.budgetStatedAed ? g.budgetStatedAed.toLocaleString() : undefined,
    recurring: g.recurring,
    contact: c ? { name: c.name, role: c.role, email: c.email, phone: c.phone, whatsapp: c.whatsapp, instagram: c.instagram } : undefined,
  };
}

const ROLE_LABELS: Record<string, string> = {
  dj: "🎧 DJ",
  producer: "🎹 Producer",
  production: "🎛️ Production",
  vocalist: "🎤 Vocalist",
  manager: "📋 Manager",
  promoter: "📢 Promoter",
  sound_engineer: "🔊 Sound Engineer",
  lighting_tech: "💡 Lighting",
  visual_artist: "🎨 Visual Artist",
};

type Tab = "discover" | "opportunities" | "connect";

export default function CommunityPage() {
  const { arabic } = useArabic();
  const settings = useSettings();
  const [tab, setTab] = useState<Tab>("discover");
  const [genreFilter, setGenreFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [connectMsg, setConnectMsg] = useState("");
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [sweeping, setSweeping] = useState(false);
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [foundContacts, setFoundContacts] = useState<ReturnType<typeof extractContactsFromText>>([]);

  useEffect(() => {
    const existing = getGigs();
    setGigs(existing);
    setContacts(getSavedContacts());
    // Nothing swept into this browser yet — pull the same live feeds
    // GigRadar uses (Platinumlist, Time Out Dubai, Resident Advisor,
    // Hozpitality, Dubai Calendar, GulfTalent) instead of showing nothing.
    if (existing.length === 0) {
      setSweeping(true);
      fetch("/api/sweep").then(r => r.json()).then(data => {
        for (const g of (data.gigs ?? [])) upsertGig(g);
        setGigs(getGigs());
      }).catch(() => {}).finally(() => setSweeping(false));
    }
  }, []);

  const opportunities = gigs.map(gigToOpportunity);

  const runFind = () => setFoundContacts(extractContactsFromText(pasteText));

  const keepContact = (c: ReturnType<typeof extractContactsFromText>[number]) => {
    const saved = saveContact({ ...c, source: "extracted" });
    setContacts(getSavedContacts());
    return saved;
  };

  const allGenres = ["all", ...Array.from(new Set(MENA_ARTISTS.flatMap(a => a.genre)))];
  const allCities = ["all", ...Array.from(new Set(MENA_ARTISTS.map(a => a.city)))];
  const allRoles = ["all", ...Array.from(new Set(MENA_ARTISTS.map(a => a.role)))];

  const filtered = MENA_ARTISTS.filter(a =>
    (genreFilter === "all" || a.genre.includes(genreFilter)) &&
    (cityFilter === "all" || a.city === cityFilter) &&
    (roleFilter === "all" || a.role === roleFilter) &&
    a.handle !== settings.artistHandle
  );

  const roleCounts = allRoles.reduce<Record<string, number>>((acc, r) => {
    acc[r] = r === "all" ? MENA_ARTISTS.length : MENA_ARTISTS.filter(a => a.role === r).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <TutorialOverlay tabId="community" />
      <div>
        <h1 className="brand-text-grad text-3xl font-extrabold tracking-tight">🌍 MENA Community</h1>
        <p className="mt-1 text-sm text-zinc-400">
          {MENA_ARTISTS.length} artists, producers, engineers & creatives across {new Set(MENA_ARTISTS.map(a => a.country)).size} countries.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "DJs", count: MENA_ARTISTS.filter(a => a.role === "dj").length, emoji: "🎧" },
          { label: "Producers", count: MENA_ARTISTS.filter(a => a.role === "producer").length, emoji: "🎹" },
          { label: "Production", count: MENA_ARTISTS.filter(a => ["sound_engineer","lighting_tech","visual_artist","production"].includes(a.role)).length, emoji: "🔊" },
          { label: "Live Opportunities", count: opportunities.length, emoji: "🎯" },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center">
            <div className="text-lg">{s.emoji}</div>
            <div className="text-xl font-bold text-zinc-100">{s.count}</div>
            <div className="text-[10px] text-zinc-500">{s.label}</div>
          </div>
        ))}
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
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
            ⚠ Example profiles — built to show the kind of MENA DJs, producers and crew worth building relationships with. These are not real accounts and the handles are invented, so they are not shown as links here. Use this list for inspiration on who to search for on Instagram or SoundCloud, not as a contact list.
          </div>
          {/* Role filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {allRoles.map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={"whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition " + (roleFilter === r ? "bg-fuchsia-600 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white")}>
                {r === "all" ? `All (${roleCounts[r]})` : `${ROLE_LABELS[r] || r} (${roleCounts[r]})`}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1 overflow-x-auto">
              {allGenres.slice(0, 8).map(g => (
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

          <p className="text-xs text-zinc-500">{filtered.length} results</p>

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
                    <span className="mt-0.5 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">{ROLE_LABELS[artist.role] || artist.role}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{artist.bio}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {artist.genre.map(g => <span key={g} className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">{g}</span>)}
                </div>
                <div className="mt-2 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 px-3 py-2">
                  <p className="text-[11px] text-fuchsia-300">🔍 Looking for: {artist.lookingFor}</p>
                </div>
                <p className="mt-3 text-[10px] text-zinc-600">Example only — not a real Instagram handle.</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "opportunities" && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-500">{opportunities.length} live leads, pulled from Platinumlist, Time Out Dubai, Resident Advisor, Hozpitality, Dubai Calendar and GulfTalent</p>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Same feed as GigRadar</span>
          </div>
          {sweeping && <p className="text-xs text-zinc-500">Checking live feeds…</p>}
          {!sweeping && opportunities.length === 0 && (
            <Card className="p-4 text-center">
              <p className="text-sm text-zinc-300">No live leads cached yet.</p>
              <p className="mt-1 text-xs text-zinc-500">Open GigRadar and tap Sweep Now, or paste a lead there manually — this tab shows the same real list.</p>
              <a href="/studio/gigradar" className="mt-3 inline-block rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">Open GigRadar</a>
            </Card>
          )}
          {opportunities.map(opp => (
            <Card key={opp.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " +
                      (opp.type === "DJ Booking" ? "bg-fuchsia-600/20 text-fuchsia-300" :
                      opp.type === "Festival Slot" ? "bg-amber-500/20 text-amber-300" :
                      opp.type === "Residency Offer" ? "bg-blue-500/20 text-blue-300" :
                      opp.type === "Radio" ? "bg-cyan-500/20 text-cyan-300" :
                      opp.type === "Studio" ? "bg-violet-500/20 text-violet-300" :
                      opp.type === "Production" ? "bg-orange-500/20 text-orange-300" :
                      "bg-zinc-700/50 text-zinc-300")}>{opp.type}</span>
                    {opp.recurring && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Recurring</span>}
                    <span className="text-[10px] text-zinc-600">{opp.posted}</span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-zinc-100">{opp.title}</h3>
                  <p className="text-xs text-zinc-500">{opp.artist} · {opp.city}{opp.area ? ` (${opp.area})` : ""} · {opp.genre}</p>
                </div>
                {(opp.payAed || opp.payUsd) && (
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-emerald-400">{opp.payAed ? `AED ${opp.payAed}` : `$${opp.payUsd}`}</div>
                    <div className="text-[10px] text-zinc-600">per booking</div>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{opp.description}</p>

              {/* Details row */}
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-zinc-500">
                {opp.equipment && <span>🎛 {opp.equipment}</span>}
                {opp.capacity && <span>👥 {opp.capacity} capacity</span>}
              </div>

              {/* Contact info */}
              {opp.contact && (
                <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Tap to reach the venue — pitch is pre-written, just hit send</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {opp.contact.name && <span className="text-zinc-200 font-semibold">{opp.contact.name}{opp.contact.role ? ` — ${opp.contact.role}` : ""}</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {opp.contact.email && (
                      <button onClick={() => openEmail(opp.contact!.email!, opp.contact?.name || "", opp.title)}
                        className="rounded-lg border border-fuchsia-500/50 bg-fuchsia-500/10 px-2.5 py-1.5 text-[11px] text-fuchsia-300 hover:bg-fuchsia-500/20 transition text-left">
                        ✉ Email pitch to {opp.contact.name || "venue"}
                      </button>
                    )}
                    {opp.contact.whatsapp && (
                      <button onClick={() => openWhatsApp(opp.contact!.whatsapp!, opp.contact?.name || "", opp.title)}
                        className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] text-emerald-300 hover:bg-emerald-500/20 transition">
                        💬 WhatsApp pitch to {opp.contact.name || "venue"}
                      </button>
                    )}
                    {opp.contact.phone && (
                      <button onClick={() => { if (detectPhone(opp.contact!.phone!) === "whatsapp") openWhatsApp(opp.contact!.phone!, opp.contact?.name || "", opp.title); else openCall(opp.contact!.phone!); }}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:border-fuchsia-500 hover:bg-fuchsia-500/10 transition">
                        {detectPhone(opp.contact!.phone!) === "whatsapp" ? "💬" : "📞"} {opp.contact.phone}
                      </button>
                    )}
                    {opp.contact.instagram && (
                      <button onClick={() => openInstagramDM(opp.contact!.instagram!)}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:border-fuchsia-500 hover:bg-fuchsia-500/10 transition">
                        📸 DM {opp.contact.instagram}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {opp.contact?.email && (
                  <button onClick={() => openEmail(opp.contact!.email!, opp.contact?.name || "", opp.title)}
                    className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                    ✉ Apply Now
                  </button>
                )}
                {opp.contact?.whatsapp && (
                  <button onClick={() => openWhatsApp(opp.contact!.whatsapp!, opp.contact?.name || "", opp.title)}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition">
                    💬 WhatsApp
                  </button>
                )}
                {false && (
                  <button
                    onClick={() => {
                      const pitch = `DEAD\n\nI saw your listing for "${opp.title}" and I would like to express my interest.\n\nI am ${DJ_EMY.name} (${DJ_EMY.legalName}), ${DJ_EMY.tagline}.\n\n▸ KEY CREDENTIALS:\n• ${DJ_EMY.sellingPoints[0]}\n• ${DJ_EMY.selectedAppearances[0]}\n• ${DJ_EMY.selectedAppearances[1]}\n• Bilingual: ${DJ_EMY.languages.join(" / ")}\n• Genres: ${DJ_EMY.genres.join(", ")}\n\n▸ SELECTED APPEARANCES:\n${DJ_EMY.selectedAppearances.map(a => "• " + a).join("\n")}\n\n▸ LINKS:\nEPK: ${DJ_EMY.epkUrl || ""}\nInstagram: https://instagram.com/${(DJ_EMY.instagram || "").replace("@","")}\nYouTube: ${DJ_EMY.youtube || ""}\n\n▸ MANAGEMENT:\n${DJ_EMY.management.company}\n${DJ_EMY.management.contactName} — ${DJ_EMY.management.contactRole}\nEmail: ${DJ_EMY.management.email}\nPhone/WhatsApp: ${DJ_EMY.management.phone}\nWebsite: ${DJ_EMY.management.website || ""}\n\n▸ TECH RIDER:\n${DJ_EMY.techRider.players.join(", ")}\n${DJ_EMY.techRider.mixer.join(", ")}\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${DJ_EMY.management.contactName}\n${DJ_EMY.management.company}\n${DJ_EMY.management.phone}`;
                      void navigator.clipboard.writeText(pitch);
                      window.open(`mailto:${opp.contact?.email}?subject=${encodeURIComponent("DJ Booking Inquiry: " + opp.title + " — " + DJ_EMY.name)}`, "_blank");
                    }}
                    className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                    Apply Now (opens email + copies pitch)
                  </button>
                )}
                <button onClick={() => { setTab("connect"); setConnectMsg(generatePitchText(opp.contact?.name || "", opp.title)); }}
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-fuchsia-500 transition">
                  Draft Message
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
            <SectionLabel>Find a Real Contact</SectionLabel>
            <p className="mt-1 text-xs text-zinc-500">
              Paste anything that has a real person&apos;s details in it — an Instagram bio, a WhatsApp reply, a venue&apos;s
              &quot;contact us&quot; page. This only pulls out what is actually written there; it never guesses or fills anything in.
            </p>
            <textarea value={pasteText} onChange={e => setPasteText(e.target.value)} rows={4}
              placeholder="Paste the text here…"
              className="mt-3 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs text-zinc-200 focus:border-fuchsia-500 focus:outline-none leading-relaxed" />
            <div className="mt-2 flex gap-2">
              <Button onClick={runFind} disabled={!pasteText.trim()}>Find Contacts</Button>
              <Button variant="ghost" onClick={() => { setPasteText(""); setFoundContacts([]); }}>Clear</Button>
            </div>
            {foundContacts.length === 0 && pasteText.trim() && (
              <p className="mt-3 text-xs text-zinc-500">No email, phone number or @handle found in that text yet.</p>
            )}
            {foundContacts.length > 0 && (
              <div className="mt-3 space-y-2">
                {foundContacts.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-300">
                      {c.email && <span>✉ {c.email}</span>}
                      {c.phone && <span>📞 {c.phone}</span>}
                      {c.instagram && <span>📸 {c.instagram}</span>}
                    </div>
                    <Button onClick={() => keepContact(c)}>Save Contact</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {contacts.length > 0 && (
            <Card className="p-4 sm:p-5">
              <SectionLabel>Your Real Contacts ({contacts.length})</SectionLabel>
              <div className="mt-3 space-y-2">
                {contacts.map(c => (
                  <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
                    <div className="min-w-0">
                      {(c.name || c.venue) && <p className="text-xs font-semibold text-zinc-200">{[c.name, c.venue].filter(Boolean).join(" — ")}</p>}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-400">
                        {c.email && <span>✉ {c.email}</span>}
                        {c.phone && <span>📞 {c.phone}</span>}
                        {c.instagram && <span>📸 {c.instagram}</span>}
                      </div>
                    </div>
                    <button onClick={() => { removeContact(c.id); setContacts(getSavedContacts()); }}
                      className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400 hover:border-red-500 hover:text-red-300 transition">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

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
