/**
 * EMY Studio — GigRadar AI
 * AI-powered pitch email generator, venue database, revenue tracker.
 */

export interface VenueContact {
  name: string;
  area: string;
  tier: "superclub" | "beach_club" | "hotel" | "festival" | "restaurant" | "lounge";
  email: string;
  instagram: string;
  bookingNotes: string;
  avgPayAed: number;
  genres: string[];
}

export const UAE_VENUES: VenueContact[] = [
  { name: "White Dubai", area: "DIFC", tier: "superclub", email: "bookings@whitedubai.com", instagram: "@whitedubai", bookingNotes: "Friday/Saturday nights. Send mix + EPK. Reply in 1-2 weeks.", avgPayAed: 8000, genres: ["Afro House", "Tech House", "Hip Hop"] },
  { name: "Soho Garden", area: "Meydan", tier: "superclub", email: "events@sohogarden.ae", instagram: "@sohogardendxb", bookingNotes: "Multiple stages. Strong on Afro House. Send EPK first.", avgPayAed: 7000, genres: ["Afro House", "Afro Tech", "House"] },
  { name: "BASE Dubai", area: "DIFC", tier: "superclub", email: "info@basedubai.com", instagram: "@basedubai", bookingNotes: "Underground focus. Prefer demo mix. Thursday nights.", avgPayAed: 5000, genres: ["Techno", "Tech House", "Afro Tech"] },
  { name: "Iris Dubai", area: "Grosvenor House", tier: "lounge", email: "dining@irisdubai.com", instagram: "@irisdubai", bookingNotes: "Rooftop. Afro House/Soulful. Friday brunches.", avgPayAed: 4000, genres: ["Afro House", "Soulful House", "Deep House"] },
  { name: "Cove Beach", area: "Caesars Palace", tier: "beach_club", email: "info@covebeach.ae", instagram: "@covebeachdubai", bookingNotes: "Weekend beach days. Tropical/Afro House. Send SoundCloud.", avgPayAed: 4500, genres: ["Afro House", "Tropical", "Nu-Disco"] },
  { name: "Zero Gravity", area: "Dubai Marina", tier: "beach_club", email: "events@0-gravity.ae", instagram: "@zerogravitydubai", bookingNotes: "Summer pool parties. High energy. Friday/Saturday.", avgPayAed: 5000, genres: ["Tech House", "House", "Afro Tech"] },
  { name: "Nikki Beach", area: "Pearl Jumeirah", tier: "beach_club", email: "dubai@nikkibeach.com", instagram: "@nikkibeachdubai", bookingNotes: "Brunch + beach days. Chill to peak time.", avgPayAed: 5500, genres: ["Nu-Disco", "Afro House", "Deep House"] },
  { name: "Drift Beach", area: "One&Only", tier: "beach_club", email: "driftbeach@oneandonlyresorts.com", instagram: "@driftbeachdubai", bookingNotes: "Luxury beach club. Sophisticated crowd.", avgPayAed: 6000, genres: ["Deep House", "Soulful House", "Afro House"] },
  { name: "Atlantis", area: "Palm Jumeirah", tier: "hotel", email: "entertainment@atlantis.com", instagram: "@atlantisthepalm", bookingNotes: "Multiple venues. Send full EPK + mix. 3-4 week response.", avgPayAed: 10000, genres: ["Afro House", "House", "Commercial"] },
  { name: "FIVE Palm Jumeirah", area: "Palm Jumeirah", tier: "hotel", email: "events@fivehotels.com", instagram: "@fivehotels", bookingNotes: "FIVE Beach + Rooftop. Very DJ-forward. Strong booker.", avgPayAed: 8000, genres: ["Afro House", "Tech House", "Hip Hop"] },
  { name: "W Dubai", area: "The Palm", tier: "hotel", email: "wdubai.events@whotels.com", instagram: "@wdubaithepalm", bookingNotes: "WET deck pool. Trendy crowd. Send EPK via email.", avgPayAed: 7000, genres: ["House", "Afro House", "Nu-Disco"] },
  { name: "Barasti", area: "Dubai Marina", tier: "beach_club", email: "info@barastibeach.com", instagram: "@barastibeach", bookingNotes: "Massive outdoor venue. Consistent bookings. Good for residency.", avgPayAed: 4000, genres: ["Commercial", "House", "Afro House"] },
  { name: "Nasimi Beach", area: "Atlantis", tier: "beach_club", email: "nasimibeach@atlantis.com", instagram: "@nasimibeach", bookingNotes: "Sunset sessions. Chilled Afro House. Great crowd.", avgPayAed: 5500, genres: ["Afro House", "Deep House", "Balearic"] },
  { name: "Azure Beach", area: "Rixos Premium", tier: "beach_club", email: "azure@rixosdubai.com", instagram: "@azurebeachdubai", bookingNotes: "JBR beach club. Growing scene.", avgPayAed: 4000, genres: ["House", "Afro House", "Tech House"] },
  { name: "Nobu Dubai", area: "Atlantis", tier: "restaurant", email: "dubai.reservations@noburestaurants.com", instagram: "@nobudubai", bookingNotes: "Background/ambient sets. Sophisticated. Send demo.", avgPayAed: 3500, genres: ["Deep House", "Nu-Jazz", "Lounge"] },
  { name: "Zuma Dubai", area: "DIFC", tier: "restaurant", email: "dubai@zumarestaurant.com", instagram: "@zumadubai", bookingNotes: "High energy dinner sets. Good repeat bookings.", avgPayAed: 3500, genres: ["Deep House", "Nu-Disco", "Funk"] },
  { name: "Coya Dubai", area: "Four Seasons DIFC", tier: "restaurant", email: "dubai@coyarestaurant.com", instagram: "@coyadubai", bookingNotes: "Latin-inspired. Eclectic crowd. Friday nights.", avgPayAed: 3500, genres: ["Latin House", "Afro House", "Nu-Disco"] },
  { name: "Billionaire Dubai", area: "Jumeirah", tier: "superclub", email: "reservations@billionairedubai.com", instagram: "@billionairedubai", bookingNotes: "Ultra-luxury. Top tier DJs. Very selective.", avgPayAed: 15000, genres: ["Hip Hop", "Commercial", "Afro Beats"] },
  { name: "Toy Room Dubai", area: "Mayfair Hotel", tier: "superclub", email: "dubai@toyroomnightclub.com", instagram: "@toyroomdubai", bookingNotes: "International crowd. Mid-week options.", avgPayAed: 5000, genres: ["Hip Hop", "Afro Beats", "Commercial"] },
  { name: "Nammos Dubai", area: "Four Seasons JBR", tier: "beach_club", email: "dubai@nammos.gr", instagram: "@nammosdubai", bookingNotes: "High-end Mediterranean. Strong on Afro House.", avgPayAed: 8000, genres: ["Afro House", "Greek House", "Deep House"] },
  { name: "Cielo Sky Lounge", area: "Dubai Creek Harbour", tier: "lounge", email: "cielo@dchhotels.com", instagram: "@cielodubai", bookingNotes: "Rooftop. Stunning views. Chill to sunset sessions.", avgPayAed: 3000, genres: ["Deep House", "Afro House", "Lounge"] },
  { name: "Twiggy", area: "Le Meridien", tier: "beach_club", email: "twiggy.lmdp@lemeridien.com", instagram: "@twiggydubai", bookingNotes: "Pool/beach club. Family-friendly daytime, party at night.", avgPayAed: 3500, genres: ["House", "Afro House", "Commercial"] },
  { name: "Club Odyssey", area: "Sheraton JBR", tier: "superclub", email: "odyssey@sheratonjbr.com", instagram: "@clubodysseydubai", bookingNotes: "Large capacity. International touring DJs.", avgPayAed: 6000, genres: ["Tech House", "Techno", "House"] },
];

