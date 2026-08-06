import { activeProfile } from "./active-profile";
import type { Gig } from "./types";
import { quoteFor, pitchFee } from "./outreach";

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
  const fee = overrides.agreedFeeAed ?? g.feeAed ?? pitchFee(g) ?? q.askAed ?? q.fee;
  return {
    agreedFeeAed: fee,
    eventDate: overrides.eventDate ?? g.eventDate ?? "TBC",
    setStart: overrides.setStart ?? "23:00",
    setEnd: overrides.setEnd ?? "01:00",
    loadInTime: overrides.loadInTime ?? "22:00",
    clientLegalName: overrides.clientLegalName ?? g.venueName ?? "[CLIENT LEGAL NAME]",
    clientAddress: overrides.clientAddress ?? "[CLIENT REGISTERED ADDRESS]",
    venueAddress: overrides.venueAddress ?? [g.venueName, "Dubai, UAE"].filter(Boolean).join(", "),
    exclusivityKm: overrides.exclusivityKm ?? (g.exclusivity ? 5 : 0),
  };
}

export function generateContract(g: Gig, t: DealTerms): string {
  const profile = activeProfile();
  const c = profile.contractDefaults;
  const deposit = Math.round((t.agreedFeeAed * c.depositPercent) / 100);
  const balance = t.agreedFeeAed - deposit;

  const exclusivitySection =
    t.exclusivityKm && t.exclusivityKm > 0
      ? `9.1 The Artist agrees not to perform at any other public venue within ${t.exclusivityKm}km of the Venue on the date of the Event.`
      : "9.1 No exclusivity or radius restriction applies. The Artist is free to accept other engagements before, on and after the date of the Event.";

  const techRiderList = profile.techRider.mixer
    .concat(profile.techRider.players)
    .concat([profile.techRider.monitors])
    .concat(profile.techRider.booth)
    .concat(profile.techRider.connectivity)
    .map((item) => `- ${item}`)
    .join("\n");

  const hospitalityList = profile.hospitalityRider.map((item) => `- ${item}`).join("\n");

  return `# DJ PERFORMANCE AGREEMENT

This Agreement is made between the Client and ${profile.management.company}, which furnishes the services of the Artist. All fees, notices and approvals are handled by the Company as the Client's single point of contact.

Parties:

**THE COMPANY** (contracting party, furnishing the services of the Artist)
${profile.management.legalName || "Emy Vision Group FZC"}, trading as ${profile.management.company}
Trade Licence No: ${profile.management.tradeLicenceNo || "4427087.01"}
${profile.management.address || "Business Centre, Sharjah Publishing City Free Zone, Sharjah, United Arab Emirates"}
Attn: ${profile.management.contactName}, ${profile.management.contactRole}
${profile.management.email} · ${profile.management.phone}

**THE ARTIST** (performer, engaged through the Company)
${profile.legalName} professionally known as "${profile.name}"
${profile.basedIn}

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
| Date | ${t.eventDate} |
| Load-in / soundcheck | ${t.loadInTime} |
| Performance time | ${t.setStart} – ${t.setEnd} |
| Set length | 2.0 hours |
| Format | Afro House, Afro Tech, Tribal |

## 2. FEE AND PAYMENT

| | Amount | Due |
|---|---|---|
| **Total fee** | **${money(t.agreedFeeAed)}** | — |
| Deposit (${c.depositPercent}%) | ${money(deposit)} | On signature, no later than 14 days before the Event |
| Balance | ${money(balance)} | On the night, immediately following the performance |

2.1 All sums are payable to ${profile.management.company}, not to the Artist directly. The fee is stated net of any bank charges, and net of VAT where applicable. Any withholding or transfer fees are borne by the Client.
2.2 The date is **not** held or confirmed until the deposit is received. Prior to receipt the Artist may accept competing engagements for the same date.
2.3 Late payment of the balance accrues interest at 2% per month or the maximum permitted by law, whichever is lower.
2.4 Any extension of the performance beyond the times in Clause 1, if agreed by the Artist on the night, is charged at AED 2,800 per additional hour, payable same night.

## 3. CANCELLATION

3.1 If the Client cancels:
  - Within 7 days of the Event: the Artist retains 100% of the total fee.
  - Within 14 days of the Event: the Artist retains 75% of the total fee.
  - Within 30 days of the Event: the Artist retains 50% of the total fee.
  - More than 30 days before the Event: the deposit is retained by the Artist as a booking fee.

3.2 If the Artist cancels other than for reasons under Clause 8, the Artist shall refund the deposit in full and use reasonable efforts to propose a suitable replacement artist of comparable standing.

## 4. TECHNICAL REQUIREMENTS

The Client shall provide, at its own cost, in full working order and tested no later than 24 hours before the Event:

${techRiderList}

- Artist travels with USB — house Pioneer setup preferred, adaptable to venue equipment
- Full soundcheck access minimum 45 minutes before doors
- Backline must be tested and confirmed working 24h before event
- Any substitution of specified equipment requires written approval

## 5. HOSPITALITY AND LOGISTICS

${hospitalityList}

## 6. SOUND LIMITS AND VENUE COMPLIANCE

6.1 Venue is responsible for compliance with all local noise ordinances. Artist fee is not reduced for venue-imposed volume restrictions.
6.2 The Client warrants it holds all licences, permits and approvals required for live/recorded music at the Venue on the date, including any permissions required from the relevant authorities.

## 7. PRESS, CONTENT AND INTELLECTUAL PROPERTY

7.1 **Artist IP.** The Artist retains all rights in her performance, name, likeness, logo and any mixes supplied. Venue is granted a limited, non-exclusive, revocable licence to use the Artist's name and approved press images solely to promote this engagement, for the period ending 30 days after the event.
7.2 **Recording.** Audio/video recording of the performance for commercial release requires prior written consent from Emy Vision Group. Short-form social clips (under 90 seconds) are permitted with credit and tag.
7.3 **Billing.** The Artist shall be billed as "${profile.name}" in all promotional material. Artwork featuring the Artist's name or likeness shall be supplied to the Artist for approval not less than 48 hours before publication.
7.4 **Music licensing.** Responsibility for public performance royalties in respect of recorded music played at the Venue rests with the Client.

## 8. FORCE MAJEURE

Neither party is liable for failure to perform due to events beyond reasonable control (including government restriction, extreme weather, or national mourning). Deposit is transferable to a mutually agreed rescheduled date within 6 months.

## 9. EXCLUSIVITY

${exclusivitySection}

## 10. NON-CIRCUMVENTION

10.1 For 12 months following the Event, the Client shall not engage the Artist, directly or through any third party, other than through ${profile.management.company}. Any re-booking, residency or additional date arising from this engagement shall be contracted through the Company on the same terms.

## 11. GENERAL

11.1 The Artist performs as an independent contractor. Nothing creates employment, partnership or agency.
11.2 **Governing law.** Laws of the Emirate of Dubai and applicable federal laws of the UAE. The parties submit to the exclusive jurisdiction of the Dubai Courts.

---

## SIGNATURES

**FOR THE COMPANY — Emy Vision Group**
(for and on behalf of the Artist, ${profile.name})

Name: ${profile.management.contactName}   Position: ${profile.management.contactRole}

Signature: __________________________  Date: ____________


**THE CLIENT**

Name: ______________________________  Position: ____________________

For and on behalf of: ${t.clientLegalName}

Signature: __________________________  Date: ____________
`;
}

