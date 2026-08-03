/** Seeds realistic Dubai leads so the whole pipeline can be seen working. */
import { processLeads } from "../src/lib/ingest";
import type { RawLead } from "../src/lib/types";

const now = new Date();
const inDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);

const LEADS: RawLead[] = [
  {
    sourceKind: "whatsapp", sourceName: "Dubai Promoters Group",
    title: "URGENT DJ needed", postedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    body: `URGENT 🚨 Need an Afro House DJ for ${inDays(2)} at Cove Beach, Dubai Marina. 2 hour peak slot. AED 6,500. Our DJ cancelled. WhatsApp me now +971 50 442 1188 — Karim`,
  },
  {
    sourceKind: "email", sourceName: "events@luxebrand.ae",
    title: "DJ for product launch — Palm Jumeirah",
    postedAt: new Date(Date.now() - 40 * 60000).toISOString(),
    body: `Hello, we are organising a brand activation and product launch on ${inDays(38)} at a private venue on Palm Jumeirah. We need a house DJ for a 3 hour set, exclusive to our event that week. Budget up to AED 18,000. Please share your EPK. Regards, Sarah Al Mansouri, Head of Events. sarah.almansouri@luxebrand.ae`,
  },
  {
    sourceKind: "instagram", sourceName: "@sohogardendxb",
    title: "Resident DJ applications open",
    postedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    body: `Applications open for our weekly residency 🎧 Every Friday, melodic house & techno, 2hr warm up slot. Season starts October. DM @sohogardendxb or email talent@sohogarden.ae`,
  },
  {
    sourceKind: "gig_board", sourceName: "dubaigigs.example.com",
    title: "Rooftop lounge DJ — weeknights",
    postedAt: new Date(Date.now() - 26 * 3600000).toISOString(),
    body: `Hotel rooftop lounge in DIFC seeking deep house DJ for Tuesday nights, 3 hours, AED 1,200 per night. Contact info@rooftopdifc.ae`,
  },
  {
    sourceKind: "instagram", sourceName: "@dxbweddingplanners",
    title: "Wedding DJ needed",
    postedAt: new Date(Date.now() - 90 * 60000).toISOString(),
    body: `Private wedding on ${inDays(60)}, yacht in Dubai Marina, open format set 4 hours. Budget AED 9,000. WhatsApp +971 55 320 7741`,
  },
  {
    sourceKind: "event_calendar", sourceName: "platinumlist.example.net",
    title: "Hard Techno warehouse night — DJs wanted",
    postedAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    body: `Al Quoz warehouse, Hard Techno and Drum & Bass night, ${inDays(20)}. Looking for support DJs, AED 800 for 1 hour.`,
  },
  {
    sourceKind: "whatsapp", sourceName: "Doha Nightlife Group",
    title: "Afro House DJ — The Pearl",
    postedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    body: `Looking for an Afro House DJ for a rooftop opening at The Pearl, Doha on ${inDays(12)}. 2 hour sunset set, Arabic and international crowd. Budget QAR equivalent AED 11,000. Contact +974 5512 3344`,
  },
  {
    sourceKind: "email", sourceName: "talent@gulfevents.example",
    title: "Tournament fan zone — official DJ",
    postedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    body: `We are staffing the official fan zone stage for a major sporting event on ${inDays(75)}. Seeking a headline DJ with tournament experience, Afro House / open format, 3 hour main stage set. Fee AED 25,000. Exclusive to our event that week.`,
  },
];

const r = await processLeads(LEADS);
console.log(`\nSeeded. found=${r.found} new=${r.newGigs} alerted=${r.alerted}`);
if (r.errors.length) console.log("errors:", r.errors);
for (const g of r.gigs) {
  console.log(`  [${g.score.toString().padStart(3)}] ${(g.venueName ?? g.sourceName).padEnd(24)} ${g.eventDate ?? "TBC"}  ${g.budgetStatedAed ? "AED " + g.budgetStatedAed.toLocaleString() : "no budget"}`);
}
console.log("\nRun `npm run dev` and open http://localhost:3000\n");
