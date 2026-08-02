/**
 * DJ Emy's artist profile — the single source of truth the whole app reasons from.
 *
 * Populated from the DJ Emy EPK 2026 v4. Fields still marked PLACEHOLDER need
 * confirming before contracts are used on high-value bookings.
 *
 * Runtime overrides are editable at /profile without a deploy — see
 * `profile-store.ts`. Read via `activeProfile()`, never import this directly.
 */

import type { VenueTier } from "./types";

export interface ArtistProfile {
  name: string;
  legalName: string;
  tagline: string;
  basedIn: string;
  /** Home markets where no travel premium applies. */
  homeMarkets: string[];
  genres: string[];
  /** Genres she will play but isn't known for — small fit penalty. */
  secondaryGenres: string[];
  /** Hard no. Auto-reject leads asking for these. */
  wontPlay: string[];
  /** Positioning facts that go into pitches — her actual leverage. */
  sellingPoints: string[];
  selectedAppearances: string[];
  languages: string[];

  epkUrl?: string;
  instagram?: string;
  youtube?: string;
  soundcloud?: string;
  email: string;
  phone: string;

  /** Bookings are contracted through the management company, not the artist. */
  management: Management;

  /** Base fee in AED for a standard 2h peak-time set, per venue tier. PLACEHOLDER. */
  baseRatesAed: Record<VenueTier, number>;
  /** Absolute floor she will never play below, any tier. */
  hardFloorAed: number;

  techRider: TechRider;
  hospitalityRider: string[];
  contractDefaults: ContractDefaults;
}

export interface Management {
  company: string;
  legalName: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  instagram?: string;
  website?: string;
}

export interface TechRider {
  mixer: string[];
  players: string[];
  monitors: string;
  booth: string[];
  connectivity: string[];
  notes: string[];
}

export interface ContractDefaults {
  depositPercent: number;
  depositDueDays: number;
  balanceDueDays: number;
  cancellationTiers: { withinDays: number; artistKeepsPercent: number }[];
  defaultExclusivityKm: number;
  soundLimitPolicy: string;
  recordingPolicy: string;
  ipPolicy: string;
  forceMajeure: string;
  governingLaw: string;
}

export const DJ_EMY: ArtistProfile = {
  name: "DJ Emy",
  legalName: "PLACEHOLDER — artist's full legal name (contracts are signed by EVG, but the artist is named)",
  tagline: "GCC-based Afro House, Afro Tech and open-format DJ",
  basedIn: "GCC (UAE & Qatar)",
  // She works both sides of the Gulf — Doha is not a "travel" gig for her.
  homeMarkets: ["Dubai", "Abu Dhabi", "Sharjah", "UAE", "Doha", "Qatar"],

  genres: ["Afro House", "Afro Tech", "Tribal", "Melodic House", "Organic House"],
  secondaryGenres: ["Open Format", "Deep House", "House", "Tech House"],
  // Deliberately short: her Afro Tech range means "techno" adjacent briefs are
  // often still a fit. Only genuinely off-brand styles are auto-rejected.
  wontPlay: ["Drum & Bass", "Heavy Metal", "Hard Techno"],

  sellingPoints: [
    "One of few female Afro House DJs commanding a peak-time floor in the GCC",
    "100% live — no pre-recorded loops, no autopilot",
    "Reads the room in real time, moving fluently between English and Arabic crowds",
    "Builds the night in arcs: deep tribal grooves that open a room, then drives it to peak",
    "One accountable, contracted point of contact via Emy Vision Group",
  ],
  selectedAppearances: [
    "FIFA World Cup Qatar 2022 — official tournament DJ",
    "FIFA Arab Cup Qatar 2025 — tournament DJ",
    "Zeus, Jumeirah Beach — Eid headline sets, peak-time club",
    "Amwaj Rooftop — signature golden-hour sunset sessions",
    "Harry Water Park, Trinidad & Tobago — Caribbean tour 2025",
    "Private & VIP, UAE — villas, yachts, brand and cultural events",
  ],
  languages: ["English", "Arabic"],

  instagram: "@dj_emy_",
  youtube: "https://youtube.com/@DJEMY-o6d",
  epkUrl: "https://emyvisiongroup.com",
  email: "mannaiiman1@gmail.com",
  phone: "+974 74767686",

  management: {
    company: "Emy Vision Group",
    legalName: "PLACEHOLDER — EVG registered legal entity name & trade licence no.",
    contactName: "Kirth",
    contactRole: "Business Development",
    email: "admin@emyvisiongroup.com",
    phone: "+971 50 660 7743",
    instagram: "@evgroup2026",
    website: "https://emyvisiongroup.com",
  },

  /**
   * PLACEHOLDER — GCC market ballpark, uplifted for her positioning:
   * FIFA-level credits, genuine genre scarcity, and full EVG representation
   * put her above a generic local DJ rate. Replace with her real numbers.
   */
  baseRatesAed: {
    superclub: 8000,
    beach_club: 7000,
    festival: 12000,
    brand_activation: 14000,
    private_event: 10000,
    hotel_lounge: 5000,
    bar_restaurant: 3000,
    unknown: 6000,
  },
  hardFloorAed: 2500,

  techRider: {
    mixer: ["1x Pioneer DJM-900NXS2"],
    players: ["2x Pioneer CDJ-3000 (CDJ-2000NXS2 acceptable), linked via Pro DJ Link"],
    monitors: "Booth monitor plus house PA, with independent booth level control",
    booth: [
      "Booth height 100–110cm, minimum 180cm wide",
      "Booth must be stable, level and not shared with bar service",
      "Adequate booth lighting to read equipment",
    ],
    connectivity: [
      "1x spare line-in for backup",
      "USB power outlet in booth",
    ],
    notes: [
      "Artist travels with USB — house Pioneer setup preferred, adaptable to venue equipment",
      "Full soundcheck access minimum 45 minutes before doors",
      "Backline must be tested and confirmed working 24h before event",
      "Any substitution of specified equipment requires written approval",
    ],
  },

  hospitalityRider: [
    "1x +1 guest on the door",
    "Still and sparkling water in booth",
    "Secure area for laptop bag and personal belongings",
    "Parking space or return transport",
    "Meal or venue credit for calls over 4 hours",
  ],

  contractDefaults: {
    depositPercent: 50,
    depositDueDays: 14,
    balanceDueDays: 0,
    cancellationTiers: [
      { withinDays: 7, artistKeepsPercent: 100 },
      { withinDays: 14, artistKeepsPercent: 75 },
      { withinDays: 30, artistKeepsPercent: 50 },
    ],
    defaultExclusivityKm: 5,
    soundLimitPolicy:
      "Venue is responsible for compliance with all local noise ordinances. Artist fee is not reduced for venue-imposed volume restrictions.",
    recordingPolicy:
      "Audio/video recording of the performance for commercial release requires prior written consent from Emy Vision Group. Short-form social clips (under 90 seconds) are permitted with credit and tag.",
    ipPolicy:
      "The Artist retains all rights in her performance, name, likeness, logo and any mixes supplied. Venue is granted a limited, non-exclusive, revocable licence to use the Artist's name and approved press images solely to promote this engagement, for the period ending 30 days after the event.",
    forceMajeure:
      "Neither party is liable for failure to perform due to events beyond reasonable control (including government restriction, extreme weather, or national mourning). Deposit is transferable to a mutually agreed rescheduled date within 6 months.",
    governingLaw: "Laws of the Emirate of Dubai and applicable federal laws of the UAE.",
  },
};
