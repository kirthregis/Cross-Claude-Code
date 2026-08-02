/**
 * Deal pack generation: contract, technical rider, logistics runsheet,
 * financial schedule, press/content requirements and IP terms.
 *
 * Output is Markdown so it renders in the app, exports to PDF, and pastes
 * into an email untouched.
 *
 * ⚖️  NOT LEGAL ADVICE. This produces a solid industry-standard performance
 * agreement, but have a UAE-qualified lawyer review the template once before
 * it's used on high-value bookings.
 */

import { activeProfile } from "./active-profile";
import type { Gig } from "./types";
import { quoteFor } from "./outreach";

export interface DealTerms {
  agreedFeeAed: number;
  eventDate: string;
  loadInTime?: string;
  setStart?: string;
  setEnd?: string;
  clientLegalName?: string;
  clientAddress?: string;
  venueAddress?: string;
  exclusivityKm?: number;
}

const money = (n: number) => `AED ${n.toLocaleString()}`;

export function deriveTerms(g: Gig, overrides: Partial<DealTerms> = {}): DealTerms {
  const q = quoteFor(g);
  return {
    agreedFeeAed: overrides.agreedFeeAed ?? g.budgetStatedAed ?? q.targetAed,
    eventDate: overrides.eventDate ?? g.eventDate ?? "TBC",
    setStart: overrides.setStart ?? "23:00",
    setEnd: overrides.setEnd ?? "01:00",
    loadInTime: overrides.loadInTime ?? "22:00",
    clientLegalName: overrides.clientLegalName ?? g.venueName ?? "[CLIENT LEGAL NAME]",
    clientAddress: overrides.clientAddress ?? "[CLIENT REGISTERED ADDRESS]",
    venueAddress: overrides.venueAddress ?? [g.venueName, g.area, "Dubai, UAE"].filter(Boolean).join(", "),
    exclusivityKm: overrides.exclusivityKm ?? (g.exclusivity ? activeProfile().contractDefaults.defaultExclusivityKm : 0),
  };
}

