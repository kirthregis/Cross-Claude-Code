export type GigStage = "new" | "contacted" | "negotiating" | "confirmed" | "paid" | "archived";

export type VenueTier = "superclub" | "beach_club" | "festival" | "brand_activation" | "hotel" | "private" | "private_event" | "hotel_lounge" | "bar_restaurant" | "unknown" | "other";

export interface Contact {
  name?: string;
  role?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  instagram?: string;
  decisionPower?: number;
}

export interface Gig {
  id: string;
  sourceKind: "instagram" | "whatsapp" | "email" | "event_calendar" | "gig_board";
  sourceName: string;
  sourceUrl?: string;
  externalId?: string;
  title: string;
  body: string;
  postedAt: string;
  score: number;
  stage: GigStage;
  venueName?: string;
  venueTier?: VenueTier;
  feeAed?: number;
  commissionAed?: number;
  contractUrl?: string;
  notes?: string;
  slot?: "warmup" | "peak" | "closing" | "allnight" | "unknown";
  contacts?: Contact[];
  fingerprint?: string;
  eventDate?: string;
  discoveredAt?: string;
  area?: string;
  venueArea?: string;
  exclusivity?: boolean;
  travelRequired?: boolean;
  recurring?: boolean;
  genresWanted?: string[];
  setLengthMins?: number;
  budgetStatedAed?: number;
}

export interface RawLead {
  sourceKind: Gig["sourceKind"];
  sourceName: string;
  sourceUrl?: string;
  externalId?: string;
  title: string;
  body: string;
  postedAt: string;
}

export interface RevenueStats {
  totalEarned: number;
  totalCommission: number;
  pendingAed: number;
  paidAed: number;
  gigCount: number;
}

export interface PriceInputs {
  venueTier: VenueTier;
  setLengthMins: number;
  slot: "warmup" | "peak" | "closing" | "allnight" | "unknown";
  eventDate?: string;
  exclusivity?: boolean;
  travelRequired?: boolean;
  recurring?: boolean;
  budgetStatedAed?: number;
  ramadan?: boolean;
}

export interface PriceQuote {
  currency: string;
  askAed: number;
  targetAed: number;
  walkAwayAed: number;
  confidence: "low" | "medium" | "high";
  breakdown: { label: string; effect: string; value: number }[];
  rationale: string[];
}