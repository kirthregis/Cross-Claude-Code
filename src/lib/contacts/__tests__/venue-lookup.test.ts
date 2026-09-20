import { describe, it, expect, vi, afterEach } from "vitest";
import { findVenueContact } from "../venue-lookup";

/** A minimal fetch mock: `pages` maps a URL substring to a response body; anything else 404s. */
function mockFetch(pages: Record<string, string>) {
  return vi.fn(async (url: string) => {
    const match = Object.entries(pages).find(([k]) => String(url).includes(k));
    if (!match) return { ok: false, url, text: async () => "" };
    return { ok: true, url, text: async () => match[1] };
  });
}

describe("findVenueContact", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("finds a real events email and phone on the venue's own guessed-and-confirmed site", async () => {
    const site = `<html><body>Nammos Dubai — Contact us: events@nammos.ae or call +971581210000</body></html>`;
    vi.stubGlobal("fetch", mockFetch({ "nammos.com": site }));

    const contact = await findVenueContact("Nammos Dubai");
    expect(contact?.email).toBe("events@nammos.ae");
    expect(contact?.phone).toBe("+971581210000");
    expect(contact?.verified).toBe(true);
    expect(contact?.sourceUrl).toContain("nammos.com");
  });

  it("rejects a domain guess that only matches one short, common word — the false-positive case", async () => {
    // "act.com" is a real, unrelated company that happens to own the word
    // "act" — it must never be mistaken for "Act Restaurant, Lounge and bar"
    // just because the word "act" appears on its homepage.
    const unrelatedCompany = `<html><body>ACT is a mission-driven nonprofit that helps people act on their goals.</body></html>`;
    vi.stubGlobal("fetch", mockFetch({ "act.com": unrelatedCompany, "act.ae": unrelatedCompany }));

    expect(await findVenueContact("Act Restaurant, Lounge and bar")).toBeNull();
  });

  it("accepts the same venue once the fuller domain guess confirms two distinct words", async () => {
    const real = `<html><body>Act Restaurant — Dubai's newest lounge and bar. Book: events@actrestaurant.com</body></html>`;
    vi.stubGlobal("fetch", mockFetch({ "actrestaurant.com": real }));

    const contact = await findVenueContact("Act Restaurant, Lounge and bar");
    expect(contact?.email).toBe("events@actrestaurant.com");
  });

  it("accepts a single-word match when the word is distinctive, not a common dictionary word", async () => {
    const site = `<html><body>Zouk — nightlife group. Bookings: bookings@zouk.com</body></html>`;
    vi.stubGlobal("fetch", mockFetch({ "zouk.com": site }));

    const contact = await findVenueContact("Zouk nightclub");
    expect(contact?.email).toBe("bookings@zouk.com");
  });

  it("returns null rather than a guess when no candidate domain resolves", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, text: async () => "" })));
    expect(await findVenueContact("Sisters Lounge")).toBeNull();
  });

  it("returns null when a confirmed site publishes no email or phone", async () => {
    const site = `<html><body>Nammos Dubai — welcome to our beach club.</body></html>`;
    vi.stubGlobal("fetch", mockFetch({ "nammos.com": site }));

    expect(await findVenueContact("Nammos Dubai")).toBeNull();
  });
});