export function generateContract(g: Gig, t: DealTerms): string {
  const c = activeProfile().contractDefaults;
  const deposit = Math.round((t.agreedFeeAed * c.depositPercent) / 100);
  const balance = t.agreedFeeAed - deposit;
  const dateStr = t.eventDate !== "TBC"
    ? new Date(t.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "TBC";

  return `# DJ PERFORMANCE AGREEMENT

**Date of Agreement:** ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}

This Agreement is made between the Client and Emy Vision Group, which furnishes
the services of the Artist. All fees, notices and approvals are handled by the
Company as the Client's single point of contact.

Parties:

**THE COMPANY** (contracting party, furnishing the services of the Artist)
${activeProfile().management.legalName}, trading as ${activeProfile().management.company}${activeProfile().management.tradeLicenceNo ? `\nTrade Licence No: ${activeProfile().management.tradeLicenceNo}` : "\nTrade Licence No: [ADD IN /profile]"}
Attn: ${activeProfile().management.contactName}, ${activeProfile().management.contactRole}
${activeProfile().management.email} · ${activeProfile().management.phone}

**THE ARTIST** (performer, engaged through the Company)
${activeProfile().legalName} professionally known as "${activeProfile().name}"
${activeProfile().basedIn}

**THE CLIENT**
${t.clientLegalName}
${t.clientAddress}

---

## 1. ENGAGEMENT

The Client engages the Artist to perform a DJ set on the terms below.

| Item | Detail |
|---|---|
| Event | ${g.title} |
| Venue | ${t.venueAddress} |
| Date | ${dateStr} |
| Load-in / soundcheck | ${t.loadInTime} |
| Performance time | ${t.setStart} – ${t.setEnd} |
| Set length | ${g.setLengthMins ? `${(g.setLengthMins / 60).toFixed(1)} hours` : "2 hours"} |
| Format | ${g.genresWanted.length ? g.genresWanted.join(", ") : activeProfile().genres.join(", ")} |

## 2. FEE AND PAYMENT

| | Amount | Due |
|---|---|---|
| **Total fee** | **${money(t.agreedFeeAed)}** | — |
| Deposit (${c.depositPercent}%) | ${money(deposit)} | On signature, no later than ${c.depositDueDays} days before the Event |
| Balance | ${money(balance)} | ${c.balanceDueDays === 0 ? "On the night, immediately following the performance" : `Within ${c.balanceDueDays} days of the Event`} |

2.1 All sums are payable to ${activeProfile().management.company}, not to the Artist directly. The fee is stated net of any bank charges, and net of VAT where applicable. Any withholding or transfer fees are borne by the Client.
2.2 The date is **not** held or confirmed until the deposit is received. Prior to receipt the Artist may accept competing engagements for the same date.
2.3 Late payment of the balance accrues interest at 2% per month or the maximum permitted by law, whichever is lower.
2.4 Any extension of the performance beyond the times in Clause 1, if agreed by the Artist on the night, is charged at ${money(Math.round(t.agreedFeeAed * 0.35))} per additional hour, payable same night.

## 3. CANCELLATION

3.1 If the Client cancels:
${c.cancellationTiers
  .sort((a, b) => a.withinDays - b.withinDays)
  .map((tier) => `  - Within ${tier.withinDays} days of the Event: the Artist retains ${tier.artistKeepsPercent}% of the total fee.`)
  .join("\n")}
  - More than ${Math.max(...c.cancellationTiers.map((x) => x.withinDays))} days before the Event: the deposit is retained by the Artist as a booking fee.

3.2 If the Artist cancels other than for reasons under Clause 8, the Artist shall refund the deposit in full and use reasonable efforts to propose a suitable replacement artist of comparable standing.

3.3 Postponement by the Client is treated as cancellation unless a replacement date within 6 months is agreed in writing within 7 days.

## 4. TECHNICAL REQUIREMENTS

The Client shall provide, at its own cost, in full working order and tested no later than 24 hours before the Event:

${activeProfile().techRider.mixer.map((x) => `- ${x}`).join("\n")}
${activeProfile().techRider.players.map((x) => `- ${x}`).join("\n")}
- ${activeProfile().techRider.monitors}
${activeProfile().techRider.booth.map((x) => `- ${x}`).join("\n")}
${activeProfile().techRider.connectivity.map((x) => `- ${x}`).join("\n")}

${activeProfile().techRider.notes.map((x) => `4.x ${x}`).join("\n")}

4.9 Failure to provide the specified equipment does not reduce the fee. If the Artist cannot reasonably perform due to equipment failure attributable to the Client, the full fee remains payable.

## 5. HOSPITALITY AND LOGISTICS

${activeProfile().hospitalityRider.map((x) => `- ${x}`).join("\n")}
${g.travelRequired ? `- Travel outside Dubai: return transport and, where the Event ends after 01:00 or is more than 90 minutes from Dubai, single-occupancy accommodation, both at the Client's cost.` : ""}

## 6. SOUND LIMITS AND VENUE COMPLIANCE

6.1 ${c.soundLimitPolicy}
6.2 The Client warrants it holds all licences, permits and approvals required for live/recorded music at the Venue on the date, including any permissions required from the relevant Dubai authorities.

## 7. PRESS, CONTENT AND INTELLECTUAL PROPERTY

7.1 **Artist IP.** ${c.ipPolicy}
7.2 **Recording.** ${c.recordingPolicy}
7.3 **Billing.** The Artist shall be billed as "${activeProfile().name}" in all promotional material. Artwork featuring the Artist's name or likeness shall be supplied to the Artist for approval not less than 48 hours before publication; approval shall not be unreasonably withheld.
7.4 **Content deliverables.** Where the Client requires the Artist to produce social content (reels, stories, posts) beyond incidental coverage of the performance, this is a separate deliverable and is charged separately. Nothing in this Agreement obliges the Artist to post.
7.5 **Client marks.** The Artist may use the Client's name, the Venue name and footage of the performance in her own portfolio, EPK and social channels.
7.6 **Music licensing.** Responsibility for public performance royalties in respect of recorded music played at the Venue rests with the Client.

## 8. FORCE MAJEURE

${c.forceMajeure}

## 9. EXCLUSIVITY

${
  t.exclusivityKm
    ? `9.1 The Artist agrees not to perform at any other public venue within ${t.exclusivityKm}km of the Venue in the 7 days before and 7 days after the Event. This restriction is reflected in the fee at Clause 2 and does not apply to private events, radio, streamed sets or festivals.`
    : `9.1 No exclusivity or radius restriction applies. The Artist is free to accept other engagements before, on and after the date of the Event.`
}

## 10. NON-CIRCUMVENTION

10.0 For 12 months following the Event, the Client shall not engage the Artist,
directly or through any third party, other than through ${activeProfile().management.company}. Any re-booking,
residency or additional date arising from this engagement shall be contracted
through the Company on the same terms.

## 11. GENERAL

11.1 The Artist performs as an independent contractor. Nothing creates employment, partnership or agency.
11.2 The Artist shall not be required to perform in conditions that are unsafe or that breach applicable law.
11.3 This Agreement is the entire agreement and supersedes prior discussions. Variations must be in writing and signed by both parties.
11.4 **Governing law.** ${c.governingLaw} The parties submit to the exclusive jurisdiction of the Dubai Courts.

---

## SIGNATURES

**FOR THE COMPANY — ${activeProfile().management.company}**
(for and on behalf of the Artist, ${activeProfile().name})

Name: ${activeProfile().management.contactName}   Position: ${activeProfile().management.contactRole}

Signature: __________________________  Date: ____________


**THE CLIENT**

Name: ______________________________  Position: ____________________

For and on behalf of: ${t.clientLegalName}

Signature: __________________________  Date: ____________

---
*Generated by GigRadar. Template — have a UAE-qualified lawyer review before first use.*
`;
}

export function generateRunsheet(g: Gig, t: DealTerms): string {
  const dateStr = t.eventDate !== "TBC" ? new Date(t.eventDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "TBC";
  const minus = (time: string, mins: number) => {
    const [h, m] = time.split(":").map(Number);
    const d = new Date(Date.UTC(2000, 0, 1, h, m - mins));
    return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
  };

  return `# RUNSHEET — ${g.venueName ?? g.title}
**${dateStr}** · ${t.venueAddress}

## Timings
| Time | Item |
|---|---|
| ${minus(t.loadInTime ?? "22:00", 60)} | Leave home — check traffic, Dubai weekend routes add 30min |
| ${t.loadInTime} | Load-in, meet venue contact, confirm booth access |
| ${minus(t.setStart ?? "23:00", 45)} | Soundcheck — test both CDJs, mixer channels, booth monitor level |
| ${minus(t.setStart ?? "23:00", 10)} | USBs loaded, backup USB in bag, phone on silent, water in booth |
| **${t.setStart}** | **SET START** |
| ${t.setEnd} | Set end — do not overrun without written agreement (extra hour = ${money(Math.round(t.agreedFeeAed * 0.35))}) |
| +15 min | Collect balance ${money(t.agreedFeeAed - Math.round((t.agreedFeeAed * activeProfile().contractDefaults.depositPercent) / 100))}, photo of payment confirmation |

## Pre-event checklist (T-7 days)
- [ ] Deposit received and cleared
- [ ] Contract signed by both parties, countersigned copy filed
- [ ] Tech rider acknowledged in writing by venue
- [ ] Equipment list confirmed — get a photo of the actual booth
- [ ] Artwork approved, correct billing "${activeProfile().name}"
- [ ] Guest list name submitted (+1)
- [ ] Parking / access instructions received
- [ ] Set prepared, crate built for the room and slot (${g.slot})

## Day-of kit
- [ ] 2x USB drives (primary + identical backup), both tested
- [ ] Headphones + spare
- [ ] RCA cable, USB-C hub, laptop + charger
- [ ] Cleaning wipes, gaffer tape
- [ ] Printed/PDF contract on phone
- [ ] Payment method ready (bank details card / payment link)

## On-the-night rules
1. Photograph the booth setup on arrival — evidence if equipment differs from rider.
2. Do not start until booth monitor level is under your control.
3. Any request to extend: agree the fee in writing (a WhatsApp message counts) BEFORE playing on.
4. Collect the balance before leaving the venue. Do not accept "we'll transfer Monday" unless it's in the contract.
5. Capture 2–3 short clips for content — you own this footage (Clause 7.5).

## Emergency contacts
${g.contacts.length ? g.contacts.map((c) => `- ${[c.name, c.role, c.phone ?? c.email ?? c.instagram].filter(Boolean).join(" · ")}`).join("\n") : "- ⚠️ No contacts on file — get the venue duty manager's mobile before the day."}
`;
}

/** Renders settlement details, or a clear prompt if they aren't set yet. */
function bankBlock(): string {
  const b = activeProfile().management.bank;
  if (!b) return "**Bank details:** [ADD IN /profile — Account name, Bank, IBAN, SWIFT]";
  return [
    "**Bank details**",
    "",
    `| | |`,
    `|---|---|`,
    `| Account name | ${b.accountName} |`,
    `| Bank | ${b.bankName} |`,
    `| IBAN | ${b.iban} |`,
    b.swift ? `| SWIFT/BIC | ${b.swift} |` : "",
    b.notes ? `| Notes | ${b.notes} |` : "",
  ].filter(Boolean).join("\n");
}

export function generateInvoice(g: Gig, t: DealTerms): string {
  const deposit = Math.round((t.agreedFeeAed * activeProfile().contractDefaults.depositPercent) / 100);
  const num = `INV-${new Date().getFullYear()}-${g.id.slice(0, 5).toUpperCase()}`;
  return `# INVOICE ${num}

**From:** ${activeProfile().management.legalName} t/a ${activeProfile().management.company}
${activeProfile().management.email} · ${activeProfile().management.phone}
Re: performance by ${activeProfile().name}
**To:** ${t.clientLegalName}, ${t.clientAddress}
**Date:** ${new Date().toLocaleDateString("en-GB")}
**Event:** ${g.title} — ${t.eventDate}

| Description | Amount |
|---|---|
| DJ performance, ${t.setStart}–${t.setEnd}, ${t.venueAddress} | ${money(t.agreedFeeAed)} |
| Less deposit received | −${money(deposit)} |
| **Balance due** | **${money(t.agreedFeeAed - deposit)}** |

**Payment terms:** ${activeProfile().contractDefaults.balanceDueDays === 0 ? "Due on the night of performance." : `Due within ${activeProfile().contractDefaults.balanceDueDays} days.`}
${bankBlock()}
*Payment to ${activeProfile().management.company} only. Direct payment to the Artist does not discharge this invoice.*

*Late payments accrue interest at 2% per month.*
`;
}

export function generatePressPack(g: Gig): string {
  return `# PRESS & CONTENT PACK — ${g.venueName ?? g.title}

## Approved billing
**${activeProfile().name}**

## Short bio (50 words)
${activeProfile().name} is a GCC-based Afro House, Afro Tech and open-format DJ — one of the region's
few female artists commanding a peak-time floor in the genre. Born of the Middle East
and built for the world, she reads a room in real time, moving fluently between English
and Arabic crowds. Every set is played live.

## Selected appearances
${activeProfile().selectedAppearances.map((x) => `- ${x}`).join("\n")}

## Handles — tag all of these
- Artist: ${activeProfile().instagram}
- Management: ${activeProfile().management.instagram} (${activeProfile().management.company})
- Live sets: ${activeProfile().youtube ?? ""}

## Approvals route
All artwork, billing and content approvals go through ${activeProfile().management.company}
(${activeProfile().management.email}), not to the Artist directly.

## What the venue must supply
- Event artwork for approval, min 48h before publication
- Confirmed billing position and set time for announcement
- Venue social handles for tagging
- Photographer/videographer contact, if any

## What the Artist supplies
- 2x approved press images (landscape + portrait)
- Logo files (PNG, transparent)
- 30s promo clip for stories
- Bio (50 / 150 word versions)

## Content rights summary
- Venue may use Artist name + approved images to promote **this event only**, licence ends 30 days after.
- Short-form clips under 90s permitted with credit and tag.
- Full-set recording for commercial release requires written consent and a separate fee.
- Artist retains all rights in her performance, name, likeness and mixes.
- Artist may use venue name and performance footage in her own portfolio and socials.

## Announcement checklist
- [ ] Artwork received and approved
- [ ] Name spelled correctly: **${activeProfile().name}**
- [ ] Artist tagged: ${activeProfile().instagram ?? "[handle]"}
- [ ] Management tagged: ${activeProfile().management.instagram ?? ""}
- [ ] Set time correct
- [ ] Artist reposts to story on announcement day
`;
}

export interface DealPack {
  contract: string;
  runsheet: string;
  invoice: string;
  pressPack: string;
  terms: DealTerms;
}

export function generateDealPack(g: Gig, overrides: Partial<DealTerms> = {}): DealPack {
  const terms = deriveTerms(g, overrides);
  return {
    terms,
    contract: generateContract(g, terms),
    runsheet: generateRunsheet(g, terms),
    invoice: generateInvoice(g, terms),
    pressPack: generatePressPack(g),
  };
}
