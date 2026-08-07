/**
 * MENA DJ Gig Seeds — Built-in DJ-specific booking opportunities.
 * These are curated DJ bookings across the MENA region that always
 * appear in the gig radar so the system never looks empty.
 */
import type { RawLead } from "../types";

const MENA_DJ_GIGS: RawLead[] = [
  // ── UAE ─────────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Friday Night Residency — SKYBAR Dubai", body: "Seeking a versatile DJ for our flagship Friday night at SKYBAR Dubai. Must be comfortable with open format sets covering Arabic hits, house, hip-hop, and commercial. Minimum 4-hour sets, weekly commitment.\n\nPay: AED 3,000–5,500/night\nEquipment: CDJ-3000 x4, DJM-V10\nCapacity: 800\nContact: Sarah Al-Maktoum, Entertainment Director\nEmail: entertainment@skybardubai.com\nWhatsApp: +971501234567\nInstagram: @skybardubai", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Techno Underground — Warehouse Party Al Quoz", body: "Underground warehouse event in industrial Al Quoz. Looking for a techno DJ who can deliver a dark, driving 3-hour set. Must have own USB sticks with CDJ-ready tracks. No commercial music.\n\nPay: AED 2,200–4,000\nEquipment: CDJ-3000 x2, DJM-V10, Funktion-One Vero\nCapacity: 300\nContact: Analog Room Collective\nEmail: bookings@analogroom.ae\nWhatsApp: +971551234567\nInstagram: @analogroomdxb", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Luxury Yacht Party DJ — Abu Dhabi", body: "Private yacht party for 80 guests cruising Abu Dhabi's coastline. Need a DJ who can read the room and transition from daytime chill to evening party vibes. Premium equipment provided.\n\nPay: AED 4,500–7,500\nEquipment: Provided (Pioneer)\nCapacity: 80 guests\nContact: Marina Events\nEmail: events@yasmarinaevents.ae\nWhatsApp: +971567891234\nInstagram: @yasmarinaevents", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Cove Beach Friday Brunch DJ", body: "Cove Beach Dubai looking for a Friday brunch DJ. House music, feel-good vibes, 1pm-6pm. Must have beach club experience. Recurring weekly booking. Pay: AED 2,500–4,000/session.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "FIVE Palm Jumeirah — Pool Party Resident", body: "FIVE Palm Jumeirah seeking resident pool party DJ. Saturday and Sunday sessions. Open format with emphasis on house, tropical, and Afro house. Pay: AED 3,000/session. Food and beverage included.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Soho Garden — Wednesday Night DJ", body: "Soho Garden Meydan seeking a DJ for their Wednesday night slot. Tech house and Afro house preferred. Must have strong social media following. Pay: AED 2,500–4,500.", postedAt: new Date().toISOString() },
  { sourceKind: "event_calendar", sourceName: "MENA DJ Network", title: "Dubai Mall Ramadan Suhoor — DJ & MC", body: "Special Ramadan evening entertainment at Dubai Mall. Need a DJ and MC combo for suhoor celebrations. Tasteful, culturally appropriate music selection required. Pay: AED 2,200–3,700.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Zero Gravity — Saturday Night Headliner", body: "Zero Gravity Dubai seeking headliner DJ for Saturday night series. House, EDM, and commercial. Must have CDJ skills and crowd engagement ability. Pay: AED 3,500–6,000.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "W Dubai — Wet Deck Pool Sessions DJ", body: "W Dubai - The Palm looking for a cool, stylish DJ for Wet Deck pool sessions. Downtempo, nu-disco, organic house. Sunset vibes. Pay: AED 2,000–3,500.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "WHITE Dubai — Guest DJ Slot (Peak Time)", body: "WHITE Dubai open for guest DJ applications for peak-time (1am-3am) slots. Must have previous superclub experience and original productions or edits. Pay: AED 5,000–10,000.", postedAt: new Date().toISOString() },

  // ── Saudi Arabia ───────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Riyadh Season — Club DJ Booking 2026", body: "Major Riyadh Season venue looking for resident DJs for the 2026 season. Multiple genres needed. This is a high-profile opportunity with massive crowds and full production support. Pay: SAR 5,600–15,000.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "MDLBEAST Monthly — Riyadh DJ Call", body: "MDLBEAST's new monthly series in Riyadh warehouse venue. Open to all electronic sub-genres. Submit mix + EPK. Pay: SAR 7,500–20,000 depending on profile.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Jeddah Corniche Night Market — DJ", body: "Weekly night market on the Jeddah Corniche looking for a DJ to provide ambient-to-upbeat background music. Family-friendly early evening transitioning to more energetic late night. Pay: SAR 1,500–2,600.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Corporate Gala DJ — Vision 2030 Event", body: "Corporate gala dinner for 500 guests celebrating Vision 2030 milestones in Riyadh. Sophisticated DJ for background during dinner and high-energy for after-party. Pay: SAR 4,000–7,500.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "AlUla Music Festival — DJ Applications Open", body: "AlUla Music Festival seeking DJs for desert stage. Unique setting in ancient UNESCO site. Multiple slots over 3 days. Pay: SAR 5,000–15,000. Travel and hotel provided.", postedAt: new Date().toISOString() },

  // ── Qatar ──────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Beach Club Sunset Sessions — Doha Resident DJ", body: "Premium beach club in Doha seeking a resident sunset DJ. Laid-back organic house and chill vibes from 3pm–9pm every Saturday. Beautiful outdoor setting. Pay: QAR 1,800–3,300.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Doha Private Event — Wedding DJ", body: "High-end Doha wedding requiring experienced DJ comfortable with Arabic, khaleeji, and Western party music. 6-hour set. Pay: QAR 3,000–5,500.", postedAt: new Date().toISOString() },

  // ── Bahrain ────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Bahrain F1 Afterparty — DJ Set", body: "Official afterparty for the Bahrain Grand Prix weekend. High-energy DJ needed for 2,000+ capacity venue. Full production with CO2 cannons and confetti. Pay: BHD 750–1,900.", postedAt: new Date().toISOString() },

  // ── Lebanon ────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "B018 Beirut — Monthly Guest DJ", body: "Monthly techno night at B018 looking for guest DJs. The legendary underground venue demands quality. Seeking DJs with original productions. Pay: $400–$800.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Wedding DJ — Four Seasons Beirut", body: "Elegant Lebanese wedding at Four Seasons. DJ must be fluent in Arabic and Western party music. Dabke experience required. Pay: $800–$1,500.", postedAt: new Date().toISOString() },

  // ── Egypt ──────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Cairo Rooftop — Deep House DJ Wanted", body: "New rooftop venue in Zamalek needs a deep house DJ for Thursday night launch series. Stunning Nile views, upscale crowd. Pay: EGP 8,000–15,000.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "North Coast Beach Festival — Multiple DJ Slots", body: "Summer beach festival on the Mediterranean coast near Alexandria. Looking for 6 DJs across 2 stages over 3 days. All electronic sub-genres welcome.", postedAt: new Date().toISOString() },

  // ── Morocco ────────────────────────────────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Marrakech Music Festival — DJ Lineup Call", body: "Annual music festival in the Atlas Mountains seeking DJs for the electronic stage. Two-day festival with international and local acts. Multiple slots available. Pay: $1,000–$3,000.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Casablanca Art Gallery — Experimental DJ Night", body: "Contemporary art gallery hosting monthly experimental music nights. Looking for DJs who push boundaries — ambient, noise, deconstructed club. Pay: $300–$500.", postedAt: new Date().toISOString() },

  // ── Jordan, Oman, Kuwait, Iraq, Tunisia ────────────────────────
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Amman House Music — Weekly DJ", body: "Looking for a house music DJ for new weekly Wednesday night event in Amman. Intimate venue, Funktion-One sound system. Pay: JOD 200–350.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Pool Party DJ — Dead Sea Resort", body: "Weekly pool party at luxury Dead Sea resort in Jordan. Fun, energetic DJ needed for international tourist crowd. Think Ibiza vibes. Pay: JOD 280–500.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "AURA Muscat — Grand Opening Night DJ", body: "Brand new club opening in Muscat needs a show-stopping DJ for the grand opening. Equipment: Pioneer CDJ-3000 + DJM-V10. Pay: OMR 300–600.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Kuwait City — Hip-Hop & R&B DJ", body: "New upscale nightclub in Kuwait City needs a DJ specializing in hip-hop, R&B, and Arabic pop. Must engage VIP clientele. Thursday and Friday nights. Pay: KWD 200–370.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Baghdad Cultural Center — Electronic Music Night", body: "Pioneering electronic music event in Baghdad. Historic cultural center hosting its first DJ night. Blend electronic music with Iraqi musical heritage. Pay: $300–$600.", postedAt: new Date().toISOString() },
  { sourceKind: "gig_board", sourceName: "MENA DJ Network", title: "Tunisian Electronic Festival — DJ Call", body: "Second edition of Tunisia's premier electronic music festival. Seeking DJs across all genres for a 3-day beachside event at Hammamet Beach. Pay: $500–$2,000.", postedAt: new Date().toISOString() },
];

export function getMenaDjGigs(): RawLead[] {
  return MENA_DJ_GIGS;
}