export interface GigRevenue {
  gigId: string;
  amount: number;
  currency: "AED" | "USD" | "EUR";
  paid: boolean;
  invoiceSent: boolean;
  notes: string;
}

const REVENUE_KEY = "emy-studio-gig-revenue";

export function getGigRevenue(): GigRevenue[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(REVENUE_KEY);
    return raw ? JSON.parse(raw) as GigRevenue[] : [];
  } catch { return []; }
}

export function saveGigRevenue(data: GigRevenue[]): void {
  try { localStorage.setItem(REVENUE_KEY, JSON.stringify(data)); } catch {}
}

export function upsertGigRevenue(rev: GigRevenue): void {
  const all = getGigRevenue();
  const idx = all.findIndex(r => r.gigId === rev.gigId);
  if (idx >= 0) all[idx] = rev;
  else all.push(rev);
  saveGigRevenue(all);
}

export function getRevenueForGig(gigId: string): GigRevenue | null {
  return getGigRevenue().find(r => r.gigId === gigId) ?? null;
}

export function totalRevenue(): { totalAed: number; paidAed: number; pendingAed: number } {
  const all = getGigRevenue();
  const totalAed = all.reduce((s, r) => s + (r.currency === "AED" ? r.amount : r.currency === "USD" ? r.amount * 3.67 : r.amount * 4.0), 0);
  const paidAed = all.filter(r => r.paid).reduce((s, r) => s + (r.currency === "AED" ? r.amount : r.currency === "USD" ? r.amount * 3.67 : r.amount * 4.0), 0);
  return { totalAed, paidAed, pendingAed: totalAed - paidAed };
}

