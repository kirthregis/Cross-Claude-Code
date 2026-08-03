// Core domain types for GigRadar — DJ Emy's gig acquisition engine.

export type VenueTier =
  | "superclub" // Soho Garden, White, BASE, Zero Gravity
  | "beach_club" // Nikki Beach, Cove Beach, Drift
  | "hotel_lounge" // 5* hotel bars, rooftop lounges
  | "brand_activation" // corporate / brand launch / fashion week
  | "private_event" // weddings, yacht, villa parties
  | "festival"
  | "bar_restaurant"
  | "unknown";

export type GigSourceKind =
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "gig_board"
  | "agency"
  | "event_calendar"
  | "rfp_tender"
  | "email"
  | "manual";

export type DealStage =
  | "new"
  | "alerted"
  | "pitched"
  | "negotiating"
  | "agreed"
  | "contracted"
  | "confirmed"
  | "performed"
  | "invoiced"
  | "paid"
  | "lost";

/** A raw item pulled from any source before normalisation. */
export interface RawLead {
  sourceKind: GigSourceKind;
  sourceName: string;
  sourceUrl?: string;
  externalId?: string;
  title: string;
  body: string;
  postedAt: string; // ISO
  raw?: Record<string, unknown>;
}

/** A normalised, deduped gig opportunity. */
export interface Gig {
  id: string;
  fingerprint: string;
  sourceKind: GigSourceKind;
  sourceName: string;
  sourceUrl?: string;

  title: string;
  body: string;
  venueName?: string;
  venueTier: VenueTier;
  area?: string; // Dubai Marina, DIFC, Palm, JBR...

  eventDate?: string; // ISO date of the gig itself
  setLengthMins?: number;
  slot?: "warmup" | "peak" | "closing" | "allnight" | "unknown";
  genresWanted: string[];

  budgetStatedAed?: number;
  exclusivity?: boolean; // radius clause / no other Dubai gig that week
  travelRequired?: boolean;
  recurring?: boolean; // weekly residency

  postedAt: string;
  discoveredAt: string;

  contacts: Contact[];
  score: number; // 0-100 fit score
  stage: DealStage;
}

export interface Contact {
  name?: string;
  role?: "promoter" | "venue_manager" | "agency" | "brand" | "unknown";
  company?: string;
  email?: string;
  phone?: string;
  instagram?: string;
  whatsapp?: string;
  /** Who actually signs the cheque. Higher = closer to the money. */
  decisionPower: number; // 0-100
}

export interface PriceInputs {
  venueTier: VenueTier;
  eventDate?: string;
  setLengthMins: number;
  slot: NonNullable<Gig["slot"]>;
  exclusivity: boolean;
  travelRequired: boolean;
  recurring: boolean;
  budgetStatedAed?: number;
  ramadan?: boolean;
}

export interface PriceQuote {
  currency: "AED";
  askAed: number; // opening ask
  targetAed: number; // realistic landing
  walkAwayAed: number; // never go below
  breakdown: { label: string; effect: string; value: number }[];
  rationale: string[];
  confidence: "low" | "medium" | "high";
}
