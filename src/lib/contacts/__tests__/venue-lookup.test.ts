import { describe, it, expect, vi, afterEach } from "vitest";
import { findVenueContact } from "../venue-lookup";

const DDG_RESULTS = (links: { url: string; title: string }[]) =>
  `<div class="results">${links
    .map(
      (l) =>
        `<a class="result__a" href="//duckduckgo.com/l/?uddg=${encodeURIComponent(l.url)}&rut=abc">${l.title}</a>`,
    )
    .join("\n")}</div>`;

describe("findVenueContact", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("finds a real events email and phone on the venue's own official site", async () => {
    const search = DDG_RESULTS([
      { url: "https://www.facebook.com/NammosDUB/", title: "Nammos Dubai - Facebook" },
      { url: "https://www.nammos.com/dubai", title: "NAMMOS Dubai" },
    ]);
    const site = `<html><body>Contact us: events@nammos.ae or call +971581210000</body></html>`;
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("duckduckgo.com")) return { ok: true, text: async () => search };
      if (String(url).includes("nammos.com")) return { ok: true, text: async () => site };
      return { ok: false, text: async () => "" };
    });
    vi.stubGlobal("fetch", fetchMock);

    const contact = await findVenueContact("Nammos Dubai", "Dubai");
    expect(contact?.email).toBe("events@nammos.ae");
    expect(contact?.phone).toBe("+971581210000");
    expect(contact?.verified).toBe(true);
    expect(contact?.sourceUrl).toContain("nammos.com");
  });

  it("skips Facebook/Instagram/aggregator results — wants the venue's own domain", async () => {
    const search = DDG_RESULTS([
      { url: "https://www.instagram.com/somevenue/", title: "Some Venue - Instagram" },
      { url: "https://www.tripadvisor.com/somevenue", title: "Some Venue - Reviews" },
    ]);
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("duckduckgo.com")) return { ok: true, text: async () => search };
      return { ok: true, text: async () => "<html>no contact info here</html>" };
    });
    vi.stubGlobal("fetch", fetchMock);

    // Both results are aggregators/social platforms, not the venue's own site
    // — nothing left to look up, so this returns null rather than guessing.
    const contact = await findVenueContact("Some Venue", "Dubai");
    expect(contact).toBeNull();
  });

  it("returns null rather than a guess when the search finds nothing", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, text: async () => "" })));
    expect(await findVenueContact("Nonexistent Venue")).toBeNull();
  });

  it("returns null when a site is found but publishes no email or phone", async () => {
    const search = DDG_RESULTS([{ url: "https://www.somevenue.com/", title: "Some Venue" }]);
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).includes("duckduckgo.com")) return { ok: true, text: async () => search };
      return { ok: true, text: async () => "<html><body>Welcome to Some Venue.</body></html>" };
    });
    vi.stubGlobal("fetch", fetchMock);

    expect(await findVenueContact("Some Venue")).toBeNull();
  });
});
