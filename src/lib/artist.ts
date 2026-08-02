/**
 * DJ Emy's artist profile — the single source of truth the whole app reasons from.
 * EDIT THIS FILE (or the /profile screen) as her real EPK data comes in.
 *
 * NOTE: values marked PLACEHOLDER are sensible Dubai-market defaults, not Emy's
 * real numbers. Replace them from the EPK / her past booking history.
 */

import type { VenueTier } from "./types";

export interface ArtistProfile {
  name: string;
  legalName: string; // PLACEHOLDER — needed for contracts
  tagline: string;
  basedIn: string;
  genres: string[];
  /** Genres she will play but isn't known for — small fit penalty. */
  secondaryGenres: string[];
  /** Hard no. Auto-reject leads asking for these. */
  wontPlay: string[];

  epkUrl?: string;
  instagram?: string;
  soundcloud?: string;
  email: string;
  phone: string;

  /** Base fee in AED for a standard 2h peak-time set, per venue tier. PLACEHOLDER. */
  baseRatesAed: Record<VenueTier, number>;
  /** Absolute floor she will never play below, any tier. */
  hardFloorAed: number;

  techRider: TechRider;
  hospitalityRider: string[];
  /** Legal / commercial defaults that flow into every contract. */
  contractDefaults: ContractDefaults;
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
  depositDueDays: number; // days before event
  balanceDueDays: number; // days after performance (0 = on the night)
  cancellationTiers: { withinDays: number; artistKeepsPercent: number }[];
  /** Radius clause she is willing to grant by default. */
  defaultExclusivityKm: number;
  soundLimitPolicy: string;
  recordingPolicy: string;
  ipPolicy: string;
  forceMajeure: string;
  governingLaw: string;
}

export const DJ_EMY: ArtistProfile = {
  name: "DJ Emy",
  legalName: "PLACEHOLDER — full legal name for contracts",
  tagline: "Dubai-based open-format & house DJ",
  basedIn: "Dubai, UAE",
  genres: ["House", "Afro House", "Melodic House & Techno", "Open Format"],
  secondaryGenres: ["Deep House", "Tech House", "R&B", "Commercial"],
  wontPlay: ["Hard Techno", "Drum & Bass", "Heavy Metal"],

  instagram: "@djemy", // PLACEHOLDER
  email: "bookings@djemy.com", // PLACEHOLDER
  phone: "+971-XX-XXX-XXXX", // PLACEHOLDER

  // PLACEHOLDER — Dubai market ballpark for an established local DJ, 2h peak set.
  baseRatesAed: {
    superclub: 6000,
    beach_club: 5000,
    festival: 8000,
    brand_activation: 9000,
    private_event: 7500,
    hotel_lounge: 3500,
    bar_restaurant: 2200,
    unknown: 4000,
  },
  hardFloorAed: 1500,

  techRider: {
    mixer: ["1x Pioneer DJM-A9 or DJM-900NXS2"],
    players: ["4x Pioneer CDJ-3000 (or 2x CDJ-3000 minimum), linked via Pro DJ Link"],
    monitors: "2x powered booth monitors, independent booth level control",
    booth: [
      "Booth height 100–110cm, minimum 180cm wide",
      "Booth must be stable, level and not shared with bar service",
      "Adequate booth lighting to read equipment",
    ],
    connectivity: [
      "1x RCA line-in spare for laptop/backup",
      "Stable venue Wi-Fi or hardwired ethernet for streaming library",
      "USB power outlet in booth",
    ],
    notes: [
      "Full soundcheck access minimum 45 minutes before doors",
      "Backline must be tested and confirmed working 24h before event",
      "Any substitution of specified equipment requires written approval",
    ],
  },

  hospitalityRider: [
    "1x +1 guest on the door",
    "Still and sparkling water in booth",
    "Secure area for laptop bag and personal belongings",
    "Parking space or return transport within Dubai",
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
      "Audio/video recording of the performance for commercial release requires Artist's prior written consent. Short-form social clips (under 90 seconds) are permitted with credit and tag.",
    ipPolicy:
      "Artist retains all rights in her performance, name, likeness, logo and any mixes supplied. Venue is granted a limited, non-exclusive, revocable licence to use Artist's name and approved press images solely to promote this engagement, for the period ending 30 days after the event.",
    forceMajeure:
      "Neither party is liable for failure to perform due to events beyond reasonable control (including government restriction, extreme weather, or national mourning). Deposit is transferable to a mutually agreed rescheduled date within 6 months.",
    governingLaw: "Laws of the Emirate of Dubai and applicable federal laws of the UAE.",
  },
};
