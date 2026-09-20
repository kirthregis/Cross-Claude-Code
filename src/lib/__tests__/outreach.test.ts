import { describe, it, expect } from "vitest";
import { nanoid } from "nanoid";
import { generateWhatsAppLink } from "../outreach";
import { normalise } from "../extract";
import { activeProfile } from "../active-profile";
import type { Gig } from "../types";

const baseGig = (overrides: Partial<Gig> = {}): Gig => ({
  ...normalise({ sourceKind: "gig_board", sourceName: "Coconut Jobs", title: "DJ — Nammos Dubai",
    body: "Hiring 1 Full Time DJ, to work in Dubai, United Arab Emirates.", postedAt: new Date().toISOString() }),
  id: nanoid(10), score: 40, stage: "new",
  ...overrides,
});

describe("generateWhatsAppLink", () => {
  it("targets the venue's own number, never Emy's own management number", () => {
    const gig = baseGig({ contacts: [{ phone: "+971501234567", whatsapp: "+971501234567" }] });
    const link = generateWhatsAppLink(gig);
    expect(link).toContain("971501234567");
    expect(link).not.toContain(activeProfile().management.phone.replace(/[^0-9]/g, ""));
  });

  it("falls back to a number stated in the posting itself when there's no structured contact", () => {
    const gig = baseGig({ body: "Hiring a DJ, WhatsApp +971 55 999 8888 to apply.", contacts: [] });
    const link = generateWhatsAppLink(gig);
    expect(link).toContain("971559998888");
  });

  it("opens WhatsApp's own contact picker — not Emy's number — when no venue number exists anywhere", () => {
    const gig = baseGig({ contacts: [] });
    const link = generateWhatsAppLink(gig);
    expect(link.startsWith("https://wa.me/?text=")).toBe(true);
    expect(link).not.toContain(activeProfile().management.phone.replace(/[^0-9]/g, ""));
  });
});
