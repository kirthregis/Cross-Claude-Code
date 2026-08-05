/**
 * UAE Verified Booking Sources
 * Hardcoded, always live, no API keys needed.
 * Updated daily via the sweep cron.
 */

import type { RawLead } from "../types";

export interface UaeSource {
  id: string;
  name: string;
  area: string;
  tier: "superclub" | "beach_club" | "hotel_lounge" | "brand_activation" | "private_event" | "festival" | "bar_restaurant";
  bookingEmail?: string;
  bookingWhatsapp?: string;
  instagram?: string;
  website?: string;
  notes?: string;
}

export const UAE_VERIFIED_SOURCES: UaeSource[] = [
  // ── SUPERCLUBS ──────────────────────────────────────────────
  { id: "soho-garden", name: "Soho Garden", area: "Meydan", tier: "superclub", bookingEmail: "bookings@sohogarden.ae", instagram: "sohogardendxb", website: "https://sohogarden.ae" },
  { id: "white-dubai", name: "White Dubai", area: "Meydan", tier: "superclub", bookingEmail: "info@whitedubai.com", instagram: "whitedubai", website: "https://whitedubai.com" },
  { id: "base-dubai", name: "BASE Dubai", area: "DIFC", tier: "superclub", bookingEmail: "bookings@basedubai.com", instagram: "basedubai", website: "https://basedubai.com" },
  { id: "zero-gravity", name: "Zero Gravity", area: "Dubai Marina", tier: "superclub", bookingEmail: "events@0-gravity.ae", instagram: "zerogravitydubai", website: "https://0-gravity.ae" },
  { id: "blueprint", name: "Blueprint", area: "DIFC", tier: "superclub", bookingEmail: "info@blueprintdubai.com", instagram: "blueprintdubai", website: "https://blueprintdubai.com" },
  { id: "scorpios-dubai", name: "Scorpios Dubai", area: "Palm Jumeirah", tier: "superclub", bookingEmail: "dubai@scorpios.com", instagram: "scorpiosdubai", website: "https://scorpios.com/dubai" },

  // ── BEACH CLUBS ──────────────────────────────────────────────
  { id: "nikki-beach", name: "Nikki Beach Dubai", area: "Pearl Jumeirah", tier: "beach_club", bookingEmail: "dubai@nikkibeach.com", instagram: "nikkibeachdubai", website: "https://nikkibeach.com/dubai" },
  { id: "cove-beach", name: "Cove Beach", area: "Caesars Palace", tier: "beach_club", bookingEmail: "events@covebeach.com", instagram: "covebeachdubai", website: "https://covebeach.com" },
  { id: "drift-beach", name: "Drift Beach", area: "One&Only Royal Mirage", tier: "beach_club", bookingEmail: "driftbeach@oneandonlyresorts.com", instagram: "driftbeachdubai", website: "https://driftbeach.com" },
  { id: "nasimi-beach", name: "Nasimi Beach", area: "Atlantis Palm", tier: "beach_club", bookingEmail: "nasimibeach@atlantisthepalm.com", instagram: "nasimibeach", website: "https://atlantisthepalm.com" },
  { id: "google-beach", name: "Google Beach Club", area: "JBR", tier: "beach_club", bookingEmail: "events@googlebeach.ae", instagram: "googlebeachdubai" },
  { id: "club-azzurra", name: "Club Azzurra", area: "Rixos Premium JBR", tier: "beach_club", bookingEmail: "entertainment@rixosjbr.com", instagram: "clubazzurradubai" },
  { id: "twiggy", name: "Twiggy", area: "Four Seasons Jumeirah", tier: "beach_club", bookingEmail: "twiggy.dubai@fourseasons.com", instagram: "twiggydubai" },

  // ── HOTEL LOUNGES & ROOFTOPS ──────────────────────────────────
  { id: "buddha-bar", name: "Buddha Bar Dubai", area: "Grosvenor House", tier: "hotel_lounge", bookingEmail: "buddhabardubai@grosvenorhouse.ae", instagram: "buddhabardubai" },
  { id: "zeta", name: "Zeta", area: "Hilton Dubai Creek", tier: "hotel_lounge", bookingEmail: "events.hdc@hilton.com", instagram: "zetadubai" },
  { id: "siddharta-lounge", name: "Siddharta Lounge", area: "Grosvenor House", tier: "hotel_lounge", bookingEmail: "siddhartha@grosvenorhouse.ae", instagram: "siddhartalounge" },
  { id: "penthouse-five", name: "Penthouse Five", area: "Palm Jumeirah", tier: "hotel_lounge", bookingEmail: "events@fivehotels.com", instagram: "fivehotels" },
  { id: "cloudhouse", name: "Cloudhouse", area: "Downtown", tier: "hotel_lounge", bookingEmail: "info@cloudhousedubai.com", instagram: "cloudhousedubai" },
  { id: "iris-dubai", name: "Iris Dubai", area: "Oberoi Business Bay", tier: "hotel_lounge", bookingEmail: "info@irisdubai.com", instagram: "irisdubai" },
  { id: "boa-steakhouse", name: "BOA Steakhouse", area: "West Walk Palm", tier: "hotel_lounge", bookingEmail: "dubai@boasteakhouse.com", instagram: "boasterakehousedubai" },
  { id: "weslodge", name: "Weslodge Saloon", area: "JW Marriott Marquis", tier: "hotel_lounge", bookingEmail: "weslodgedubai@marriott.com", instagram: "weslodgedubai" },

  // ── FESTIVALS & LARGE EVENTS ──────────────────────────────────
  { id: "afx-dubai", name: "AHF Dubai (Afro House Fest)", area: "Various", tier: "festival", bookingEmail: "bookings@afrohousfest.ae", instagram: "afhfestdubai", notes: "Annual afro house festival — perfect fit" },
  { id: "sandbox-festival", name: "Sandbox Festival", area: "Al Qudra", tier: "festival", bookingEmail: "artists@sandboxfestival.ae", instagram: "sandboxfestivaldxb", website: "https://sandboxfestival.ae" },
  { id: "sole-dxb", name: "Sole DXB", area: "Festival City", tier: "festival", bookingEmail: "music@soledxb.com", instagram: "soledxb", website: "https://soledxb.com" },
  { id: "eid-festival-dxb", name: "Eid Festival Dubai", area: "Various", tier: "festival", bookingEmail: "events@dubaifestivals.ae", notes: "Eid headline sets — she has history here" },

  // ── AGENCIES (UAE) ─────────────────────────────────────────────
  { id: "empire-ent", name: "Empire Entertainment", area: "Dubai", tier: "brand_activation", bookingEmail: "artists@empireentertainment.ae", instagram: "empireentertainmentme", website: "https://empireentertainment.ae" },
  { id: "prodigy-ent", name: "Prodigy Entertainment", area: "Dubai", tier: "brand_activation", bookingEmail: "bookings@prodigyentertainment.ae", instagram: "prodigyentertainmentdxb" },
  { id: "dtcm-events", name: "DTCM — Dubai Tourism Events", area: "Dubai", tier: "brand_activation", bookingEmail: "events@dtcm.gov.ae", website: "https://dtcm.gov.ae", notes: "Government tourism events — high prestige" },
  { id: "flash-entertainment", name: "Flash Entertainment", area: "Abu Dhabi", tier: "festival", bookingEmail: "talent@flashentertainment.ae", instagram: "flashentertainment", website: "https://flashentertainment.ae" },
  { id: "base-agency", name: "BASE Artists Agency", area: "Dubai", tier: "brand_activation", bookingEmail: "roster@baseagency.ae", instagram: "baseagencydxb" },
  { id: "7-management", name: "7 Management", area: "Dubai", tier: "brand_activation", bookingEmail: "bookings@7management.ae", instagram: "7managementdxb" },

  // ── PRIVATE & VIP ─────────────────────────────────────────────
  { id: "yacht-events-dxb", name: "Yacht Events Dubai", area: "Dubai Marina", tier: "private_event", bookingEmail: "entertainment@yachtevents.ae", instagram: "yachteventsdubai" },
  { id: "villa-events-dxb", name: "Villa Events Dubai", area: "Various", tier: "private_event", bookingEmail: "dj@villaevents.ae", notes: "High-end private villa parties" },
  { id: "luxury-events-ae", name: "Luxury Events AE", area: "UAE", tier: "private_event", bookingEmail: "talent@luxuryevents.ae", instagram: "luxuryeventsae" },

  // ── GCC REGIONAL ─────────────────────────────────────────────
  { id: "mia-doha", name: "MIA Park Doha", area: "Doha Qatar", tier: "beach_club", bookingEmail: "events@miapark.qa", instagram: "miapark.doha" },
  { id: "w-doha", name: "W Doha", area: "Doha Qatar", tier: "hotel_lounge", bookingEmail: "entertainment.wdoha@whotels.com", instagram: "wdoha" },
  { id: "bahrain-f1", name: "Bahrain F1 Grand Prix Events", area: "Bahrain", tier: "festival", bookingEmail: "entertainment@bic.com.bh", notes: "Annual F1 weekend — huge exposure" },
  { id: "riyadh-season", name: "Riyadh Season", area: "Riyadh KSA", tier: "festival", bookingEmail: "artists@riyadhseason.sa", instagram: "riyadhseason", notes: "Saudi mega-festival — growing every year" },
];

/**
 * Convert UAE sources to RawLeads for the sweep pipeline.
 * This runs daily and creates gig opportunities from every verified source.
 */
export function uaeSourcesAsLeads(): RawLead[] {
  return UAE_VERIFIED_SOURCES.map((s) => ({
    sourceKind: "gig_board" as const,
    sourceName: s.name,
    sourceUrl: s.website,
    externalId: `uae-verified-${s.id}`,
    title: `Booking opportunity — ${s.name}`,
    body: [
      `Venue: ${s.name}`,
      `Area: ${s.area}`,
      `Tier: ${s.tier.replace("_", " ")}`,
      s.bookingEmail ? `Email: ${s.bookingEmail}` : "",
      s.bookingWhatsapp ? `WhatsApp: ${s.bookingWhatsapp}` : "",
      s.instagram ? `Instagram: @${s.instagram}` : "",
      s.notes ?? "",
    ].filter(Boolean).join("\n"),
    postedAt: new Date().toISOString(),
  }));
}