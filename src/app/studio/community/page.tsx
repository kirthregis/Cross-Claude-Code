"use client";
import { useState } from "react";
import { Card, SectionLabel, Button } from "@/components/studio/ui";
import { t } from "@/lib/studio/i18n";
import { useArabic } from "@/components/studio/ArabicToggle";
import { useSettings } from "@/lib/studio/store";
import { DJ_EMY } from "@/lib/artist";
import { TutorialOverlay } from "@/components/studio/TutorialOverlay";

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
  { id: "1", name: "DJ Emy", handle: "@DJEMY", city: "Dubai", country: "🇦🇪 UAE", role: "dj", genre: ["Afro House", "Afro Tech"], lookingFor: "Vocalist for studio collaboration", bio: "Professional Afro House DJ based in Dubai. Playing superclubs and beach clubs across UAE.", instagram: "@dj_emy_", avatar: "🎧", verified: true },
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

const OPPORTUNITIES: Opportunity[] = [
  // ── UAE — Dubai ───────────────────────────────────────────
  { id: "1", type: "DJ Booking", title: "Friday Night Residency — SKYBAR Dubai", artist: "SKYBAR Dubai", city: "Dubai", area: "Downtown", genre: "Open Format / House / Arabic", description: "Seeking a versatile DJ for flagship Friday night. Open format sets covering Arabic hits, house, hip-hop. Minimum 4-hour sets, weekly commitment. Pioneer CDJ-3000 x 4 + DJM-V10.", posted: "1 day ago", payAed: "3,000–5,500", equipment: "CDJ-3000 x4, DJM-V10", capacity: "800", recurring: true, contact: { name: "Sarah Al-Maktoum", role: "Entertainment Director", email: "entertainment@skybardubai.com", whatsapp: "+971501234567", instagram: "@skybardubai" } },
  { id: "2", type: "DJ Booking", title: "Saturday Pool Party — FIVE Palm Jumeirah", artist: "FIVE Palm Jumeirah", city: "Dubai", area: "Palm Jumeirah", genre: "Afro House / Deep House / Tropical", description: "Weekly pool party DJ. Sat & Sun 1pm–7pm. International crowd, high-energy daytime sets. Bikini-friendly venue, bottle service. Food & drinks included for artist.", posted: "2 days ago", payAed: "2,500–4,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "500", recurring: true, contact: { name: "Ahmed Booking Team", role: "Pool Events", email: "poolevents@fivehotelsandresorts.com", phone: "+97145551234", instagram: "@faborabeachclub" } },
  { id: "3", type: "DJ Booking", title: "Thursday Ladies Night — Soho Garden Meydan", artist: "Soho Garden", city: "Dubai", area: "Meydan", genre: "Tech House / Afro House / Commercial", description: "Ladies night resident DJ. Every Thursday 10pm–3am. Must have strong social media following (5K+ minimum). Dedicated DJ booth with full lighting rig.", posted: "3 days ago", payAed: "2,500–4,500", equipment: "CDJ-3000 x4, DJM-V10, booth monitors", capacity: "1,200", recurring: true, contact: { name: "Events Team", role: "DJ Bookings", email: "djbookings@sohogarden.com", whatsapp: "+971509876543", instagram: "@sohogardenpalm" } },
  { id: "4", type: "DJ Booking", title: "Sunset Sessions — Cove Beach Dubai", artist: "Cove Beach", city: "Dubai", area: "Bluewaters Island", genre: "Deep House / Organic House / Nu-Disco", description: "Weekly sunset session DJ. Wed–Fri 3pm–9pm. Mellow into groovy transition. Beachfront with stunning Ain Dubai views. Meals provided.", posted: "1 day ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "400", recurring: true, contact: { name: "Cove Music", role: "Music Director", email: "music@covebeach.com", instagram: "@covebeach" } },
  { id: "5", type: "DJ Booking", title: "Brunch DJ — Barasti Beach Bar", artist: "Barasti", city: "Dubai", area: "JBR", genre: "Open Format / Pop / House / Arabic", description: "Friday brunch DJ. 1pm–5pm, then transitions to afterparty 5pm–10pm. Casual beach vibe, mixed crowd. One of Dubai's most iconic beach bars.", posted: "4 days ago", payAed: "1,800–3,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "600", recurring: true, contact: { name: "Barasti Events", email: "events@barasti.com", phone: "+97143189100", instagram: "@barastibeach" } },
  { id: "6", type: "DJ Booking", title: "Techno Underground — Warehouse Al Quoz", artist: "Analog Room", city: "Dubai", area: "Al Quoz", genre: "Techno / Dark Techno / Minimal", description: "Monthly underground warehouse event. 3-hour headline set. Must have original productions or strong underground selection. No commercial. Funktion-One Vero system.", posted: "2 days ago", payAed: "2,200–4,000", equipment: "CDJ-3000 x2, DJM-V10, Funktion-One Vero", capacity: "300", contact: { name: "Analog Room Collective", email: "bookings@analogroom.ae", whatsapp: "+971551234567", instagram: "@analogroomdxb" } },
  { id: "7", type: "DJ Booking", title: "WHITE Dubai — Guest DJ Application", artist: "WHITE Dubai", city: "Dubai", area: "Meydan", genre: "EDM / House / Hip-Hop", description: "Peak-time guest DJ slots (1am–3am). Must have superclub experience and original productions or official edits. Massive crowd, full production. Apply with EPK + 1hr mix.", posted: "5 days ago", payAed: "5,000–12,000", equipment: "CDJ-3000 x4, DJM-V10, full LED wall", capacity: "3,000", contact: { name: "WHITE Talent", role: "Talent Booking", email: "talent@whitedubai.com", instagram: "@whitedubai" } },
  { id: "8", type: "DJ Booking", title: "Zero Gravity — Saturday Night", artist: "Zero Gravity", city: "Dubai", area: "DMCC", genre: "Commercial / House / EDM", description: "Saturday night headline DJ. 11pm–3am. Pool-to-club crossover venue. High-energy commercial sets with smooth transitions. International headliners rotate.", posted: "3 days ago", payAed: "3,500–6,000", equipment: "CDJ-3000 x4, DJM-V10", capacity: "2,000", recurring: true, contact: { name: "ZG Entertainment", email: "entertainment@0-gravity.ae", phone: "+97142459888", instagram: "@zerogravitydubai" } },
  { id: "9", type: "DJ Booking", title: "Iris Dubai — Tuesday Deep House", artist: "Iris Dubai", city: "Dubai", area: "Meydan", genre: "Deep House / Melodic House", description: "Weekly Tuesday night deep house session. 9pm–2am. Intimate rooftop setting with skyline views. Looking for a DJ who builds sets gradually.", posted: "1 day ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "350", recurring: true, contact: { name: "Iris Music", email: "music@irisdubai.com", whatsapp: "+971505551234", instagram: "@irisdubai" } },
  { id: "10", type: "DJ Booking", title: "W Dubai — Wet Deck Sessions", artist: "W Dubai — The Palm", city: "Dubai", area: "Palm Jumeirah", genre: "Nu-Disco / Organic House / Downtempo", description: "Poolside sunset DJ. Thu–Sat 3pm–8pm. Cool, stylish, understated. No EDM drops. Think Keinemusik, &ME, Solomun afternoon vibes.", posted: "2 days ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "200", recurring: true, contact: { name: "W Happenings", role: "Music & Events", email: "happenings.wdubai@whotels.com", instagram: "@wdubaithepalm" } },
  { id: "11", type: "DJ Booking", title: "Billionaire Dubai — Weekend DJ", artist: "Billionaire Dubai", city: "Dubai", area: "DIFC", genre: "Commercial / Arabic / House / Hip-Hop", description: "Weekend DJ Fri–Sat 11pm–3am. Premium dinner-to-party transition. Must handle Arabic, Western pop, and house seamlessly. VIP crowd, dress code enforced.", posted: "4 days ago", payAed: "4,000–7,000", equipment: "Full Pioneer setup", capacity: "500", recurring: true, contact: { name: "Billionaire Entertainment", email: "entertainment@billionairedubai.com", phone: "+97143468999", instagram: "@billionaire_dubai" } },
  { id: "12", type: "DJ Booking", title: "Azure Beach — Daytime Resident", artist: "Azure Beach", city: "Dubai", area: "Rixos Premium JBR", genre: "Afro House / Deep House / Tropical", description: "Daily daytime DJ. 12pm–6pm. Pool & beach setting. Rotation schedule (3-4 days/week). Perfect for DJs building a residency portfolio.", posted: "2 days ago", payAed: "1,500–2,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "300", recurring: true, contact: { name: "Azure Music", email: "music@azurebeachclub.com", instagram: "@azurebeachdubai" } },
  { id: "13", type: "DJ Booking", title: "Luxury Yacht Party DJ — Abu Dhabi", artist: "Private Charter", city: "Abu Dhabi", area: "Yas Marina", genre: "Open Format / House / Pop", description: "Private yacht party. 80 guests, 4pm–midnight. Transition from sunset chill to evening party. Equipment provided. Catering included for artist.", posted: "1 day ago", payAed: "4,500–7,500", equipment: "Provided (Pioneer)", capacity: "80", contact: { name: "Marina Events", email: "events@yasmarinaevents.ae", whatsapp: "+971567891234", instagram: "@yasmarinaevents" } },
  { id: "14", type: "DJ Booking", title: "Yas Hotel Rooftop — Friday Sundowner", artist: "W Abu Dhabi — Yas Island", city: "Abu Dhabi", area: "Yas Island", genre: "Deep House / Afro House / Sunset", description: "Weekly Friday sundowner set. 5pm–10pm. Rooftop overlooking Yas Marina Circuit. Premium international crowd.", posted: "3 days ago", payAed: "2,500–4,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "250", recurring: true, contact: { name: "W Abu Dhabi Events", email: "events.yasdubai@whotels.com", instagram: "@wabudhabi" } },
  { id: "15", type: "DJ Booking", title: "Dubai Mall Ramadan Suhoor Event", artist: "Dubai Mall", city: "Dubai", area: "Downtown", genre: "Arabic / Chill / Ambient / Lounge", description: "Ramadan suhoor entertainment. 9pm–2am during Ramadan. Culturally appropriate music selection required. Tasteful, ambient Arabic and chill. Large public area.", posted: "5 days ago", payAed: "2,200–3,700", capacity: "Open air", contact: { name: "Emaar Events", email: "events@emaar.com", phone: "+97148883333", instagram: "@thedubaimall" } },
  { id: "16", type: "DJ Booking", title: "Nikki Beach — Weekend Pool DJ", artist: "Nikki Beach Dubai", city: "Dubai", area: "Pearl Jumeira", genre: "Deep House / Afro House / Tropical", description: "Sat–Sun pool party DJ. 12pm–7pm. International beach club brand. Must deliver consistent energy without going too hard. Stylish crowd.", posted: "2 days ago", payAed: "2,500–4,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "400", recurring: true, contact: { name: "Nikki Beach Music", email: "djbookings@nikkibeach.com", instagram: "@nikkibeachdubai" } },

  // ── UAE — Corporate & Weddings ─────────────────────────────
  { id: "20", type: "DJ Booking", title: "Corporate Gala — Atlantis The Royal", artist: "Atlantis The Royal", city: "Dubai", area: "Palm Jumeirah", genre: "Lounge / Pop / House", description: "Corporate awards gala for 400 guests. Background during dinner (7pm–10pm), then dance set (10pm–1am). Black tie. Equipment provided.", posted: "3 days ago", payAed: "5,000–8,000", equipment: "Provided", capacity: "400", contact: { name: "Atlantis Events", email: "events@atlantistheroyal.com", phone: "+97144260000", instagram: "@atlantistheroyal" } },
  { id: "21", type: "DJ Booking", title: "Wedding DJ — Jumeirah Al Qasr", artist: "Jumeirah Al Qasr", city: "Dubai", area: "Umm Suqeim", genre: "Arabic / Pop / Khaleeji / House", description: "Luxury Arabic wedding. 500 guests. Must handle khaleeji, Arabic pop, dabke, and transition to Western house. 8pm–2am. Bilingual MC skills a plus.", posted: "4 days ago", payAed: "5,500–9,000", equipment: "Provided", capacity: "500", contact: { name: "Wedding Planner", role: "Fatima Events", email: "fatima@fatimaevents.ae", whatsapp: "+971501112233", instagram: "@fatimaeventsae" } },
  { id: "22", type: "DJ Booking", title: "Tech Launch Party — DIFC", artist: "Fintech Company", city: "Dubai", area: "DIFC Gate Village", genre: "House / Nu-Disco / Indie", description: "Product launch event. 200 guests, 6pm–11pm. Cool startup vibe, not corporate stiff. Think Disclosure, Rüfüs Du Sol, Bicep energy.", posted: "1 day ago", payAed: "3,000–5,000", equipment: "Provided", capacity: "200", contact: { name: "Launch Events", email: "events@dubailaunchparty.com", whatsapp: "+971559998877" } },

  // ── UAE — Radio & Studio ──────────────────────────────────
  { id: "25", type: "Radio", title: "Guest Mix — Virgin Radio Dubai", artist: "Virgin Radio Dubai", city: "Dubai", genre: "Open Format / Dance", description: "Weekly guest DJ mix slot. Friday 8pm–10pm. 1-hour recorded mix + 30-min live interview. Massive Gulf-wide audience. Great exposure.", posted: "6 days ago", payAed: "750–1,500", contact: { name: "Music Department", email: "music@virginradiodubai.com", instagram: "@virginradiodubai" } },
  { id: "26", type: "Radio", title: "Resident Mix — Pulse 95 FM", artist: "Pulse 95 Radio", city: "Dubai", genre: "House / Deep House / Afro", description: "Monthly resident mix spot. 1-hour pre-recorded mix for Saturday night show. Growing electronic music audience in UAE.", posted: "3 days ago", payAed: "500–1,000", contact: { name: "Pulse Programming", email: "djs@pulse95.com", instagram: "@pulse95radio" } },
  { id: "27", type: "Studio", title: "Remix Commission — Arabic Pop Artist", artist: "Major Label UAE", city: "Dubai", genre: "Pop / House / Electronic", description: "Established Arabic pop artist seeking official remix (house/electronic). Studio session in Dubai Media City. Potential release on major label.", posted: "2 days ago", payAed: "3,700–7,500", contact: { name: "A&R Department", email: "ar@majorlabeluae.com" } },

  // ── Saudi Arabia ──────────────────────────────────────────
  { id: "30", type: "DJ Booking", title: "SOUNDSTORM 2026 — DJ Applications", artist: "MDLBEAST", city: "Riyadh", genre: "All Electronic", description: "SOUNDSTORM festival DJ applications open. Multiple stages, 3-day festival. Apply with EPK, mix, and social links. Travel and hotel covered for selected artists.", posted: "1 week ago", payAed: "7,500–20,000+", capacity: "200,000 (festival)", contact: { name: "MDLBEAST Talent", email: "talent@mdlbeast.com", instagram: "@mdlbeast" } },
  { id: "31", type: "DJ Booking", title: "Riyadh Season Boulevard — Club Resident", artist: "Riyadh Season", city: "Riyadh", genre: "EDM / House / Hip-Hop / Arabic", description: "Riyadh Season 2026 club venue seeking resident DJs. Nov–Mar season. Massive crowds, full production. Multiple genre slots available.", posted: "5 days ago", payAed: "5,500–15,000", capacity: "5,000", contact: { name: "Season Entertainment", email: "entertainment@riyadhseason.sa", instagram: "@riikiarts" } },
  { id: "32", type: "DJ Booking", title: "AlUla Music Festival — Desert Stage", artist: "Royal Commission for AlUla", city: "AlUla", genre: "Electronic / World / Ambient", description: "UNESCO heritage site desert festival. Unique setting among ancient tombs. Electronic + world music stage. Travel, hotel, meals covered.", posted: "3 days ago", payAed: "5,000–12,000", contact: { name: "AlUla Events", email: "music@experiencealula.com", instagram: "@experiencealula" } },
  { id: "33", type: "DJ Booking", title: "Jeddah Corniche — Weekly Night Market DJ", artist: "Jeddah Events", city: "Jeddah", genre: "Chill / Pop / Arabic / Lounge", description: "Weekly night market entertainment. Thu–Fri 6pm–midnight. Family-friendly early, builds energy late. Outdoor stage by the Red Sea.", posted: "4 days ago", payAed: "1,500–2,800", recurring: true, contact: { name: "Jeddah Municipality Events", email: "events@jeddah.gov.sa" } },

  // ── Qatar ──────────────────────────────────────────────────
  { id: "35", type: "DJ Booking", title: "Beach Club Sunset — Banana Island Resort", artist: "Anantara Banana Island", city: "Doha", genre: "Organic House / Chill / Downtempo", description: "Weekly sunset session. Saturday 3pm–9pm. Exclusive island resort accessible only by boat. Premium international crowd.", posted: "2 days ago", payAed: "1,800–3,300 (QAR)", equipment: "Provided", capacity: "150", recurring: true, contact: { name: "Resort Events", email: "events.doha@anantara.com", instagram: "@anantarabanana" } },
  { id: "36", type: "DJ Booking", title: "Lusail Entertainment City — Opening Weekend", artist: "Qatar Entertainment", city: "Doha", area: "Lusail", genre: "EDM / House / Commercial", description: "New entertainment complex opening. Multiple DJ slots over launch weekend. World Cup legacy venue.", posted: "5 days ago", payAed: "3,700–7,500 (QAR)", capacity: "2,000", contact: { name: "Lusail Events", email: "entertainment@lusail.qa" } },

  // ── Bahrain ────────────────────────────────────────────────
  { id: "38", type: "DJ Booking", title: "Bahrain F1 Grand Prix — Official Afterparty", artist: "The Reef Club", city: "Manama", genre: "EDM / House / Commercial", description: "F1 weekend afterparty. 2,000+ capacity. Full production (CO2, confetti, pyro). International audience. 11pm–5am.", posted: "1 week ago", payAed: "7,500–18,500 (BHD)", equipment: "CDJ-3000 x4, DJM-V10, full production", capacity: "2,000", contact: { name: "Reef Club Events", email: "events@thereefclub.bh", instagram: "@thereefclub" } },

  // ── Lebanon ────────────────────────────────────────────────
  { id: "40", type: "DJ Booking", title: "B018 Beirut — Monthly Guest", artist: "B018", city: "Beirut", genre: "Techno / Minimal / Acid", description: "Legendary underground venue. Monthly guest DJ slot. Must have original productions or strong underground cred. 12am–6am.", posted: "4 days ago", payUsd: "400–800", equipment: "CDJ-3000 x2, DJM-V10", capacity: "400", contact: { name: "B018 Bookings", email: "bookings@b018.com", instagram: "@b018official" } },
  { id: "41", type: "DJ Booking", title: "Wedding DJ — Four Seasons Beirut", artist: "Four Seasons Beirut", city: "Beirut", genre: "Arabic / Dabke / Pop / House", description: "Elegant Lebanese wedding. Must handle dabke, Arabic pop, and transition to Western. Bilingual MC ability required.", posted: "5 days ago", payUsd: "800–1,500", contact: { name: "Wedding Coordinator", email: "weddings.beirut@fourseasons.com", phone: "+9611761000" } },

  // ── Egypt ──────────────────────────────────────────────────
  { id: "43", type: "DJ Booking", title: "Cairo Rooftop — Deep House Residency", artist: "Nile Terrace", city: "Cairo", area: "Zamalek", genre: "Deep House / Lounge", description: "New rooftop venue with Nile views. Thursday night launch series. Upscale crowd, sunset-to-midnight.", posted: "2 days ago", payUsd: "400–700", capacity: "200", recurring: true, contact: { name: "Nile Terrace Events", email: "events@nileterrace.com", instagram: "@nileterrace_eg" } },
  { id: "44", type: "DJ Booking", title: "North Coast Beach Festival — 6 DJ Slots", artist: "Sahel Festival", city: "Alexandria", genre: "House / Techno / Trance / Afro", description: "Summer beach festival on Mediterranean coast. 3-day event, 2 stages. Travel from Cairo provided. Multiple slots for all electronic genres.", posted: "1 week ago", payUsd: "300–1,500", capacity: "5,000", contact: { name: "Sahel Festival", email: "artists@sahelfestival.com", instagram: "@sahelfestival" } },

  // ── Morocco ────────────────────────────────────────────────
  { id: "46", type: "Festival Slot", title: "Marrakech Music Festival — Atlas Mountains", artist: "Atlas Arena", city: "Marrakech", genre: "House / Techno / Trance", description: "Annual festival in the Atlas Mountains. 2-day event, electronic stage. International + local lineup. Hotel and meals covered.", posted: "3 days ago", payUsd: "1,000–3,000", capacity: "8,000", contact: { name: "Atlas Festival", email: "artists@atlasfestival.ma", instagram: "@atlasfestival" } },

  // ── Collaboration & Other ─────────────────────────────────
  { id: "50", type: "Collaboration", title: "Looking for Arabic Vocalist", artist: "DJ Emy", city: "Dubai", genre: "Afro House", description: "Working on an original Afro House track with Arabic lyrics. Need a female vocalist for studio session in Dubai or remote recording.", posted: "2 days ago", contact: { name: "DJ Emy / EVG", email: "admin@emyvisiongroup.com", whatsapp: "+971503443281", instagram: "@dj_emy_" } },
  { id: "51", type: "Remix Swap", title: "Afro House Remix Exchange", artist: "Omar Groove", city: "Abu Dhabi", genre: "Afro House / Tribal", description: "Have 2 original unreleased tracks. Looking for DJs/producers to remix one each. I remix yours in return. WAV stems provided.", posted: "5 days ago", contact: { name: "Omar", instagram: "@omargroove_ae" } },
  { id: "52", type: "Label Demo", title: "Demo Submissions Open — Desert Rave Records", artist: "Desert Rave Records", city: "Dubai", genre: "Afro House / Afro Tech", description: "MENA-based label accepting demos. Afro House and Afro Tech only. Send EPK + 2 demos (WAV). Response within 2 weeks.", posted: "1 week ago", contact: { name: "A&R", email: "demos@desertraverecords.com", instagram: "@desertraverecords" } },
  { id: "53", type: "Festival Slot", title: "ADE 2026 — MENA Showcase", artist: "Amsterdam Dance Event", city: "Amsterdam", genre: "All Electronic", description: "Curating MENA artists for ADE 2026 showcase. Submit EPK + 30-min mix. Travel support available for selected artists.", posted: "4 days ago", contact: { name: "ADE MENA", email: "mena@amsterdam-dance-event.nl", instagram: "@ikiarts" } },
  { id: "54", type: "Production", title: "Sound System Install — New JBR Club", artist: "Confidential", city: "Dubai", area: "JBR", genre: "All Genres", description: "New 1,500-capacity club needs full sound system design and install. Funktion-One or equivalent. Acoustics consultation included.", posted: "1 week ago", payAed: "18,000–55,000", contact: { name: "Project Manager", email: "newclub@dubaientertainment.ae" } },
  { id: "55", type: "Residency Offer", title: "New Beach Club Opening — RAK", artist: "Confidential", city: "Ras Al Khaimah", genre: "Deep House / Afro House / Tropical", description: "New beach club opening in RAK. Seeking 3 resident DJs for rotation. Thu/Fri/Sat. Long-term commitment. Housing assistance available.", posted: "3 days ago", payAed: "2,000–3,500", recurring: true, contact: { name: "RAK Beach Club", email: "hr@rakbeachclub.ae", whatsapp: "+971527778899" } },

  // ── UAE — More Dubai DJ Gigs ──────────────────────────────
  { id: "60", type: "DJ Booking", title: "Drift Beach — Weekend Resident", artist: "Drift Beach Dubai", city: "Dubai", area: "One&Only Royal Mirage", genre: "Deep House / Organic House", description: "Ultra-premium beachfront. Sat-Sun 12pm-7pm. Refined, understated daytime sets. No drops, no EDM. Think Satin Jackets, Folamour, Session Victim vibes. 5-star crowd.", posted: "1 day ago", payAed: "2,500–4,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "200", recurring: true, contact: { name: "Drift Events", role: "Music Coordinator", email: "music@driftbeachdubai.com", instagram: "@driftbeachdubai" } },
  { id: "61", type: "DJ Booking", title: "Twiggy by La Cantine — Thursday Night", artist: "Twiggy by La Cantine", city: "Dubai", area: "Park Hyatt", genre: "Nu-Disco / Indie Dance / Balearic", description: "Iconic Dubai Creek venue. Thursday sunset-to-late. Sophisticated French Riviera meets Dubai. Vinyl sets welcome.", posted: "2 days ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2, vinyl optional", capacity: "250", recurring: true, contact: { name: "La Cantine Group", email: "events@lacantine.ae", phone: "+97142028088", instagram: "@twiggydubai" } },
  { id: "62", type: "DJ Booking", title: "Nobu Dubai — Friday Dinner DJ", artist: "Nobu Dubai", city: "Dubai", area: "Atlantis The Palm", genre: "Lounge / Japanese-inspired / Deep House", description: "Friday dinner service DJ. 8pm-12am. Subtle, atmospheric. Must complement fine dining experience. Background becoming foreground as evening progresses.", posted: "3 days ago", payAed: "2,500–4,000", equipment: "Provided", capacity: "300", recurring: true, contact: { name: "Nobu Events Dubai", email: "events.dubai@noburestaurants.com", instagram: "@nobudubai" } },
  { id: "63", type: "DJ Booking", title: "AURA Skypool — Rooftop Sessions", artist: "AURA Skypool Lounge", city: "Dubai", area: "The Palm Tower", genre: "Deep House / Melodic / Organic", description: "360° Palm views. The highest infinity pool in the world. Wed-Sun 2pm-8pm sunset sessions. Premium international crowd. Equipment provided.", posted: "1 day ago", payAed: "2,500–4,500", equipment: "CDJ-3000 x2, DJM-V10", capacity: "200", recurring: true, contact: { name: "AURA Music", email: "music@auraskypool.com", instagram: "@auraskypoollounge" } },
  { id: "64", type: "DJ Booking", title: "Galliard — DIFC Friday Night", artist: "Galliard", city: "Dubai", area: "DIFC", genre: "House / Tech House / Disco", description: "DIFC rooftop. Friday night 9pm-2am. Skyline views, premium bar. Energetic but sophisticated house sets. Social media content creation support.", posted: "4 days ago", payAed: "2,500–4,000", equipment: "CDJ-3000 x2, DJM-V10", capacity: "350", recurring: true, contact: { name: "Galliard Events", email: "events@galliardlounge.com", whatsapp: "+971501119988", instagram: "@galliarddubai" } },
  { id: "65", type: "DJ Booking", title: "Nammos Beach Club — Daytime Resident", artist: "Nammos Dubai", city: "Dubai", area: "Four Seasons Resort", genre: "Afro House / Tropical / Mediterranean", description: "Mykonos-born beach club in Dubai. Daily daytime sets 12pm-7pm. Rotation schedule. Greek-Mediterranean party vibes. International jet-set crowd.", posted: "2 days ago", payAed: "2,500–5,000", equipment: "CDJ-3000 x2, DJM-V10", capacity: "500", recurring: true, contact: { name: "Nammos Entertainment", email: "entertainment@nammosdubai.com", instagram: "@nammosdubai" } },
  { id: "66", type: "DJ Booking", title: "SĀN Beach — Saturday Sunset to Late", artist: "SĀN Beach", city: "Dubai", area: "Five Luxe JBR", genre: "Commercial / House / Arabic / R&B", description: "New premium beach club at FIVE Luxe JBR. Saturday 3pm-midnight. Transition from pool chill to nightclub energy. Big production.", posted: "1 day ago", payAed: "3,000–5,500", equipment: "CDJ-3000 x4, DJM-V10, full LED", capacity: "600", recurring: true, contact: { name: "FIVE Music", email: "music@fivehotelsandresorts.com", whatsapp: "+971504445566", instagram: "@sanbeach" } },
  { id: "67", type: "DJ Booking", title: "BASE Dubai — Resident Applications", artist: "BASE Dubai", city: "Dubai", area: "d3 Design District", genre: "Hip-Hop / R&B / Afrobeats / Arabic", description: "Dubai's biggest nightclub. Resident DJ applications open. Wed-Sat 11pm-3am. Must handle hip-hop, R&B, Afrobeats, Arabic seamlessly. High-energy crowd.", posted: "5 days ago", payAed: "3,000–6,000", equipment: "CDJ-3000 x4, DJM-V10, full production", capacity: "3,000", recurring: true, contact: { name: "BASE Bookings", role: "Talent Manager", email: "talent@basedubai.com", instagram: "@basedubai" } },
  { id: "68", type: "DJ Booking", title: "Toy Room Dubai — Thursday Ladies Night", artist: "Toy Room Dubai", city: "Dubai", area: "Meydan", genre: "Commercial / Pop / House / Hip-Hop", description: "Thursday ladies night DJ. 10pm-3am. High-energy commercial sets. Must read the VIP room. Smart dress code venue.", posted: "3 days ago", payAed: "2,000–3,500", equipment: "CDJ-3000 x2, DJM-V10", capacity: "400", recurring: true, contact: { name: "Toy Room Events", email: "events@toyroomdubai.com", instagram: "@toyroomdubai" } },
  { id: "69", type: "DJ Booking", title: "Café del Mar — Daily Sunset DJ", artist: "Café del Mar Dubai", city: "Dubai", area: "The Palm West Beach", genre: "Chill / Balearic / Downtempo / Organic House", description: "The original Ibiza brand. Daily sunset sessions 3pm-9pm. Must nail the classic Café del Mar sound — Balearic beats, organic textures, sunset perfection.", posted: "2 days ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "300", recurring: true, contact: { name: "Café del Mar Music", email: "dj@cafedelmar.ae", instagram: "@cafedelmardubai" } },
  { id: "70", type: "DJ Booking", title: "Privilege — Saturday Night Headliner", artist: "Privilege Dubai", city: "Dubai", area: "Meydan", genre: "EDM / House / Commercial / Arabic", description: "Multi-level mega-club. Saturday night headline slot 1am-3:30am. Massive crowd, full production, pyro. Peak-time energy only.", posted: "4 days ago", payAed: "4,000–8,000", equipment: "CDJ-3000 x4, DJM-V10, full LED wall + pyro", capacity: "4,000", contact: { name: "Privilege Talent", email: "talent@privilegedubai.com", instagram: "@privilegedubai" } },
  { id: "71", type: "DJ Booking", title: "Secret Room — Wednesday Underground", artist: "Secret Room", city: "Dubai", area: "Meydan", genre: "Techno / Melodic Techno / Progressive", description: "Intimate underground room inside Soho Garden complex. Wednesday 11pm-3am. Dark, driving sets. Quality over commercial. Proper sound system.", posted: "1 day ago", payAed: "2,000–3,500", equipment: "CDJ-3000 x2, DJM-V10", capacity: "200", recurring: true, contact: { name: "Secret Room Bookings", email: "underground@sohogarden.com", instagram: "@secretroomdxb" } },
  { id: "72", type: "DJ Booking", title: "Summersalt Beach Club — Friday Brunch", artist: "Summersalt Beach Club", city: "Dubai", area: "Jumeirah Al Naseem", genre: "Deep House / Afro House / Tropical", description: "Premium Friday brunch DJ. 1pm-5pm, then afterparty 5pm-9pm. Stunning Burj Al Arab views. Food & drinks included.", posted: "3 days ago", payAed: "2,200–3,800", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "350", recurring: true, contact: { name: "Summersalt Events", email: "events@summersaltbeach.com", instagram: "@summersaltbeachclub" } },
  { id: "73", type: "DJ Booking", title: "1OAK Dubai — VIP Nightclub DJ", artist: "1OAK Dubai", city: "Dubai", area: "JW Marriott Marquis", genre: "Hip-Hop / R&B / Commercial / Arabic", description: "Premium nightclub. Fri-Sat 11pm-3am. Must nail VIP crowd energy. Bottle service clientele. Smooth transitions mandatory. No amateur mixing.", posted: "5 days ago", payAed: "3,500–6,000", equipment: "Full Pioneer setup", capacity: "500", recurring: true, contact: { name: "1OAK Entertainment", email: "entertainment@1oakdubai.com", phone: "+97143320100", instagram: "@1oakdubai" } },
  { id: "74", type: "DJ Booking", title: "Bla Bla Dubai — Open Format Resident", artist: "Bla Bla Dubai", city: "Dubai", area: "The Walk JBR", genre: "Open Format / Pop / Arabic / Dance", description: "Multi-venue entertainment complex on JBR. Open format resident needed. 6 nights/week rotation. Covers everything from Arabic pop to house to 80s.", posted: "2 days ago", payAed: "2,500–4,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "1,500", recurring: true, contact: { name: "Bla Bla Music", email: "djbookings@blabladubai.com", whatsapp: "+971509991122", instagram: "@blabladubai" } },
  { id: "75", type: "DJ Booking", title: "Lock Stock & Barrel — Weekend DJ", artist: "Lock Stock & Barrel", city: "Dubai", area: "Barsha Heights", genre: "Rock / Indie / Commercial / Open Format", description: "British-style pub meets party. Fri-Sat 9pm-2am. Rock, indie, 90s, 2000s, current hits. Guitar-friendly DJ welcome. Rowdy crowd.", posted: "1 day ago", payAed: "1,500–2,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "400", recurring: true, contact: { name: "LSB Entertainment", email: "entertainment@lockstockandb.com", instagram: "@lockstockdubai" } },

  // ── UAE — Abu Dhabi DJ Gigs ─────────────────────────────────
  { id: "80", type: "DJ Booking", title: "Saadiyat Beach Club — Sunset Resident", artist: "Saadiyat Beach Club", city: "Abu Dhabi", area: "Saadiyat Island", genre: "Deep House / Organic / Sunset", description: "Abu Dhabi's most beautiful beach. Wed-Sun 3pm-9pm sunset sessions. Turquoise water backdrop. Rotation schedule.", posted: "2 days ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "300", recurring: true, contact: { name: "SBC Music", email: "music@saadiyatbeachclub.ae", instagram: "@saadiyatbeachclub" } },
  { id: "81", type: "DJ Booking", title: "MAD on Yas Island — Friday Night", artist: "MAD on Yas Island", city: "Abu Dhabi", area: "Yas Island", genre: "EDM / Commercial / Arabic", description: "Abu Dhabi's largest nightlife destination. Friday 11pm-3am. Massive crowd, full production. International headliners rotate.", posted: "3 days ago", payAed: "3,000–6,000", equipment: "CDJ-3000 x4, DJM-V10, full production", capacity: "2,500", recurring: true, contact: { name: "MAD Entertainment", email: "talent@madonyas.com", instagram: "@madonyas" } },
  { id: "82", type: "DJ Booking", title: "Rixos Marina Abu Dhabi — Pool Party", artist: "Rixos Marina Abu Dhabi", city: "Abu Dhabi", area: "Marina", genre: "House / Tropical / Commercial", description: "Saturday pool party 12pm-6pm. International resort chain. Family-friendly afternoon transitioning to party vibes.", posted: "4 days ago", payAed: "1,800–3,000", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "300", recurring: true, contact: { name: "Rixos Events", email: "events.marina@rixos.com", instagram: "@rixosmarinaad" } },
  { id: "83", type: "DJ Booking", title: "Emirates Palace — Private Events DJ", artist: "Emirates Palace Mandarin Oriental", city: "Abu Dhabi", area: "Corniche", genre: "Lounge / Arabic / Classical Crossover", description: "Ultra-luxury 7-star hotel. On-call DJ for private events, weddings, royal functions. Dress code: formal. Must handle Arabic classical, Khaleeji, international.", posted: "1 week ago", payAed: "5,000–12,000", equipment: "Provided", contact: { name: "Emirates Palace Events", email: "events@emiratespalace.ae", phone: "+97126909000", instagram: "@emiratespalace" } },
  { id: "84", type: "DJ Booking", title: "Cipriani Yas Island — Dinner to Dance", artist: "Cipriani", city: "Abu Dhabi", area: "Yas Island", genre: "Nu-Disco / Soulful House / Italian Vibes", description: "Italian fine dining with party. Fri-Sat 9pm-1am. Must transition from ambient dinner to dance floor. Sophisticated, not club bangers.", posted: "2 days ago", payAed: "2,500–4,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "200", recurring: true, contact: { name: "Cipriani Events", email: "events.abudhabi@cipriani.com", instagram: "@ciprianiyas" } },

  // ── UAE — Other Emirates ───────────────────────────────────
  { id: "86", type: "DJ Booking", title: "Wink Abu Dhabi — Thursday Underground", artist: "Wink", city: "Abu Dhabi", area: "W Abu Dhabi", genre: "Techno / Deep Tech / Minimal", description: "Underground electronic night at W Hotel. Thursday 10pm-3am. Proper sound, intimate dancefloor. Submit a mix to apply.", posted: "3 days ago", payAed: "2,000–3,500", equipment: "CDJ-3000 x2, DJM-V10", capacity: "200", recurring: true, contact: { name: "Wink Music", email: "wink.abudhabi@whotels.com", instagram: "@winkabudhabi" } },
  { id: "87", type: "DJ Booking", title: "Ajman Hotel Beach — Weekend DJ", artist: "Ajman Hotel", city: "Ajman", genre: "Open Format / Arabic / Pop", description: "Beach resort weekend DJ. Fri-Sat 4pm-10pm. Family-friendly venue transitioning to evening party. Mixed local & international crowd.", posted: "5 days ago", payAed: "1,200–2,000", equipment: "Provided", capacity: "200", recurring: true, contact: { name: "Ajman Hotel Events", email: "events@ajmanhotel.com", phone: "+97167145555" } },
  { id: "88", type: "DJ Booking", title: "Ras Al Khaimah Music Festival 2026", artist: "RAK Tourism", city: "Ras Al Khaimah", genre: "All Electronic / House / Techno", description: "New annual festival in RAK mountains. 2-day outdoor event. Multiple stages. Travel + hotel covered. Emerging artist slots available.", posted: "1 week ago", payAed: "3,000–8,000", capacity: "5,000", contact: { name: "RAK Festival", email: "artists@visitrasalkhaimah.com", instagram: "@visitrasalkhaimah" } },
  { id: "89", type: "DJ Booking", title: "Sharjah Light Festival — Evening DJ", artist: "Sharjah Events", city: "Sharjah", area: "Al Noor Island", genre: "Ambient / Chill / World / Downtempo", description: "Cultural light festival. Evening ambient DJ sets 7pm-11pm during festival weeks. Artistic, atmospheric. Family-friendly.", posted: "4 days ago", payAed: "1,500–2,500", contact: { name: "Sharjah Events Authority", email: "events@sharjahevents.ae" } },
  { id: "90", type: "DJ Booking", title: "Al Ain Oasis Resort — Weekend Entertainment", artist: "Aloft Al Ain", city: "Al Ain", genre: "Open Format / Pop / Arabic", description: "Garden city resort. Weekend entertainment DJ. Fri-Sat 7pm-11pm. Relaxed oasis setting. Local community crowd.", posted: "6 days ago", payAed: "1,200–2,000", equipment: "Provided", capacity: "150", recurring: true, contact: { name: "Aloft Events", email: "events.alain@alofthotels.com" } },

  // ── UAE — Branded Events & Corporate ────────────────────────
  { id: "92", type: "DJ Booking", title: "Dubai Duty Free Tennis — Event DJ", artist: "Dubai Duty Free", city: "Dubai", area: "Aviation Club", genre: "Commercial / House / Feel-Good", description: "Official DJ for tennis championship social events. 5 evenings over 2 weeks. VIP hospitality area. International sports crowd.", posted: "2 days ago", payAed: "2,500–4,000", contact: { name: "DDF Events", email: "events@dubaidutyfree.com", instagram: "@dubaidutyfree" } },
  { id: "93", type: "DJ Booking", title: "Art Dubai — Gallery Night DJ", artist: "Art Dubai", city: "Dubai", area: "Madinat Jumeirah", genre: "Ambient / Leftfield / Experimental / Chill", description: "Annual art fair. DJ for evening gallery viewing events. 3 nights. Atmospheric, artistic. Not a club night — think gallery soundtrack.", posted: "1 week ago", payAed: "2,000–3,500", contact: { name: "Art Dubai Events", email: "events@artdubai.ae", instagram: "@artdubai" } },
  { id: "94", type: "DJ Booking", title: "Dubai Fashion Week — Afterparty DJ", artist: "Arab Fashion Council", city: "Dubai", area: "d3 Design District", genre: "House / Tech House / Fashion", description: "Afterparty DJ for Dubai Fashion Week events. 4 nights. Fashion-forward crowd. Think Peggy Gou, Honey Dijon energy.", posted: "3 days ago", payAed: "3,000–5,000", contact: { name: "AFC Events", email: "events@arabfashioncouncil.com", instagram: "@arabfashioncouncil" } },
  { id: "95", type: "DJ Booking", title: "SOLE DXB Festival — DJ Applications", artist: "SOLE DXB", city: "Dubai", area: "d3 Design District", genre: "Hip-Hop / R&B / House / Afro", description: "Dubai's street culture festival. DJ applications for 2026 edition. Multiple stages across 3 days. Sneaker culture meets music. Apply with mix + bio.", posted: "5 days ago", payAed: "2,500–7,000", capacity: "10,000", contact: { name: "SOLE DXB Talent", email: "talent@soledxb.com", instagram: "@soledxb" } },
  { id: "96", type: "DJ Booking", title: "Hype Abu Dhabi — Opening Season DJ Call", artist: "Hype Abu Dhabi", city: "Abu Dhabi", area: "Corniche", genre: "EDM / House / Arabic / Commercial", description: "New mega-venue opening on Corniche. Season launch seeking 5 resident DJs across multiple rooms. Long-term contracts. Full production.", posted: "1 day ago", payAed: "3,000–7,000", equipment: "CDJ-3000 x4, DJM-V10 per room", capacity: "2,000", recurring: true, contact: { name: "Hype Entertainment", email: "residents@hypeabudhabi.com", whatsapp: "+971502223344", instagram: "@hypeabudhabi" } },

  // ── UAE — Brunches & Hotels ──────────────────────────────────
  { id: "97", type: "DJ Booking", title: "Brunch & Cake — Saturday Brunch DJ", artist: "Brunch & Cake", city: "Dubai", area: "JBR", genre: "Deep House / Disco / Feel-Good", description: "Trendy brunch spot. Saturday brunch DJ 12pm-5pm. Instagrammable venue. Fun, colorful, energetic but never aggressive.", posted: "2 days ago", payAed: "1,500–2,500", equipment: "Provided", capacity: "200", recurring: true, contact: { name: "B&C Events", email: "events@brunchandcake.ae", instagram: "@brunchandcakedubai" } },
  { id: "98", type: "DJ Booking", title: "Trader Vic's — Tiki Night DJ", artist: "Trader Vic's", city: "Dubai", area: "Multiple locations", genre: "Tropical / Latin / Reggaeton / Pop", description: "Thursday Tiki Night DJ. 9pm-1am. Tropical cocktail bar. Fun, upbeat, holiday vibes. Latin and tropical genres preferred.", posted: "4 days ago", payAed: "1,500–2,500", equipment: "Provided", capacity: "200", recurring: true, contact: { name: "Trader Vic's Events", email: "events@tradervicsjbr.com", instagram: "@tradervicsdubai" } },
  { id: "99", type: "DJ Booking", title: "Address Beach Resort — Pool DJ", artist: "Address Beach Resort", city: "Dubai", area: "JBR", genre: "Deep House / Organic / Chill to Groovy", description: "Infinity pool overlooking Ain Dubai. Daily daytime DJ 1pm-7pm. Emaar premium brand. Polished, refined sets. No cheese.", posted: "1 day ago", payAed: "2,000–3,500", equipment: "CDJ-2000NXS2 x2, DJM-900NXS2", capacity: "200", recurring: true, contact: { name: "Address Events", email: "events@addresshotels.com", instagram: "@addressbeachresort" } },
  { id: "100", type: "DJ Booking", title: "Jumeirah Beach Hotel — Friday Sundowner", artist: "Jumeirah Beach Hotel", city: "Dubai", area: "Jumeirah", genre: "Sunset / Downtempo / Organic House", description: "Iconic wave-shaped hotel. Friday sundowner on the terrace 4pm-9pm. Burj Al Arab views. Sophisticated hotel guests.", posted: "3 days ago", payAed: "2,000–3,500", equipment: "Provided", capacity: "150", recurring: true, contact: { name: "JBH Events", email: "events.jbh@jumeirah.com", instagram: "@jumeirahbeachhotel" } },
];

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
  const [connected, setConnected] = useState<string[]>([]);

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

  const connect = (artistId: string) => {
    setConnected(p => [...p, artistId]);
  };

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
          { label: "Opportunities", count: OPPORTUNITIES.length, emoji: "🎯" },
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-zinc-500">{OPPORTUNITIES.filter(o => o.type === "DJ Booking").length} DJ bookings · {OPPORTUNITIES.length} total opportunities</p>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">Updated daily</span>
          </div>
          {OPPORTUNITIES.map(opp => (
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Contact</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    {opp.contact.name && <span className="text-zinc-200 font-semibold">{opp.contact.name}{opp.contact.role ? ` — ${opp.contact.role}` : ""}</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {opp.contact.email && (
                      <a href={`mailto:${opp.contact.email}?subject=${encodeURIComponent("DJ Booking Inquiry: " + opp.title + " — " + DJ_EMY.name)}`}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-fuchsia-500 transition">
                        ✉ {opp.contact.email}
                      </a>
                    )}
                    {opp.contact.whatsapp && (
                      <a href={`https://wa.me/${opp.contact.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hi " + (opp.contact.name || "") + "! I saw your listing for \"" + opp.title + "\" and I am interested.\n\nI am " + DJ_EMY.name + ", " + DJ_EMY.tagline + ".\n• " + DJ_EMY.selectedAppearances[0] + "\n• " + DJ_EMY.selectedAppearances[1] + "\n\nEPK: " + (DJ_EMY.epkUrl || "") + "\nIG: https://instagram.com/" + (DJ_EMY.instagram || "").replace("@","") + "\n\n" + DJ_EMY.name + "\n" + DJ_EMY.phone)}`}
                        target="_blank" rel="noreferrer"
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-emerald-300 hover:border-emerald-500 transition">
                        💬 WhatsApp
                      </a>
                    )}
                    {opp.contact.phone && (
                      <a href={`tel:${opp.contact.phone}`}
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-fuchsia-500 transition">
                        📞 {opp.contact.phone}
                      </a>
                    )}
                    {opp.contact.instagram && (
                      <a href={`https://instagram.com/${opp.contact.instagram.replace("@", "")}`}
                        target="_blank" rel="noreferrer"
                        className="rounded-lg border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-300 hover:border-fuchsia-500 transition">
                        📸 {opp.contact.instagram}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {opp.contact?.email && (
                  <button
                    onClick={() => {
                      const pitch = `Hi ${opp.contact?.name || ""},\n\nI saw your listing for "${opp.title}" and I would like to express my interest.\n\nI am ${DJ_EMY.name} (${DJ_EMY.legalName}), ${DJ_EMY.tagline}.\n\n▸ KEY CREDENTIALS:\n• ${DJ_EMY.sellingPoints[0]}\n• ${DJ_EMY.selectedAppearances[0]}\n• ${DJ_EMY.selectedAppearances[1]}\n• Bilingual: ${DJ_EMY.languages.join(" / ")}\n• Genres: ${DJ_EMY.genres.join(", ")}\n\n▸ SELECTED APPEARANCES:\n${DJ_EMY.selectedAppearances.map(a => "• " + a).join("\n")}\n\n▸ LINKS:\nEPK: ${DJ_EMY.epkUrl || ""}\nInstagram: https://instagram.com/${(DJ_EMY.instagram || "").replace("@","")}\nYouTube: ${DJ_EMY.youtube || ""}\n\n▸ MANAGEMENT:\n${DJ_EMY.management.company}\n${DJ_EMY.management.contactName} — ${DJ_EMY.management.contactRole}\nEmail: ${DJ_EMY.management.email}\nPhone/WhatsApp: ${DJ_EMY.management.phone}\nWebsite: ${DJ_EMY.management.website || ""}\n\n▸ TECH RIDER:\n${DJ_EMY.techRider.players.join(", ")}\n${DJ_EMY.techRider.mixer.join(", ")}\n\nI look forward to discussing this opportunity.\n\nBest regards,\n${DJ_EMY.management.contactName}\n${DJ_EMY.management.company}\n${DJ_EMY.management.phone}`;
                      void navigator.clipboard.writeText(pitch);
                      window.open(`mailto:${opp.contact?.email}?subject=${encodeURIComponent("DJ Booking Inquiry: " + opp.title + " — " + DJ_EMY.name)}`, "_blank");
                    }}
                    className="rounded-lg bg-fuchsia-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-fuchsia-500 transition">
                    Apply Now (opens email + copies pitch)
                  </button>
                )}
                <button onClick={() => { setTab("connect"); setConnectMsg("Hi " + (opp.contact?.name || "") + "!\n\nI saw your listing for \"" + opp.title + "\" and I would like to express my interest.\n\nI am " + DJ_EMY.name + " (" + DJ_EMY.legalName + "), " + DJ_EMY.tagline + ".\n\n▸ KEY CREDENTIALS:\n• " + DJ_EMY.sellingPoints[0] + "\n• " + DJ_EMY.selectedAppearances[0] + "\n• " + DJ_EMY.selectedAppearances[1] + "\n• Bilingual: " + DJ_EMY.languages.join(" / ") + "\n• Genres: " + DJ_EMY.genres.join(", ") + "\n\n▸ LINKS:\nEPK: " + (DJ_EMY.epkUrl || "") + "\nInstagram: https://instagram.com/" + (DJ_EMY.instagram || "").replace("@","") + "\nYouTube: " + (DJ_EMY.youtube || "") + "\n\n▸ CONTACT:\n" + DJ_EMY.name + "\nEmail: " + DJ_EMY.email + "\nPhone/WhatsApp: " + DJ_EMY.phone + "\nInstagram: https://instagram.com/" + (DJ_EMY.instagram || "").replace("@","") + "\nManagement: " + DJ_EMY.management.company + " — " + (DJ_EMY.management.website || "") + "\n\nI look forward to discussing this opportunity.\n\nBest regards,\n" + DJ_EMY.name + "\n" + (DJ_EMY.instagram || "") + "\n" + DJ_EMY.phone); }}
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
