/**
 * Normalisation: turn messy free text from Instagram captions, WhatsApp
 * messages, job boards and RFPs into a structured Gig.
 *
 * Deliberately rule-based and dependency-free so it runs in milliseconds inside
 * the ingest loop. An LLM pass can be layered on top later for the hard cases —
 * see `enrichWithLLM` hook in sources/index.ts.
 */

import type { RawLead, VenueTier, Gig, Contact } from "./types";
import { activeProfile } from "./active-profile";
import { createHash } from "crypto";

const DUBAI_AREAS = [
  "Dubai Marina", "JBR", "Palm Jumeirah", "DIFC", "Downtown", "Business Bay",
  "Jumeirah", "Al Quoz", "Deira", "Bur Dubai", "City Walk", "Bluewaters",
  "Dubai Hills", "Barsha", "Media City", "Festival City", "Al Seef", "The Walk",
];

/**
 * Two-pass tier matching. SPECIFIC patterns (named venues, multi-word phrases)
 * must win over GENERIC single words, otherwise "beach club" is captured by the
 * bare word "club" and misclassified as a superclub — which would misprice the
 * gig by thousands of dirhams.
 */
const TIER_SPECIFIC: [VenueTier, RegExp][] = [
  ["beach_club", /\b(beach club|nikki beach|cove beach|zero gravity|drift beach|pool party|day party|beach bar)\b/i],
  ["superclub", /\b(super ?club|night ?club|soho garden|white dubai|base dubai|iris dubai|billionaire|club takeover)\b/i],
  ["festival", /\b(festival|main stage|stage takeover|arena show)\b/i],
  ["brand_activation", /\b(brand activation|product launch|corporate event|company party|fashion week|gala dinner|conference|expo|activation)\b/i],
  ["private_event", /\b(private (party|event|villa|hire)|wedding|yacht|villa party|birthday party|engagement party)\b/i],
  ["hotel_lounge", /\b(rooftop|sky ?bar|hotel bar|lounge|brunch|resort)\b/i],
];

const TIER_GENERIC: [VenueTier, RegExp][] = [
  ["beach_club", /\bbeach\b/i],
  ["superclub", /\bclub\b/i],
  ["brand_activation", /\b(brand|corporate|launch)\b/i],
  ["private_event", /\bprivate\b/i],
  ["hotel_lounge", /\bhotel\b/i],
  ["bar_restaurant", /\b(bar|restaurant|bistro|cafe|pub|eatery)\b/i],
];

export function detectVenueTier(text: string): VenueTier {
  for (const [tier, re] of TIER_SPECIFIC) if (re.test(text)) return tier;
  for (const [tier, re] of TIER_GENERIC) if (re.test(text)) return tier;
  return "unknown";
}

export function detectArea(text: string): string | undefined {
  return DUBAI_AREAS.find((a) => new RegExp(`\\b${a}\\b`, "i").test(text));
}

/** Pull a fee from text. Handles AED/DHS/د.إ, "3k", ranges (takes the top). */
export function detectBudgetAed(text: string): number | undefined {
  const nums: number[] = [];
  // NOTE: the number groups must START with a digit — `[\d,]+` alone matches a
  // bare comma, which silently swallowed real amounts ("September, AED 5000").
  const NUM = String.raw`\d[\d,]*(?:\.\d+)?`;
  const CUR = String.raw`(?:aed|dhs?|dirhams?|د\.إ)`;
  const re = new RegExp(`${CUR}\\s*(${NUM})\\s*(k)?|(${NUM})\\s*(k)?\\s*${CUR}`, "gi");
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const rawNum = m[1] ?? m[3];
    const kFlag = m[2] ?? m[4];
    if (!rawNum) continue;
    let v = parseFloat(rawNum.replace(/,/g, ""));
    if (kFlag) v *= 1000;
    if (v >= 200 && v <= 500_000) nums.push(v);
  }
  if (!nums.length) return undefined;
  return Math.max(...nums); // top of a stated range
}

/** Set length in minutes: "2 hours", "90 mins", "2-3hr set". */
export function detectSetLength(text: string): number | undefined {
  const hr = text.match(/(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?)\s*)?(?:h|hr|hrs|hour|hours)\b/i);
  if (hr) return Math.round(parseFloat(hr[2] ?? hr[1]) * 60);
  const min = text.match(/(\d{2,3})\s*(?:m|min|mins|minutes)\b/i);
  if (min) return parseInt(min[1], 10);
  return undefined;
}

export function detectSlot(text: string): NonNullable<Gig["slot"]> {
  if (/\b(warm ?up|opener|opening set|early slot)\b/i.test(text)) return "warmup";
  if (/\b(closing|close out|last set)\b/i.test(text)) return "closing";
  if (/\b(all night|open to close|full night)\b/i.test(text)) return "allnight";
  if (/\b(peak|headline|main slot|prime time)\b/i.test(text)) return "peak";
  return "unknown";
}

export function detectGenres(text: string): string[] {
  const all = [...activeProfile().genres, ...activeProfile().secondaryGenres, ...activeProfile().wontPlay,
    "Techno", "Hip Hop", "Amapiano", "Disco", "Latin", "Arabic", "Bollywood", "EDM", "Lounge", "Chillout"];
  const found = new Set<string>();
  for (const g of all) if (new RegExp(`\\b${g.replace(/&/g, "&?")}\\b`, "i").test(text)) found.add(g);
  return [...found];
}

