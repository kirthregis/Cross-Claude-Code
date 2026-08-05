export type GigStage = "new" | "contacted" | "negotiating" | "confirmed" | "paid" | "archived";
export type VenueTier = "superclub" | "beach_club" | "festival" | "brand_activation" | "hotel" | "private" | "private_event" | "hotel_lounge" | "bar_restaurant" | "unknown" | "other";
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

export interface Contact {
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  instagram?: string;
}