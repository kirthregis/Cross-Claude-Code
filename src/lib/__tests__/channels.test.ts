import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { whatsappDeepLink, instagramDeepLink, mailtoLink, primaryPhone, actionLinks, channelStatus, whatsappConfigured, emailConfigured } from "../channels";
import { normalise } from "../extract";
import { nanoid } from "nanoid";
import type { Gig } from "../types";

const gig = (body: string): Gig => ({
  ...normalise({ sourceKind: "instagram", sourceName: "@promo", title: "DJ wanted", body, postedAt: new Date().toISOString() }),
  id: nanoid(10), score: 80, stage: "new",
});

describe("deep links", () => {
  it("builds a wa.me link with the pitch pre-filled", () => {
    const u = whatsappDeepLink("+971 50 111 2222", "Hi there!");
    expect(u).toContain("https://wa.me/971501112222");
    expect(u).toContain("text=Hi%20there!");
  });
  it("uses only the first number from a two-country display string, not both concatenated", () => {
    // profile.phone is "+971 50 344 3281 (UAE) · +974 7476 7686 (Qatar)" — verified
    // live: naively stripping non-digits from the whole string glued both
    // numbers into one 23-digit non-number, breaking the WhatsApp button on
    // Emy's digital business card entirely.
    const u = whatsappDeepLink("+971 50 344 3281 (UAE) · +974 7476 7686 (Qatar)", "Hi!");
    expect(u).toContain("https://wa.me/971503443281?");
    expect(u).not.toContain("97474767686");
  });
  it("primaryPhone extracts just the first number from a labelled multi-number string", () => {
    expect(primaryPhone("+971 50 344 3281 (UAE) · +974 7476 7686 (Qatar)")).toBe("+971 50 344 3281");
    expect(primaryPhone("+971 50 111 2222")).toBe("+971 50 111 2222"); // single number, unchanged
  });
  it("strips the @ from instagram handles", () => {
    expect(instagramDeepLink("@dj_emy_")).toBe("https://instagram.com/dj_emy_");
  });
  it("builds a mailto with subject and body", () => {
    const u = mailtoLink("a@b.com", "Sub ject", "Bo dy");
    expect(u).toContain("mailto:a@b.com");
    expect(u).toContain("subject=Sub%20ject");
  });
  it("caps very long prefilled messages", () => {
    expect(whatsappDeepLink("+971501112222", "x".repeat(5000)).length).toBeLessThan(2200);
  });
  it("caps a long mailto body so it stays under Windows' mailto: length limit", () => {
    // A real pitch email body (~1465 chars) produced a 2355-char mailto URL,
    // past the ~2083-char ShellExecute limit Windows' default mail handler
    // (Outlook desktop) has enforced since the IE era — verified live: the
    // Email button silently did nothing past that length.
    const u = mailtoLink("events@venue.ae", "DJ Booking Enquiry — Some Venue", "x".repeat(3000));
    expect(u.length).toBeLessThan(1900);
    expect(u).toContain("mailto:events@venue.ae");
  });
  it("leaves a short mailto body untouched", () => {
    const u = mailtoLink("a@b.com", "Sub", "A short body");
    expect(u).toBe("mailto:a@b.com?subject=Sub&body=A%20short%20body");
  });
});

describe("action links prioritise the decision-maker", () => {
  it("puts WhatsApp first when a phone is known", () => {
    const links = actionLinks(gig("Afro House DJ, AED 8000, WhatsApp +971 50 111 2222"), "pitch");
    expect(links[0].label).toMatch(/WhatsApp/);
  });
  it("offers email when only an email is known", () => {
    const links = actionLinks(gig("Afro House DJ, AED 8000, contact events@venue.ae"), "pitch");
    expect(links.some((l) => l.url.startsWith("mailto:"))).toBe(true);
  });
  it("always links back to the original post when available", () => {
    const g = { ...gig("Afro House DJ"), sourceUrl: "https://instagram.com/p/abc" };
    expect(actionLinks(g, "p").some((l) => l.url === "https://instagram.com/p/abc")).toBe(true);
  });
});

describe("channel configuration", () => {
  const saved = { ...process.env };
  beforeEach(() => { delete process.env.WHATSAPP_TOKEN; delete process.env.RESEND_API_KEY; });
  afterEach(() => { process.env = { ...saved }; });

  it("reports unconfigured when env vars are absent", () => {
    expect(whatsappConfigured()).toBe(false);
    expect(emailConfigured()).toBe(false);
  });

  it("reports configured once env vars are set", () => {
    process.env.WHATSAPP_TOKEN = "t";
    process.env.WHATSAPP_PHONE_ID = "p";
    process.env.WHATSAPP_TO = "+971500000000";
    expect(whatsappConfigured()).toBe(true);
  });

  it("is honest that Instagram alerts are not possible", () => {
    const ig = channelStatus().find((c) => c.id === "instagram")!;
    expect(ig.configured).toBe(false);
    expect(ig.setup).toMatch(/does not allow/i);
  });
});

describe("alert message formatting", () => {
  it("keeps blank lines so it is readable on a phone", async () => {
    process.env.APP_URL = "https://x.test";
    const { buildPlainMessage } = await import("../notify");
    const { scoreGig } = await import("../score");
    const base = normalise({
      sourceKind: "whatsapp", sourceName: "grp", title: "t",
      body: "Afro House DJ Saturday at Cove Beach, 2 hour peak slot, AED 6500. WhatsApp +971 50 442 1188",
      postedAt: new Date().toISOString(),
    });
    const s = scoreGig(base);
    const msg = buildPlainMessage({ ...base, id: "x1", score: s.score, stage: "new" }, s);

    expect(msg).toContain("\n\n");                 // paragraph breaks survive
    expect(msg).not.toMatch(/\n{3,}/);             // but no big gaps
    expect(msg.startsWith("\n")).toBe(false);
    expect(msg).toContain("Ask AED");
    expect(msg).toContain("https://wa.me/971504421188");
    expect(msg).toContain("https://x.test/gig/x1");
    // Plain text, not Markdown — asterisks would show literally in WhatsApp.
    expect(msg).not.toContain("*");
  });
});
