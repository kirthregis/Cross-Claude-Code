/**
 * Generates the ready-to-use document pack as plain files.
 *
 * The point: everything the engine knows — pricing, pitches, contract,
 * negotiation counters — usable TODAY without running a server.
 */
import { mkdirSync, writeFileSync } from "fs";
import { DJ_EMY } from "../src/lib/artist";
import { quote } from "../src/lib/pricing";
import { generateDealPack } from "../src/lib/contract";
import { pitch, negotiationPlaybook } from "../src/lib/outreach";
import { normalise } from "../src/lib/extract";
import type { Gig, VenueTier } from "../src/lib/types";

const OUT = "pack";
mkdirSync(OUT, { recursive: true });

const money = (n: number) => `AED ${n.toLocaleString()}`;
const TIERS: VenueTier[] = ["brand_activation","festival","private_event","superclub","beach_club","hotel_lounge","bar_restaurant"];
const nice = (t: string) => t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------------- 1. RATE CARD ---------------- */
const rateRows = TIERS.map((t) => {
  const q = quote({ venueTier: t, setLengthMins: 120, slot: "peak", exclusivity: false, travelRequired: false, recurring: false });
  return `| ${nice(t)} | ${money(q.askAed)} | ${money(q.targetAed)} | ${money(q.walkAwayAed)} |`;
}).join("\n");

writeFileSync(`${OUT}/1-RATE-CARD.md`, `# DJ Emy — Rate Card
**Emy Vision Group** · ${DJ_EMY.management.email} · ${DJ_EMY.management.phone}

Standard **2-hour peak-time set**. Quote the *Ask*. Expect to land near *Target*.
**Never sign below the Floor.**

| Venue type | Ask | Target | Floor |
|---|---|---|---|
${rateRows}

## Adjustments — apply on top of the base

| Situation | Effect |
|---|---|
| Friday or Saturday | +25% |
| Thursday | +10% |
| Weeknight (Mon/Wed) | −15% |
| December / NYE window | +35% |
| Feb–Apr (high season) | +20% |
| Oct–Nov (season opening) | +15% |
| Jun–Sep (Dubai summer) | −20% |
| Ramadan | −45% (verify the event is even permitted) |
| **Booked within 3 days** | **+25% — they're desperate, hold firm** |
| Each hour beyond 2h | +35% |
| Warm-up slot | −30% |
| All-night / open-to-close | +30% |
| **Exclusivity / radius clause** | **+30% — never grant this free** |
| Travel outside UAE & Qatar | +20% *plus* flights & hotel as separate lines |
| Residency (weekly/monthly) | −15% — worth it for guaranteed income |

> Doha and Abu Dhabi are **home markets** — no travel premium.

## Residency pricing
Dubai market: AED 15,000–30,000+/month for established DJs at major venue groups.
Quote **AED 6,000–8,000 per night** on a 3-month minimum, or
**AED 25,000–32,000/month** for four nights.

## Absolute floor
**${money(DJ_EMY.hardFloorAed)}** — any venue, any night, no exceptions.

---
*Rates are market-researched (see RATE-RESEARCH.md), not yet based on Emy's
realised fees. Send 5–10 past bookings to sharpen them.*
`);

/* ---------------- 2. PITCH SCRIPTS ---------------- */
const mk = (body: string): Gig => ({
  ...normalise({ sourceKind: "manual", sourceName: "m", title: "t", body, postedAt: new Date().toISOString() }),
  id: "sample", score: 80, stage: "new",
});

const scenarios: [string, string][] = [
  ["Nightclub / peak-time slot", "Afro House DJ for a superclub, 2 hour peak slot on Saturday"],
  ["Beach club / day party", "Afro House DJ for a beach club day party, 2 hour peak set on Saturday"],
  ["Brand launch / corporate", "DJ for a corporate brand activation and product launch, 3 hour set"],
  ["Hotel rooftop / lounge", "House DJ for a hotel rooftop lounge, golden hour sunset session, 2 hours"],
  ["Private / VIP / yacht", "DJ for a private villa party, 3 hour open format set"],
];

writeFileSync(`${OUT}/2-PITCH-SCRIPTS.md`, `# Pitch scripts — send these as-is
Written from **${DJ_EMY.management.company}**, signed by ${DJ_EMY.management.contactName}.
Swap the [bracketed] bits. Prices assume a standard set — check the rate card.

${scenarios.map(([label, body]) => {
  const g = mk(body);
  const w = pitch(g, "whatsapp");
  const e = pitch(g, "email");
  return `---

## ${label}

### WhatsApp / Instagram DM
\`\`\`
${w.body.replace(/Saturday \d+ \w+|the date you have in mind/g, "[DATE]").replace(/ at your venue/g, " at [VENUE]")}
\`\`\`

### Email
**Subject:** ${e.subject?.replace(/Saturday \d+ \w+|the date you have in mind/g, "[DATE]")}

\`\`\`
${e.body.replace(/Saturday \d+ \w+|the date you have in mind/g, "[DATE]").replace(/ at your venue/g, " at [VENUE]")}
\`\`\`
`;
}).join("\n")}
`);

/* ---------------- 3. NEGOTIATION ---------------- */
const pb = negotiationPlaybook(mk("Afro House DJ for a superclub, 2 hour peak slot on Saturday"));
writeFileSync(`${OUT}/3-NEGOTIATION.md`, `# Negotiation playbook
What they say, and exactly what to say back.

${pb.map((c, i) => `## ${i + 1}. "${c.objection}"\n\n${c.response}\n`).join("\n")}
---

## Three rules
1. **Make them say a number first.** "What budget are you working with?"
2. **A deposit is the only confirmation.** Verbal holds cost her paid work.
3. **Every add-on is a line item.** Extra hour, exclusivity, travel, content — reprice in writing.
`);

/* ---------------- 4. CONTRACT + DOCS ---------------- */
const sample = mk("Afro House DJ at [VENUE], 2 hour peak set");
const packDocs = generateDealPack(sample, { agreedFeeAed: 8000, clientLegalName: "[CLIENT LEGAL NAME]" });
writeFileSync(`${OUT}/4-CONTRACT-TEMPLATE.md`, packDocs.contract.replace(
  "PLACEHOLDER — EVG registered legal entity name & trade licence no.",
  "______________________  ← EVG registered legal entity name (from the business licence)"
));
writeFileSync(`${OUT}/5-INVOICE-TEMPLATE.md`, packDocs.invoice);
writeFileSync(`${OUT}/6-RUNSHEET-TEMPLATE.md`, packDocs.runsheet);
writeFileSync(`${OUT}/7-PRESS-PACK.md`, packDocs.pressPack);

console.log("Wrote pack/:");
for (const f of ["1-RATE-CARD","2-PITCH-SCRIPTS","3-NEGOTIATION","4-CONTRACT-TEMPLATE","5-INVOICE-TEMPLATE","6-RUNSHEET-TEMPLATE","7-PRESS-PACK"]) console.log("  " + f + ".md");