export function generateInvoice(g: Gig, t: DealTerms): string {
  const profile = activeProfile();
  const bank = profile.management.bank || {
    accountName: "EMY VISION GROUP FZC",
    bankName: "Mashreqbank PSC (Mashreq NEO BIZ)",
    iban: "AE060330000019102008190",
    swift: "BOMLAEAD",
    notes: "AED account 019102008190. Other currencies on request: GBP/USD/EUR.",
    alternates: [
      { currency: "GBP", iban: "AE760330000019102008191" },
      { currency: "USD", iban: "AE490330000019102008192" },
      { currency: "EUR", iban: "AE220330000019102008193" },
    ],
  };

  const deposit = Math.round((t.agreedFeeAed * profile.contractDefaults.depositPercent) / 100);
  const balance = t.agreedFeeAed - deposit;

  const altLines = (bank.alternates || [
    { currency: "GBP", iban: "AE760330000019102008191" },
    { currency: "USD", iban: "AE490330000019102008192" },
    { currency: "EUR", iban: "AE220330000019102008193" },
  ])
    .map((a) => `- ${a.currency}: ${a.iban}`)
    .join("\n");

  return `# INVOICE

**From:** ${profile.management.legalName || "EMY VISION GROUP FZC"} t/a ${profile.management.company}
${profile.management.email} · ${profile.management.phone}
Re: performance by ${profile.name}
**To:** ${t.clientLegalName}, ${t.clientAddress}
**Event:** ${g.title} — ${t.eventDate}

| Description | Amount |
|---|---|
| DJ performance, ${t.setStart}–${t.setEnd}, ${t.venueAddress} | ${money(t.agreedFeeAed)} |
| Less deposit received | −${money(deposit)} |
| **Balance due** | **${money(balance)}** |

**Payment terms:** Due on the night of performance.
**Bank details**
| Field | Value |
|---|---|
| Account name | ${bank.accountName || "EMY VISION GROUP FZC"} |
| Bank | ${bank.bankName || "Mashreqbank PSC (Mashreq NEO BIZ)"} |
| IBAN | ${bank.iban || "AE060330000019102008190"} |
| SWIFT/BIC | ${bank.swift || "BOMLAEAD"} |
| Notes | ${bank.notes || "AED account. Other currencies on request: GBP/USD/EUR."} |

*Other currencies available on request:*
${altLines}

*Payment to ${profile.management.company} only. Direct payment to the Artist does not discharge this invoice.*

*Late payments accrue interest at 2% per month.*
`;
}

