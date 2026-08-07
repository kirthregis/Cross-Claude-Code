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

const OPPORTUNITIES = [
  { id: "1", type: "Collaboration", title: "Looking for Arabic Vocalist", artist: "DJ Emy", city: "Dubai", genre: "Afro House", description: "Working on an original track with Arabic lyrics. Need a female vocalist for studio session. Remote recording welcome.", posted: "2 days ago" },
  { id: "2", type: "Residency Offer", title: "House DJ Wanted — Thursdays", artist: "Cielo Sky Lounge", city: "Dubai Creek Harbour", genre: "Deep House / Afro House", description: "Looking for a resident DJ for Thursday nights. Must have 3+ years experience and a following.", posted: "1 day ago" },
  { id: "3", type: "Festival Slot", title: "ADE Showcase — MENA Artists", artist: "Amsterdam Dance Event", city: "Amsterdam", genre: "All Electronic", description: "Curating MENA artists for ADE 2026 showcase. Submit EPK + 30 min mix.", posted: "3 days ago" },
  { id: "4", type: "Remix Swap", title: "Swap Remixes — Afro House", artist: "Omar Groove", city: "Abu Dhabi", genre: "Afro House / Tribal", description: "Have 2 original tracks. Looking for DJs to remix one each. I remix yours in return.", posted: "5 days ago" },
  { id: "5", type: "Label Demo", title: "Open Demo Submissions", artist: "Desert Rave Records", city: "Dubai", genre: "Afro House / Afro Tech", description: "MENA-based label looking for fresh Afro House and Afro Tech demos. Send EPK + demo to demos@desertraverecords.com", posted: "1 week ago" },
  { id: "6", type: "DJ Booking", title: "Friday Night Residency — SKYBAR Dubai", artist: "SKYBAR Dubai", city: "Dubai", genre: "Open Format / House / Arabic", description: "Seeking a versatile DJ for flagship Friday night. Open format sets covering Arabic hits, house, hip-hop. Minimum 4-hour sets, weekly commitment. $800–$1,500/night.", posted: "3 days ago" },
  { id: "7", type: "DJ Booking", title: "Techno Underground — Warehouse Party", artist: "The Warehouse Al Quoz", city: "Dubai", genre: "Techno / Dark Techno", description: "Underground warehouse event. Looking for a techno DJ for a dark, driving 3-hour set. Must have own USBs with CDJ-ready tracks. $600–$1,000.", posted: "1 day ago" },
  { id: "8", type: "DJ Booking", title: "Beach Club Sunset Sessions — Resident", artist: "Banana Island Resort", city: "Doha", genre: "Organic House / Chill", description: "Premium beach club seeking resident sunset DJ. Laid-back organic house every Saturday 3pm–9pm. $500–$900/session.", posted: "4 days ago" },
  { id: "9", type: "Festival Slot", title: "Marrakech Music Festival — DJ Lineup Call", artist: "Atlas Arena", city: "Marrakech", genre: "House / Techno / Trance", description: "Annual music festival in the Atlas Mountains. Two-day event, multiple slots for emerging and established DJs. $1,000–$3,000.", posted: "2 days ago" },
  { id: "10", type: "DJ Booking", title: "Riyadh Season — Club DJ Booking", artist: "Riyadh Season Boulevard", city: "Riyadh", genre: "EDM / House / Hip-Hop", description: "Major Riyadh Season venue looking for resident DJs for 2026 season. Multiple genres needed. High-profile opportunity. $1,500–$4,000.", posted: "5 days ago" },
  { id: "11", type: "DJ Booking", title: "Luxury Yacht Party DJ — Abu Dhabi", artist: "Private Yacht Charter", city: "Abu Dhabi", genre: "Open Format / House", description: "Private yacht party for 80 guests. Need a DJ who can read the room. Daytime chill to evening party. Premium equipment provided. $1,200–$2,000.", posted: "1 day ago" },
  { id: "12", type: "DJ Booking", title: "Bahrain F1 Afterparty — DJ Set", artist: "The Reef Club", city: "Manama", genre: "EDM / House / Commercial", description: "Official afterparty for Bahrain Grand Prix weekend. 2,000+ capacity. Full production with CO2 cannons. $2,000–$5,000.", posted: "6 days ago" },
  { id: "13", type: "DJ Booking", title: "Cairo Rooftop — Deep House DJ Wanted", artist: "Nile Terrace", city: "Cairo", genre: "Deep House / Lounge", description: "New rooftop venue in Zamalek. Thursday night launch series. Stunning Nile views, upscale crowd. $400–$700.", posted: "2 days ago" },
  { id: "14", type: "DJ Booking", title: "Kuwait City Nightclub — Hip-Hop & R&B DJ", artist: "NOIR Kuwait", city: "Kuwait City", genre: "Hip-Hop / R&B / Arabic Pop", description: "New upscale nightclub needs DJ specializing in hip-hop, R&B, and Arabic pop. Thursday and Friday nights. $700–$1,200.", posted: "3 days ago" },
  { id: "15", type: "DJ Booking", title: "Beirut Techno Collective — Guest DJ", artist: "B018", city: "Beirut", genre: "Techno / Minimal / Acid", description: "Monthly techno night at B018 legendary underground venue. Seeking DJs with original productions or strong track selection. $400–$800.", posted: "4 days ago" },
  { id: "16", type: "Production", title: "Sound System Design — New Dubai Club", artist: "TBA — JBR", city: "Dubai", genre: "All Genres", description: "New 1,500-capacity club needs complete sound system design. Spec and install Funktion-One or equivalent. $5,000–$15,000.", posted: "1 week ago" },
  { id: "17", type: "DJ Booking", title: "Wedding Reception DJ — Four Seasons Beirut", artist: "Four Seasons Beirut", city: "Beirut", genre: "Arabic / Dabke / Pop / House", description: "Elegant Lebanese wedding. DJ must be fluent in Arabic and Western party music. Dabke experience required. $800–$1,500.", posted: "5 days ago" },
  { id: "18", type: "DJ Booking", title: "Muscat New Venue Launch — Opening Night", artist: "AURA Muscat", city: "Muscat", genre: "House / Techno", description: "Brand new club opening in Muscat. Show-stopping DJ for grand opening. Pioneer CDJ-3000 + DJM-V10 provided. $800–$1,500.", posted: "2 days ago" },
  { id: "19", type: "DJ Booking", title: "Pool Party DJ — Dead Sea Resort", artist: "Kempinski Dead Sea", city: "Dead Sea", genre: "House / Tropical / Pop", description: "Weekly pool party at luxury Dead Sea resort. Fun, energetic DJ for international tourist crowd. Ibiza vibes in Jordan. $400–$700.", posted: "3 days ago" },
  { id: "20", type: "DJ Booking", title: "Baghdad Cultural Center — Electronic Night", artist: "Al-Rasheed Cultural Center", city: "Baghdad", genre: "Electronic / Iraqi Fusion", description: "Pioneering electronic music event in Baghdad. First DJ night at historic cultural center. Blend electronic music with Iraqi heritage. $300–$600.", posted: "1 week ago" },
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
          <p className="text-xs text-zinc-500">{OPPORTUNITIES.filter(o => o.type === "DJ Booking").length} DJ bookings · {OPPORTUNITIES.length} total opportunities</p>
          {OPPORTUNITIES.map(opp => (
            <Card key={opp.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " +
                      (opp.type === "DJ Booking" ? "bg-fuchsia-600/20 text-fuchsia-300" :
                      opp.type === "Festival Slot" ? "bg-amber-500/20 text-amber-300" :
                      opp.type === "Residency Offer" ? "bg-blue-500/20 text-blue-300" :
                      opp.type === "Production" ? "bg-orange-500/20 text-orange-300" :
                      "bg-zinc-700/50 text-zinc-300")}>{opp.type}</span>
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
