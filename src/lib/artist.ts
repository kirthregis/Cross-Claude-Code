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
  /** Registered entity name exactly as on the trade licence. */
  legalName: string;
  /** Trade licence number — makes the agreement enforceable. */
  tradeLicenceNo?: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  instagram?: string;
  website?: string;
  /** Registered address, as printed on the trade licence. */
  address?: string;
  /**
   * Settlement details for invoices.
   *
   * SENSITIVE. Stored locally in your own SQLite file, rendered only on the
   * invoice, and never sent to any third party or logged. Enter these in
   * /profile — do not paste them into chat or email.
   */
  bank?: BankDetails;
}

export interface BankDetails {
  accountName: string;
  bankName: string;
  /** Primary (AED) IBAN. */
  iban: string;
  swift?: string;
  /** Free-text for branch / account no. / anything else the payer needs. */
  notes?: string;
  /** Additional currency accounts, shown on request. */
  alternates?: { currency: string; iban: string }[];
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
  legalName: "Imen Mannai",
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
  phone: "+971 50 344 3281",

  management: {
    company: "Emy Vision Group",
    legalName: "Emy Vision Group FZC",
    contactName: "Kirth",
    contactRole: "Business Development",
    email: "admin@emyvisiongroup.com",
    phone: "+971 50 344 3281",
    instagram: "@evgroup2026",
    website: "https://emyvisiongroup.com",
    tradeLicenceNo: "4427087.01",
    /** Sharjah Publishing City Free Zone. Formation no. 4427087. */
    address: "Business Centre, Sharjah Publishing City Free Zone, Sharjah, United Arab Emirates",
    bank: {
      accountName: "EMY VISION GROUP FZC",
      bankName: "Mashreqbank PSC (Mashreq NEO BIZ)",
      iban: "AE060330000019102008190",
      swift: "BOMLAEAD",
      notes: "AED account 019102008190. Other currencies on request: GBP/USD/EUR.",
      /**
       * Multi-currency IBANs. Quoted on the invoice only when the client is
       * paying in that currency.
       *
       * NOTE: the Mashreq customer number (CIF) is deliberately NOT stored
       * here. It doubles as the password for Mashreq's protected statements,
       * so it is a credential — it must never appear on a document sent to a
       * client. Payments only ever need account name + IBAN + SWIFT.
       */
      alternates: [
        { currency: "GBP", iban: "AE760330000019102008191" },
        { currency: "USD", iban: "AE490330000019102008192" },
        { currency: "EUR", iban: "AE220330000019102008193" },
      ],
    },
  },

  /**
   * Market-researched base rates for a standard 2h peak set — see
   * RATE-RESEARCH.md for the full working and sources.
   *
   * Dubai's four-tier market (Bella / Box Entertainment, djsdubai, Soundtribe):
   *   entry 1.5–3k · mid 3–5.5k · premium 6–15k · celebrity/international 20k+
   *
   * Emy sits at the top of "premium", entering "celebrity" for brand work, on
   * five levers: FIFA World Cup 2022 + Arab Cup 2025 official tournament DJ,
   * Afro House genre scarcity, bilingual EN/AR floors, full EVG representation,
   * and named venue history (Zeus, Amwaj, international touring).
   *
   * The AED ~2,400 marketplace average is a saturated pool of part-time
   * open-format DJs — it is NOT her comparable set.
   *
   * ⚠️ Still estimates, not her realised fees. Enter real past bookings at
   * /profile to make these history-backed.
   */
  baseRatesAed: {
    brand_activation: 15000,
    festival: 13000,
    private_event: 10000,
    superclub: 8000,
    beach_club: 7000,
    unknown: 6000,
    hotel_lounge: 5000,
    bar_restaurant: 3000, hotel: 6000, private: 8000, other: 5000,
  },
  /** Above the "professional event DJ" entry point (3,500) less haggling room. */
  hardFloorAed: 3000,

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