export function generateRunsheet(g: Gig, t: DealTerms): string {
  const profile = activeProfile();
  return `# RUNSHEET — ${g.title}
**${t.eventDate}** · ${t.venueAddress}

## Timings
| Time | Item |
|---|---|
| 21:00 | Leave home — check traffic |
| ${t.loadInTime || "22:00"} | Load-in, meet venue contact, confirm booth access |
| 22:15 | Soundcheck — test both CDJs, mixer channels, booth monitor level |
| 22:50 | USBs loaded, backup USB in bag, phone on silent, water in booth |
| **${t.setStart || "23:00"}** | **SET START** |
| ${t.setEnd || "01:00"} | Set end — do not overrun without written agreement |
| +15 min | Collect balance ${money(t.agreedFeeAed - Math.round((t.agreedFeeAed * profile.contractDefaults.depositPercent) / 100))}, photo of payment confirmation |

## Pre-event checklist (T-7 days)
- [ ] Deposit received and cleared
- [ ] Contract signed by both parties, countersigned copy filed
- [ ] Tech rider acknowledged in writing by venue
- [ ] Equipment list confirmed (Pioneer DJM-900NXS2 + 2x CDJ-3000)
- [ ] Artwork approved, correct billing "${profile.name}"
- [ ] Guest list name submitted (+1)
- [ ] Parking / access instructions received

## Day-of kit
- [ ] 2x USB drives (primary + identical backup), both tested
- [ ] Headphones + spare
- [ ] RCA cable, USB-C hub, laptop + charger
- [ ] Printed/PDF contract on phone

## Emergency contacts
- Venue Duty Manager: On file or obtain prior to event
- Management: ${profile.management.contactName} (${profile.management.phone})
`;
}

export function generatePressPack(g: Gig): string {
  const profile = activeProfile();
  const appearances = profile.selectedAppearances.map((a) => `- ${a}`).join("\n");
  const sellingPoints = profile.sellingPoints.map((s) => `- ${s}`).join("\n");

  return `# PRESS & CONTENT PACK — ${g.title}

## Approved billing
**${profile.name}**

## Short bio
${profile.name} is a GCC-based Afro House, Afro Tech and open-format DJ — one of the region's few female artists commanding a peak-time floor in the genre. She reads a room in real time, moving fluently between English and Arabic crowds. Every set is played live.

## Selected appearances
${appearances}

## Key positioning
${sellingPoints}

## Handles — tag all of these
- Artist: ${profile.instagram || "@dj_emy_"}
- Management: ${profile.management.instagram || "@evgroup2026"} (${profile.management.company})
- Live sets: ${profile.youtube || "https://youtube.com/@DJEMY-o6d"}

## Approvals route
All artwork, billing and content approvals go through ${profile.management.company} (${profile.management.email}), not to the Artist directly.
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