export async function generatePitchEmail(opts: {
  venueName: string;
  venueArea: string;
  artistName: string;
  genre: string;
  instagram: string;
  youtubeChannel: string;
  geminiKey: string;
  geminiModel: string;
}): Promise<string> {
  const { venueName, venueArea, artistName, genre, instagram, youtubeChannel, geminiKey, geminiModel } = opts;
  if (!geminiKey) {
    return buildFallbackPitch(opts);
  }
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{ text:
              "Write a professional DJ booking pitch email from " + artistName + " to " + venueName + " in " + venueArea + ", Dubai. " +
              "Genre: " + genre + ". Instagram: " + instagram + ". YouTube: " + youtubeChannel + ". " +
              "Keep it under 150 words. Professional, confident, not desperate. Include a subject line. " +
              "No placeholders — write it ready to send. Start with Subject: then a blank line then the email body."
            }]
          }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 400 }
        })
      }
    );
    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text ?? buildFallbackPitch(opts);
  } catch {
    return buildFallbackPitch(opts);
  }
}

function buildFallbackPitch(opts: { venueName: string; artistName: string; genre: string; instagram: string; youtubeChannel: string }): string {
  return "Subject: DJ Booking Enquiry — " + opts.artistName + "\n\n" +
    "Hi " + opts.venueName + " Team,\n\n" +
    "My name is " + opts.artistName + ", a professional " + opts.genre + " DJ based in Dubai. " +
    "I would love to discuss booking opportunities at " + opts.venueName + ".\n\n" +
    "You can check out my work here:\n" +
    "Instagram: " + opts.instagram + "\n" +
    "YouTube: " + opts.youtubeChannel + "\n\n" +
    "I am available for residencies, events and special occasions. " +
    "Please let me know if you would like to receive my full EPK and demo mix.\n\n" +
    "Looking forward to hearing from you.\n\n" +
    "Best regards,\n" + opts.artistName;
}

export interface FollowUp {
  gigId: string;
  scheduledDate: string;
  message: string;
  done: boolean;
}

const FOLLOWUP_KEY = "emy-studio-followups";

export function getFollowUps(): FollowUp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FOLLOWUP_KEY);
    return raw ? JSON.parse(raw) as FollowUp[] : [];
  } catch { return []; }
}

export function saveFollowUps(data: FollowUp[]): void {
  try { localStorage.setItem(FOLLOWUP_KEY, JSON.stringify(data)); } catch {}
}

export function addFollowUp(f: FollowUp): void {
  const all = getFollowUps();
  all.push(f);
  saveFollowUps(all);
}

export function markFollowUpDone(gigId: string): void {
  const all = getFollowUps();
  saveFollowUps(all.map(f => f.gigId === gigId ? { ...f, done: true } : f));
}

export function getDueFollowUps(): FollowUp[] {
  const now = new Date().toISOString().split("T")[0];
  return getFollowUps().filter(f => !f.done && f.scheduledDate <= now);
}