export function detectContacts(text: string): Contact[] {
  const contacts: Contact[] = [];
  const emails = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/g) ?? [];
  const phones = text.match(/(?:\+971|00971|0)\s?5\d(?:[\s-]?\d){7}/g) ?? [];
  const handles = text.match(/(?<![\w@])@([A-Za-z0-9._]{3,30})/g) ?? [];

  const role = (): Contact["role"] => {
    if (/\bagency|agent\b/i.test(text)) return "agency";
    if (/\bpromoter\b/i.test(text)) return "promoter";
    if (/\b(venue|f&b|operations) manager\b/i.test(text)) return "venue_manager";
    if (/\bbrand|marketing\b/i.test(text)) return "brand";
    return "unknown";
  };

  for (const e of emails) {
    // booking@ / events@ inboxes are gatekeepers; a named address is better.
    const generic = /^(info|hello|contact|admin)@/i.test(e);
    const bookingy = /^(book|bookings|events|talent|entertainment)@/i.test(e);
    contacts.push({ email: e, role: role(), decisionPower: generic ? 30 : bookingy ? 65 : 55 });
  }
  for (const p of phones) contacts.push({ phone: p.replace(/\s/g, ""), whatsapp: p.replace(/\s/g, ""), role: role(), decisionPower: 75 });
  for (const h of handles.slice(0, 3)) contacts.push({ instagram: h, role: role(), decisionPower: 45 });

  return contacts;
}

/** Try to find the date of the event itself. */
export function detectEventDate(text: string, postedAt: string): string | undefined {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const months = "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";
  const dm = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months})\\w*\\s*(20\\d{2})?`, "i"));
  if (dm) {
    const monthIdx = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
      .indexOf(dm[2].toLowerCase().slice(0, 3));
    const year = dm[3] ? parseInt(dm[3], 10) : new Date(postedAt).getUTCFullYear();
    const d = new Date(Date.UTC(year, monthIdx, parseInt(dm[1], 10)));
    // If the date already passed, assume next year.
    if (d.getTime() < new Date(postedAt).getTime() - 86_400_000) d.setUTCFullYear(year + 1);
    return d.toISOString().slice(0, 10);
  }

  const base = new Date(postedAt);
  const wd = text.match(/\b(this|next)?\s?(friday|saturday|thursday|sunday|monday|tuesday|wednesday)\b/i);
  if (wd) {
    const target = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"].indexOf(wd[2].toLowerCase());
    const d = new Date(base);
    let delta = (target - d.getUTCDay() + 7) % 7;
    if (delta === 0) delta = 7;
    if (wd[1]?.toLowerCase() === "next") delta += 7;
    d.setUTCDate(d.getUTCDate() + delta);
    return d.toISOString().slice(0, 10);
  }
  if (/\btonight\b/i.test(text)) return base.toISOString().slice(0, 10);
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(base); d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  return undefined;
}

/**
 * Stable fingerprint for dedupe. The same gig posted to Instagram, a WhatsApp
 * group and an agency mailout must collapse into ONE alert.
 */
export function fingerprint(g: { venueName?: string; eventDate?: string; title: string; body: string }): string {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  // Signature words = the rarest tokens, resilient to caption rewording.
  const tokens = norm(`${g.title} ${g.body}`).split(" ").filter((t) => t.length > 4);
  const sig = [...new Set(tokens)].sort().slice(0, 12).join("|");
  const key = `${norm(g.venueName ?? "")}::${g.eventDate ?? ""}::${sig}`;
  return createHash("sha1").update(key).digest("hex").slice(0, 16);
}

export function detectVenueName(text: string): string | undefined {
  const at = text.match(/\b(?:at|@)\s+([A-Z][\w'&.]*(?:\s+[A-Z][\w'&.]*){0,3})/);
  if (at) return at[1].trim();
  return undefined;
}

export function normalise(lead: RawLead): Omit<Gig, "id" | "score" | "stage"> {
  const text = `${lead.title}\n${lead.body}`;
  const eventDate = detectEventDate(text, lead.postedAt);
  const venueName = detectVenueName(text);

  return {
    fingerprint: fingerprint({ venueName, eventDate, title: lead.title, body: lead.body }),
    sourceKind: lead.sourceKind,
    sourceName: lead.sourceName,
    sourceUrl: lead.sourceUrl,
    title: lead.title,
    body: lead.body,
    venueName,
    venueTier: detectVenueTier(text),
    area: detectArea(text),
    eventDate,
    setLengthMins: detectSetLength(text),
    slot: detectSlot(text),
    genresWanted: detectGenres(text),
    budgetStatedAed: detectBudgetAed(text),
    exclusivity: /\b(exclusiv|radius clause|no other)\b/i.test(text),
    travelRequired: /\b(abu dhabi|ras al khaimah|sharjah|fujairah|doha|riyadh|travel|fly)\b/i.test(text),
    recurring: /\b(residency|resident dj|weekly|every (friday|saturday|thursday)|monthly)\b/i.test(text),
    postedAt: lead.postedAt,
    discoveredAt: new Date().toISOString(),
    contacts: detectContacts(text),
  };
}
